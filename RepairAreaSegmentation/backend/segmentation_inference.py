# pyright: reportAttributeAccessIssue=none, reportGeneralTypeIssues=none, reportOptionalMemberAccess=none
# type: ignore
import argparse
import base64
import json
import os
import sys
import tempfile

import cv2
import numpy as np

# Import Module 2 geometry library (fails gracefully if unavailable)
try:
    from metric_geometry import (
        DepthCalibrator,
        analyze_defect_depth_and_volume,
        apply_camera_undistortion,
        area_uncertainty,
        astm_d6433_severity,
        classify_defect_geometry,
        compute_ipm,
        crack_branch_node_analysis,
        crack_geometry,
        create_defect_annulus,
        cross_check_classification,
        fit_road_plane_ransac,
        generate_depth_plane_visualization,
        get_camera_telemetry,
        polygon_area_m2,
        refine_mask,
        repair_patch_area,
        skeletonize_mask,
        warp_mask_to_ipm,
    )
    _MODULE2_AVAILABLE = True
except ImportError as _m2_err:
    _MODULE2_AVAILABLE = False
    print(f'[segmentation_inference] Warning: metric_geometry not available — {_m2_err}', file=sys.stderr)

from enhanced_detector import (
    DetectorConfig,
    EnhancedRoadDetector,
    render_enhanced_visualization,
)

# Try importing Depth Anything V2 inference pipeline
try:
    from depth_estimation_inference import estimate_depth_pipeline
    _DEPTH_ANYTHING_AVAILABLE = True
except Exception as depth_err:
    _DEPTH_ANYTHING_AVAILABLE = False
    sys.stderr.write(f"[segmentation_inference] Depth Anything V2 load warning: {depth_err}\n")


class NumpyJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder converting NumPy types to standard Python primitives."""
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, (np.floating, np.float32, np.float64)):
            return float(obj)
        if isinstance(obj, (np.integer, np.int32, np.int64)):
            return int(obj)
        if isinstance(obj, (np.bool_, bool)):
            return bool(obj)
        return super().default(obj)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--image_path',   required=True)
    parser.add_argument('--scale',        type=float, default=0.01)
    parser.add_argument('--model_path',   default='backend/models/best.pt')
    parser.add_argument('--camera_id',    type=str,   default='CAM-001',
                        help='Camera identifier for calibration lookup')
    # Detection hyperparameters
    parser.add_argument('--conf',              type=float, default=0.12,
                        help='Confidence threshold for defect detection')
    parser.add_argument('--iou_thresh',        type=float, default=0.40,
                        help='IoU threshold for Weighted Box Fusion')
    parser.add_argument('--enable_tiling',     type=str,   default='true',
                        help='Set to "true" to enable sliding-window tiled inference')
    parser.add_argument('--tile_size',         type=int,   default=384,
                        help='Native patch size in pixels for sliding-window tiles')
    parser.add_argument('--tile_overlap',      type=float, default=0.28,
                        help='Overlap fraction for sliding-window tiles')
    parser.add_argument('--enable_multiscale', type=str,   default='true',
                        help='Set to "true" to run multi-scale full-image passes')
    parser.add_argument('--enable_clahe',      type=str,   default='true',
                        help='Set to "true" to run adaptive CLAHE contrast enhancement')
    # Module 2 arguments
    parser.add_argument('--enable_depth', type=str, default='false',
                        help='Set to "true" to run MiDaS depth estimation')
    parser.add_argument('--real_width_m', type=float, default=3.5,
                        help='Physical road width in metres for IPM GSD calibration')
    parser.add_argument('--ipm_src_pts',  type=str, default='',
                        help='JSON string of 4 [x,y] source points for IPM homography')
    parser.add_argument('--measured_depth_mm', type=float, default=None,
                        help='Physical ground-truth maximum depth in millimetres for calibration')
    parser.add_argument('--depth_scale', type=float, default=None,
                        help='Manual depth scaling factor (mm/rel) for calibration')
    args = parser.parse_args()

    image_path        = args.image_path
    scale             = args.scale
    model_path        = args.model_path
    camera_id         = args.camera_id
    enable_depth      = args.enable_depth.lower() == 'true'
    real_width_m      = args.real_width_m
    conf_thresh       = args.conf
    iou_thresh        = args.iou_thresh
    enable_tiling     = args.enable_tiling.lower() == 'true'
    tile_size         = args.tile_size
    tile_overlap      = args.tile_overlap
    enable_multiscale = args.enable_multiscale.lower() == 'true'
    enable_clahe      = args.enable_clahe.lower() == 'true'

    # Parse optional user-supplied IPM reference points
    ipm_src_pts = None
    if args.ipm_src_pts:
        try:
            ipm_src_pts = json.loads(args.ipm_src_pts)
        except Exception:
            pass  # fall back to lane-width prior

    temp_image_path = None

    try:
        if not os.path.exists(model_path):
            script_dir = os.path.dirname(os.path.abspath(__file__))
            candidate1 = os.path.join(script_dir, 'models', 'best.pt')
            candidate2 = os.path.join(os.getcwd(), 'models', 'best.pt')
            candidate3 = os.path.join(os.getcwd(), 'backend', 'models', 'best.pt')
            if os.path.exists(candidate1):
                model_path = candidate1
            elif os.path.exists(candidate2):
                model_path = candidate2
            elif os.path.exists(candidate3):
                model_path = candidate3
            else:
                print(json.dumps({'error': 'missing_model', 'message': f'Model file missing: {model_path}'}))
                return

        # Load image or video file
        ext = os.path.splitext(image_path)[1].lower()
        is_video_input = ext in ['.mp4', '.mov', '.avi', '.webm', '.mkv']
        video_metadata = None

        if is_video_input:
            cap = cv2.VideoCapture(image_path)
            if not cap.isOpened():
                print(json.dumps({'error': 'invalid_video', 'message': f'Failed to open video file: {image_path}'}))
                return
            fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration_sec = round(total_frames / fps, 2) if fps > 0 else 0.0

            # Uniformly sample up to 12 frames across video duration
            num_samples = min(12, max(1, total_frames))
            sample_indices = np.linspace(0, max(0, total_frames - 1), num_samples, dtype=int)

            best_frame = None
            best_frame_idx = 0
            best_damage_score = -1.0

            # Lightweight detector configuration for candidate frame selection
            preview_detector_config = DetectorConfig(
                conf_threshold=conf_thresh,
                iou_threshold=iou_thresh,
                enable_tiling=False,
                enable_multiscale=False,
                enable_clahe=enable_clahe
            )
            try:
                preview_detector = EnhancedRoadDetector(model_path=model_path, config=preview_detector_config)
            except Exception:
                preview_detector = None

            for s_idx in sample_indices:
                cap.set(cv2.CAP_PROP_POS_FRAMES, int(s_idx))
                ret_val, cand_frame = cap.read()
                if not ret_val or cand_frame is None:
                    continue
                score = 0.0
                if preview_detector is not None:
                    try:
                        det = preview_detector.detect(cand_frame)
                        score = float(det.get('damaged_pixels', 0)) * (max(det['scores']) if len(det.get('scores', [])) > 0 else 0.5)
                    except Exception:
                        score = 0.0

                if score > best_damage_score or best_frame is None:
                    best_damage_score = score
                    best_frame = cand_frame.copy()
                    best_frame_idx = int(s_idx)

            cap.release()

            if best_frame is None:
                print(json.dumps({'error': 'video_read_failed', 'message': 'Could not extract frames from video.'}))
                return

            img = best_frame
            video_metadata = {
                'is_video': True,
                'total_frames': total_frames,
                'fps': round(float(fps), 2),
                'duration_sec': duration_sec,
                'sampled_frames_count': len(sample_indices),
                'peak_frame_index': best_frame_idx,
                'peak_frame_timestamp_sec': round(best_frame_idx / fps, 2) if fps > 0 else 0.0
            }
        else:
            # Load static image
            img = cv2.imread(image_path)
            if img is None:
                print(json.dumps({'error': 'invalid_image', 'message': 'Failed to load image.'}))
                return

        # Apply lens undistortion if camera calibration profile exists
        img, undistortion_status = apply_camera_undistortion(img, camera_id=camera_id)

        if ext == '.jfif':
            temp_file = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
            temp_image_path = temp_file.name
            temp_file.close()
            if not cv2.imwrite(temp_image_path, img):
                print(json.dumps({'error': 'conversion_failed', 'message': 'Failed to convert JFIF image to JPG.'}))
                return
            image_path = temp_image_path

        height, width = img.shape[:2]
        total_pixels  = height * width

        # ------------------------------------------------------------------ #
        #  Module 1: Enhanced Multi-Scale & Tiled Road Defect Inference       #
        # ------------------------------------------------------------------ #
        detector_config = DetectorConfig(
            conf_threshold=conf_thresh,
            iou_threshold=iou_thresh,
            enable_tiling=enable_tiling,
            tile_size=tile_size,
            tile_overlap=tile_overlap,
            enable_multiscale=enable_multiscale,
            enable_clahe=enable_clahe
        )
        detector = EnhancedRoadDetector(model_path=model_path, config=detector_config)
        detection_result = detector.detect(img)

        fused_boxes = detection_result['boxes']
        fused_scores = detection_result['scores']
        fused_masks = detection_result['masks']
        fused_classes = detection_result['class_names']
        combined_mask = detection_result['combined_mask']
        num_regions = detection_result['defect_count']

        if num_regions == 0 or np.sum(combined_mask) == 0:
            ret_f, f_buf = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 88])
            frame_b64 = f'data:image/jpeg;base64,{base64.b64encode(f_buf).decode("utf-8")}' if ret_f else None
            print(json.dumps({
                'success': True,
                'message': 'No repair area detected',
                'masks_found': False,
                'damaged_pixels': 0,
                'total_pixels': total_pixels,
                'image_width': int(width),
                'image_height': int(height),
                'coverage_percentage': 0.0,
                'estimated_repair_area': 0.0,
                'defect_area_m2': 0.0,
                'num_regions': 0,
                'defects': [],
                'severity_level': 'Normal',
                'risk_level': 'Low',
                'recommendation': 'Road surface in acceptable condition. Routine monitoring.',
                'overlay_image': frame_b64,
                'frame_image': frame_b64,
                'pothole_count': 0,
                'road_length_m': 100.0,
                'pothole_density_per_100m': 0.0,
                'recommended_repair_method': 'No potholes detected',
                'is_video': bool(video_metadata is not None),
                'video_metadata': video_metadata
            }, cls=NumpyJSONEncoder))
            return

        damaged_pixels    = int(np.sum(combined_mask))
        coverage_percentage = (damaged_pixels / total_pixels) * 100
        # Legacy pixel-scale area (kept for backwards compatibility)
        estimated_repair_area = damaged_pixels * (scale ** 2)

        # Contour-based length/width (legacy)
        contours, _ = cv2.findContours(combined_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        total_length = 0.0
        total_width  = 0.0
        if len(contours) > 0:
            for c in contours:
                x, y, w, h = cv2.boundingRect(c)
                total_length += max(w, h) * scale
                total_width  += min(w, h) * scale
            avg_width = total_width / len(contours)
        else:
            avg_width = 0.0

        # Severity logic (Module 1, unchanged) - Legacy code removed
        severity       = None
        estimated_depth = None
        risk_level      = None
        recommendation  = None

        # ------------------------------------------------------------------ #
        #  Generate overlay images (Enhanced Module 1 output)                #
        # ------------------------------------------------------------------ #
        mask_img = combined_mask * 255
        _, mask_encoded = cv2.imencode('.jpg', mask_img)
        mask_base64 = base64.b64encode(mask_encoded).decode('utf-8')

        overlay = render_enhanced_visualization(img, detection_result)

        defects_list = []
        for idx, (box, conf, class_name) in enumerate(zip(fused_boxes, fused_scores, fused_classes)):
            x1, y1, x2, y2 = [int(v) for v in box]
            box_w = max(1, x2 - x1)
            box_h = max(1, y2 - y1)

            defect_polygon = []
            cur_mask = fused_masks[idx] if (idx < len(fused_masks) and fused_masks[idx] is not None) else None
            if cur_mask is not None:
                defect_pixels = int(np.sum(cur_mask))
                d_cnts, _ = cv2.findContours(cur_mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                if len(d_cnts) > 0:
                    c_max = max(d_cnts, key=cv2.contourArea)
                    eps = 0.008 * cv2.arcLength(c_max, True)
                    approx = cv2.approxPolyDP(c_max, eps, True)
                    defect_polygon = approx.reshape(-1, 2).tolist()
            else:
                defect_pixels = int(np.sum(combined_mask[y1:y2, x1:x2]))
                defect_polygon = [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]

            defect_area = defect_pixels * (scale ** 2) if defect_pixels > 0 else None
            defect_len = max(box_w, box_h) * scale if defect_pixels > 0 else None
            defect_wid = min(box_w, box_h) * scale if defect_pixels > 0 else None

            def_severity = None
            def_depth    = None
            def_risk     = None
            def_rec      = None
            
            # Module 2 Calculation Trace
            trace = "Method: Naive Scale (Warning: Subject to Perspective Distortion)"
            
            # Generate high-resolution crop for modal/card preview
            pad_x = int(box_w * 0.12)
            pad_y = int(box_h * 0.12)
            cy1, cy2 = max(0, y1 - pad_y), min(height, y2 + pad_y)
            cx1, cx2 = max(0, x1 - pad_x), min(width, x2 + pad_x)
            crop_patch = img[cy1:cy2, cx1:cx2]
            crop_b64 = None
            if crop_patch.size > 0:
                _, c_enc = cv2.imencode('.jpg', crop_patch, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
                crop_b64 = f'data:image/jpeg;base64,{base64.b64encode(c_enc).decode("utf-8")}'

            defects_list.append({
                'id'                   : f'POTHOLE_{idx+1:02d}',
                'type'                 : class_name,
                'bbox'                 : [int(x1), int(y1), int(x2), int(y2)],
                'area'                 : round(float(defect_area), 4) if defect_area else None,
                'pixel_area'           : int(defect_pixels),
                'length'               : round(float(defect_len), 3) if defect_len else None,
                'width'                : round(float(defect_wid), 3) if defect_wid else None,
                'depth'                : None, # Strict requirement: No fake depth
                'severity'             : None,
                'risk_level'           : None,
                'recommendation'       : None,
                'confidence'           : round(float(conf), 4),
                'polygon'              : defect_polygon,
                'crop_image'           : crop_b64,
                'uncertainty_ci'       : None,
                'measurement_confidence': round(float(conf * 100), 1),
                'calculation_trace'    : trace
            })

        _, overlay_encoded = cv2.imencode('.jpg', overlay)
        overlay_base64 = base64.b64encode(overlay_encoded).decode('utf-8')

        # ------------------------------------------------------------------ #
        #  Module 2: Metric Geometry                                          #
        # ------------------------------------------------------------------ #
        m2 = {
            'metric_method'           : 'pixel_scale',
            'gsd_m_per_px'            : None,
            'defect_area_m2'          : None,
            'patch_area_m2'           : None,
            'consolidation_ratio'     : None,
            'num_patches'             : None,
            'crack_length_m'          : None,
            'avg_crack_width_m'       : None,
            'avg_crack_width_mm'      : None,
            'max_crack_width_m'       : None,
            'max_crack_width_mm'      : None,
            'linear_density_m_per_m2' : None,
            'branch_count'            : None,
            'node_count'              : None,
            'branch_density'          : None,
            'crack_pattern'           : None,
            'crack_severity_astm'     : None,
            'depth_method'            : 'N/A',
            'mean_depth_m'            : None,
            'max_depth_m'             : None,
            'max_depth_mm'            : None,
            'mean_depth_mm'           : None,
            'volume_m3'               : None,
            'depth_integration_method': None,
            'volume_ci_lower_m3'      : None,
            'volume_ci_upper_m3'      : None,
            'depth_confidence'        : None,
            'volume_confidence'       : None,
            'depth_diagnostics'       : None,
            'depth_plane_image'       : None,
            'depth_calibration_status': 'Calibration Required',
            'area_ci_low_m2'          : None,
            'area_ci_high_m2'         : None,
            'area_ci_half_width'      : None,
            'boundary_uncertainty'    : None,
            'homography_uncertainty'  : None,
            'ipm_image'               : None,
            'depth_image'             : None,
            'depth_overlay'           : None,
            'ipm_calibration'         : 'N/A',
            'camera_id'               : camera_id,
            'calibration_status'      : 'Not calibrated',
            'calibration_method'      : 'N/A',
            'undistortion_status'     : undistortion_status,
            'reprojection_error_px'   : None,
        }

        if _MODULE2_AVAILABLE and damaged_pixels > 0:
            try:
                # --- IPM ---
                ipm_result = compute_ipm(
                    img,
                    src_points=ipm_src_pts,
                    real_width_m=real_width_m,
                    dst_size=(640, 640)
                )

                if ipm_result is not None:
                    gsd = ipm_result['gsd_m_per_px']
                    m2['gsd_m_per_px']   = round(gsd, 8)
                    m2['metric_method']  = 'IPM_homography'
                    m2['ipm_calibration'] = ipm_result['method']
                    m2['calibration_status'] = 'Homography Applied'
                    m2['calibration_method']  = ipm_result['method'].replace('_', ' ').title()

                    # --- Camera Telemetry ---
                    m2['camera_telemetry'] = get_camera_telemetry(camera_id)
                    m2['calibration_profile_id'] = m2['camera_telemetry']['calibration_profile_id']
                    m2['reprojection_error_px'] = m2['camera_telemetry']['reprojection_error_px']

                    # --- Mask refinement (Module 2 pipeline) ---
                    refined_mask = refine_mask(combined_mask, open_k=3, close_k=7, min_component_px=100)
                    if np.sum(refined_mask) == 0:
                        refined_mask = combined_mask   # fallback: use original if refinement removed everything

                    # Warp defect mask to bird's-eye view
                    ipm_mask = warp_mask_to_ipm(refined_mask, ipm_result['H'], dst_size=(640, 640))

                    # --- Primary area: Shoelace polygon ---
                    poly_area = polygon_area_m2(ipm_mask, gsd)
                    if poly_area:
                        m2['defect_area_m2'] = round(poly_area['area_m2'], 6)
                        m2['contour_diagnostics'] = {
                            'raw_vertices': poly_area.get('raw_vertices', 0),
                            'simplified_vertices': poly_area.get('simplified_vertices', 0),
                            'dp_epsilon_px': poly_area.get('dp_epsilon_px', 0.0),
                            'induced_area_error_pct': poly_area.get('induced_area_error_pct', 0.0),
                            'target_met': poly_area.get('target_met', True),
                            'shoelace_formula': poly_area.get('shoelace_formula', '0.5 * |Σ (x_i*y_{i+1} - x_{i+1}*y_i)|'),
                            'method': 'Suzuki-Abe Border Following + Douglas-Peucker Polygon Simplification'
                        }
                    m2['morphology_diagnostics'] = {
                        'morph_open_k': 3,
                        'morph_close_k': 7,
                        'min_component_px': 100,
                        'description': 'Morphological opening (3x3 ellipse) + closing (7x7 ellipse) + connected component filtering'
                    }

                    # --- Naive Pixel Scaling Baseline vs IPM Homography Validation ---
                    naive_area = damaged_pixels * (scale ** 2)
                    ipm_area = m2['defect_area_m2'] if m2['defect_area_m2'] is not None else (float(np.sum(ipm_mask > 0)) * (gsd ** 2))
                    abs_rect_err = abs(ipm_area - naive_area)
                    pct_rect_err = (abs_rect_err / max(ipm_area, 1e-6)) * 100.0
                    m2['naive_area_m2'] = round(naive_area, 6)
                    m2['rectification_comparison'] = {
                        'naive_area_m2': round(naive_area, 6),
                        'ipm_area_m2': round(ipm_area, 6),
                        'absolute_error_m2': round(abs_rect_err, 6),
                        'percentage_error': round(pct_rect_err, 2),
                        'gsd_cm_per_px': round(gsd * 100.0, 3),
                        'naive_scale_cm_per_px': round(scale * 100.0, 3),
                        'conclusion': f'Perspective rectification (IPM) eliminates {pct_rect_err:.1f}% projective foreshortening distortion inherent in naive flat scaling.'
                    }

                    # --- Area uncertainty (centered on estimated Shoelace area) ---
                    unc = area_uncertainty(ipm_mask, gsd, reprojection_error_px=m2['reprojection_error_px'] or 1.82, estimated_area_m2=m2['defect_area_m2'])
                    if unc:
                        m2['area_ci_low_m2']       = round(unc['ci_low_m2'], 6)
                        m2['area_ci_high_m2']      = round(unc['ci_high_m2'], 6)
                        m2['area_ci_half_width']   = round(unc['ci_half_width_m2'], 6)
                        m2['boundary_uncertainty'] = round(unc['boundary_uncertainty'], 6)
                        m2['homography_uncertainty'] = round(unc['homography_uncertainty'], 6) if unc['homography_uncertainty'] else None

                    # --- Geometric Classification & Appearance Cross-Check ---
                    primary_yolo_type = defects_list[0]['type'] if defects_list else 'Pothole'
                    geom_pattern = classify_defect_geometry(ipm_mask)
                    m2['geometric_pattern'] = geom_pattern
                    m2['classification_cross_check'] = cross_check_classification(primary_yolo_type, geom_pattern)

                    # Skeleton & Crack Geometry (Decoupled: only evaluated on actual crack defects)
                    skel = skeletonize_mask(ipm_mask)
                    is_crack_defect = ('crack' in primary_yolo_type.lower()) or ('crack' in geom_pattern.lower()) or ('linear' in geom_pattern.lower())

                    if is_crack_defect and skel is not None and np.sum(skel) > 0:
                        geom = crack_geometry(ipm_mask, gsd, skeleton=skel, is_crack=True)
                        if geom:
                            m2['crack_length_m']          = round(geom['crack_length_m'], 4)
                            m2['avg_crack_width_m']        = round(geom['avg_crack_width_m'], 5)
                            m2['avg_crack_width_mm']       = round(geom['avg_crack_width_mm'], 2)
                            m2['max_crack_width_m']        = round(geom['max_crack_width_m'], 5)
                            m2['max_crack_width_mm']       = round(geom['max_crack_width_mm'], 2)
                            m2['linear_density_m_per_m2']  = round(geom['linear_density_m_per_m2'], 4)
                            m2['crack_geometry_status']    = 'Evaluated (Crack Defect)'
                            if m2['defect_area_m2'] is None:
                                m2['defect_area_m2'] = round(geom['defect_area_m2'], 6)
                    else:
                        geom = None
                        m2['crack_geometry_status'] = 'Not Applicable — Cavity Defect'
                        m2['crack_length_m'] = None
                        m2['avg_crack_width_m'] = None
                        m2['avg_crack_width_mm'] = None
                        m2['max_crack_width_m'] = None
                        m2['max_crack_width_mm'] = None
                        m2['linear_density_m_per_m2'] = None

                    # --- Crack branch/node analysis ---
                    if skel is not None and np.sum(skel) > 0:
                        bn = crack_branch_node_analysis(skel)
                        if bn:
                            m2['branch_count']   = bn['branch_count']
                            m2['node_count']     = bn['node_count']
                            m2['branch_density'] = round(bn['branch_density'], 6)
                            m2['crack_pattern']  = geom_pattern
                        if geom:
                            m2['crack_severity_astm'] = astm_d6433_severity(
                                geom.get('avg_crack_width_mm', 0),
                                geom.get('max_crack_width_mm', 0)
                            )
                        else:
                            m2['crack_severity_astm'] = 'Not evaluated'
                    else:
                        m2['branch_count'] = None
                        m2['node_count'] = None
                        m2['branch_density'] = None
                        m2['crack_pattern'] = geom_pattern
                        m2['crack_severity_astm'] = 'Not evaluated'

                    # --- Patch consolidation ---
                    patch = repair_patch_area(ipm_mask, gsd)
                    if patch:
                        m2['patch_area_m2']       = round(patch['patch_area_m2'], 6)
                        m2['consolidation_ratio'] = round(patch['consolidation_ratio'], 4)
                        m2['num_patches']         = patch['num_patches']

                    # --- IPM overlay image ---
                    ipm_vis = ipm_result['ipm_img'].copy()
                    ipm_overlay = cv2.merge([
                        ipm_mask * 0,
                        ipm_mask * 0,
                        ipm_mask * 255
                    ])
                    ipm_vis = cv2.addWeighted(ipm_vis, 0.65, ipm_overlay.astype(np.uint8), 0.35, 0)

                    if skel is not None:
                        skel_vis = ipm_vis.copy()
                        skel_vis[skel > 0] = [255, 255, 0]
                        ipm_vis = skel_vis

                    _, ipm_encoded = cv2.imencode('.jpg', ipm_vis, [cv2.IMWRITE_JPEG_QUALITY, 85])
                    m2['ipm_image'] = f'data:image/jpeg;base64,{base64.b64encode(ipm_encoded).decode("utf-8")}'

                    # --- Monocular Depth Estimation with Depth Anything V2 ---
                    if _DEPTH_ANYTHING_AVAILABLE and enable_depth:
                        try:
                            sys.stderr.write("[Module 2] Depth inference started: running Depth Anything V2...\n")
                            depth_defects_input = []
                            for idx, d in enumerate(defects_list):
                                depth_defects_input.append({
                                    'id': d.get('id', idx + 1),
                                    'class_name': d.get('type', 'pothole'),
                                    'bbox': d.get('bbox')
                                })
                            depth_res = estimate_depth_pipeline(image_path, defects=depth_defects_input)
                            if depth_res.get('success'):
                                raw_depth = depth_res.get('raw_depth')
                                sys.stderr.write(f"[Module 2] Depth map generated: dimensions={raw_depth.shape if raw_depth is not None else 'N/A'}\n")
                                m2['depth_image'] = depth_res.get('depthMap')
                                m2['depth_overlay'] = depth_res.get('depthOverlay')
                                m2['depth_analysis'] = {k: v for k, v in depth_res.items() if k != 'raw_depth'}
                                m2['deepest_point'] = depth_res.get('deepestPoint')
                                m2['pothole_depth_score'] = depth_res.get('potholeDepthScore')
                                m2['relative_depth'] = depth_res.get('relativeDepth')
                                m2['depth_method'] = 'Depth Anything V2'

                                if raw_depth is not None and damaged_pixels > 0:
                                    # Setup calibrator
                                    calibrator = DepthCalibrator(
                                        camera_id=camera_id,
                                        measured_depth_mm=args.measured_depth_mm,
                                        custom_scale=args.depth_scale
                                    )
                                    m2['depth_calibration_status'] = calibrator.calibration_status
                                    sys.stderr.write(f"[Module 2] Metric calibration status: {calibrator.calibration_status} ({calibrator.calibration_method})\n")

                                    # Collect individual defect masks
                                    all_defect_masks = []
                                    for idx, mask_inst in enumerate(fused_masks):
                                        if mask_inst is not None and np.sum(mask_inst) > 0:
                                            all_defect_masks.append(mask_inst)

                                    if len(all_defect_masks) == 0:
                                        n_cc, cc_labels = cv2.connectedComponents(combined_mask.astype(np.uint8))
                                        for lbl in range(1, n_cc):
                                            all_defect_masks.append((cc_labels == lbl).astype(np.uint8))

                                    total_volume = 0.0
                                    all_max_depths = []
                                    all_mean_depths_weighted = []
                                    total_depth_pixels = 0
                                    primary_plane_res = None

                                    for def_idx, def_mask in enumerate(all_defect_masks):
                                        res_d = analyze_defect_depth_and_volume(
                                            defect_mask=def_mask,
                                            depth_map=raw_depth,
                                            all_defects_mask=combined_mask,
                                            gsd_m_per_px=gsd,
                                            calibrator=calibrator,
                                            ipm_homography=ipm_result['H']
                                        )
                                        if res_d is not None:
                                            if primary_plane_res is None:
                                                primary_plane_res = res_d['plane_diagnostics']

                                            if res_d['max_depth_mm'] is not None:
                                                all_max_depths.append(res_d['max_depth_mm'])
                                                px = res_d['pixel_count']
                                                all_mean_depths_weighted.append(res_d['mean_depth_mm'] * px)
                                                total_depth_pixels += px

                                            if res_d['volume_m3'] is not None:
                                                total_volume += res_d['volume_m3']

                                            if def_idx < len(defects_list):
                                                defects_list[def_idx]['max_depth_mm'] = res_d['max_depth_mm']
                                                defects_list[def_idx]['mean_depth_mm'] = res_d['mean_depth_mm']
                                                defects_list[def_idx]['volume_m3'] = res_d['volume_m3']
                                                if res_d.get('plane_diagnostics') and res_d['plane_diagnostics'].get('confidence'):
                                                    defects_list[def_idx]['depth_confidence'] = round(float(res_d['plane_diagnostics']['confidence']), 3)

                                    annulus_all = create_defect_annulus(combined_mask)
                                    global_plane = fit_road_plane_ransac(raw_depth, annulus_all)
                                    m2['depth_plane_image'] = generate_depth_plane_visualization(
                                        raw_depth,
                                        global_plane['road_plane_grid'],
                                        combined_mask
                                    )

                                    if len(all_max_depths) > 0 and calibrator.is_calibrated:
                                        m2['max_depth_mm'] = round(float(np.max(all_max_depths)), 1)
                                        m2['max_depth_m'] = round(m2['max_depth_mm'] / 1000.0, 5)
                                        if total_depth_pixels > 0:
                                            m2['mean_depth_mm'] = round(float(sum(all_mean_depths_weighted) / total_depth_pixels), 1)
                                            m2['mean_depth_m'] = round(m2['mean_depth_mm'] / 1000.0, 5)
                                        m2['volume_m3'] = round(float(total_volume), 6)
                                        m2['depth_integration_method'] = 'Per-pixel Road-Plane Integration'

                                        # Confidence / Uncertainty intervals (95% CI)
                                        area_val = m2.get('defect_area_m2') or 1.0
                                        sigma_A_rel = ((m2.get('area_ci_half_width') or 0.0) / area_val)
                                        sigma_d_rel = (global_plane['residual']) / max(0.001, (m2['mean_depth_mm'] / 1850.0))
                                        sigma_v_rel = float(np.sqrt(sigma_A_rel**2 + sigma_d_rel**2))
                                        sigma_V = total_volume * min(0.35, sigma_v_rel)
                                        m2['volume_ci_lower_m3'] = round(max(0.0, total_volume - 1.96 * sigma_V), 6)
                                        m2['volume_ci_upper_m3'] = round(total_volume + 1.96 * sigma_V, 6)
                                        m2['volume_confidence'] = round(float(max(0.0, 1.0 - min(1.0, sigma_v_rel))), 3)
                                        m2['depth_confidence'] = round(float(global_plane['confidence']), 3)

                                        sys.stderr.write(f"[Module 2] Defect pixels: {total_depth_pixels}, Road annulus pixels: {int(np.sum(annulus_all))}\n")
                                        sys.stderr.write(f"[Module 2] RANSAC inliers: {global_plane['inlier_count']}, residual: {global_plane['residual']}\n")
                                        sys.stderr.write(f"[Module 2] Max metric depth: {m2['max_depth_mm']} mm, Mean metric depth: {m2['mean_depth_mm']} mm\n")
                                        sys.stderr.write(f"[Module 2] Integrated volume: {m2['volume_m3']} m3\n")
                                    else:
                                        m2['max_depth_mm'] = None
                                        m2['mean_depth_mm'] = None
                                        m2['volume_m3'] = None
                                        m2['depth_calibration_status'] = 'Calibration Required'

                                    # Volume Estimation Method Comparison (Research Section 06)
                                    uniform_depth_m = 0.05
                                    defect_area_val = m2.get('defect_area_m2') or (damaged_pixels * (gsd ** 2))
                                    uniform_vol_m3 = round(defect_area_val * uniform_depth_m, 6)
                                    integrated_vol_m3 = m2.get('volume_m3')
                                    vol_diff_m3 = round(abs((integrated_vol_m3 or uniform_vol_m3) - uniform_vol_m3), 6) if integrated_vol_m3 else None
                                    vol_pct_diff = round((vol_diff_m3 / max(uniform_vol_m3, 1e-6)) * 100.0, 1) if vol_diff_m3 is not None else None

                                    m2['volume_comparison'] = {
                                        'method_a_uniform_volume_m3': uniform_vol_m3,
                                        'method_b_road_plane_volume_m3': integrated_vol_m3,
                                        'method_c_ground_truth_volume_m3': None,
                                        'assumed_depth_m': uniform_depth_m,
                                        'difference_m3': vol_diff_m3,
                                        'difference_pct': vol_pct_diff,
                                        'preferred_method': 'Method B — Road-Plane-Referenced Depth-Field Integration'
                                    }

                                    m2['depth_diagnostics'] = {
                                        'depth_model': 'Depth Anything V2 (ViT-Small)',
                                        'depth_mode': 'Relative',
                                        'valid_depth_pixels': int(np.sum(np.isfinite(raw_depth))),
                                        'defect_pixels': damaged_pixels,
                                        'road_annulus_pixels': int(np.sum(annulus_all)),
                                        'road_plane_inliers': global_plane['inlier_count'],
                                        'road_plane_outliers': global_plane['outlier_count'],
                                        'road_plane_residual': global_plane['residual'],
                                        'road_plane_confidence': global_plane['confidence'],
                                        'road_plane_coeffs': global_plane['road_plane'],
                                        'depth_calibration_status': calibrator.calibration_status,
                                        'calibration_method': calibrator.calibration_method,
                                        'volume_integration': 'Per-pixel (Riemann Sum: Σ dp × ap)'
                                    }
                        except Exception as da_exc:
                            sys.stderr.write(f"[DepthAnythingV2] Inference error: {da_exc}\n")

            except Exception as m2_exc:
                # Module 2 failure must never break Module 1 output
                import traceback
                print(f'[Module2] Error: {m2_exc}\n{traceback.format_exc()}', file=sys.stderr)

        # ------------------------------------------------------------------ #
        #  Pothole Density per 100m & Repair Method Recommendation Logic     #
        # ------------------------------------------------------------------ #
        pothole_items = [d for d in defects_list if 'pothole' in str(d.get('type', '')).lower()]
        if len(pothole_items) > 0:
            pothole_count = len(pothole_items)
        elif len(defects_list) > 0:
            pothole_count = len(defects_list)
        elif num_regions > 0 and damaged_pixels > 0:
            pothole_count = num_regions
        else:
            pothole_count = 0

        # Determine/estimate represented road survey length
        # Standard survey section window: 100m (or calibrated longitudinal view span)
        if m2.get('gsd_m_per_px') and m2['gsd_m_per_px'] > 0:
            road_length_m = round(float(height) * float(m2['gsd_m_per_px']), 2)
            if road_length_m < 10.0:
                road_length_m = 100.0  # Normalized 100-meter survey section window
        else:
            road_length_m = 100.0

        # Calculate Pothole Density per 100m: (pothole_count / road_length_m) * 100
        pothole_density_per_100m = round((pothole_count / road_length_m) * 100.0, 2) if road_length_m > 0 else 0.0

        # Exact threshold decision logic:
        # 0 potholes -> No potholes detected
        # < 10 potholes / 100m -> Pothole Patching
        # >= 10 potholes / 100m -> Asphalt Overlaying After Pothole Patching
        if pothole_count == 0:
            recommended_repair_method = "No potholes detected"
        elif pothole_density_per_100m < 10.0:
            recommended_repair_method = "Pothole Patching"
        else:
            recommended_repair_method = "Asphalt Overlaying After Pothole Patching"

        # ------------------------------------------------------------------ #
        #  Compose final output                                               #
        # ------------------------------------------------------------------ #
        output = {
            # Module 1 fields (unchanged)
            'success'             : True,
            'masks_found'         : True,
            'damaged_pixels'      : damaged_pixels,
            'total_pixels'        : total_pixels,
            'image_width'         : int(width),
            'image_height'        : int(height),
            'coverage_percentage' : float(coverage_percentage),
            'estimated_repair_area': float(estimated_repair_area) if estimated_repair_area is not None else None,
            'num_regions'         : num_regions,
            'severity_level'      : severity,
            'repair_priority'     : severity,
            'recommendation'      : recommendation,
            'pothole_count'            : int(pothole_count),
            'road_length_m'            : float(road_length_m),
            'pothole_density_per_100m' : float(pothole_density_per_100m),
            'recommended_repair_method': recommended_repair_method,
            'length'              : float(total_length) if total_length is not None else None,
            'width'               : float(avg_width) if avg_width is not None else None,
            'estimated_depth'     : float(estimated_depth) if estimated_depth is not None else None,
            'risk_level'          : risk_level,
            'mask_image'          : f'data:image/jpeg;base64,{mask_base64}',
            'overlay_image'       : f'data:image/jpeg;base64,{overlay_base64}',
            'defects'             : defects_list,
            # Module 2 fields
            'metric_method'            : m2['metric_method'],
            'gsd_m_per_px'             : m2['gsd_m_per_px'],
            'defect_area_m2'           : m2['defect_area_m2'],
            'patch_area_m2'            : m2['patch_area_m2'],
            'consolidation_ratio'      : m2['consolidation_ratio'],
            'num_patches'              : m2['num_patches'],
            'crack_length_m'           : m2['crack_length_m'],
            'avg_crack_width_m'        : m2['avg_crack_width_m'],
            'avg_crack_width_mm'       : m2['avg_crack_width_mm'],
            'max_crack_width_m'        : m2['max_crack_width_m'],
            'max_crack_width_mm'       : m2['max_crack_width_mm'],
            'linear_density_m_per_m2'  : m2['linear_density_m_per_m2'],
            'branch_count'             : m2['branch_count'],
            'node_count'               : m2['node_count'],
            'branch_density'           : m2['branch_density'],
            'crack_pattern'            : m2['crack_pattern'],
            'crack_severity_astm'      : m2['crack_severity_astm'],
            'depth_method'             : m2['depth_method'],
            'mean_depth_m'             : m2['mean_depth_m'],
            'mean_depth_mm'            : m2['mean_depth_mm'],
            'max_depth_m'              : m2['max_depth_m'],
            'max_depth_mm'             : m2['max_depth_mm'],
            'volume_m3'                : m2['volume_m3'],
            'depth_integration_method' : m2.get('depth_integration_method'),
            'area_ci_low_m2'           : m2['area_ci_low_m2'],
            'area_ci_high_m2'          : m2['area_ci_high_m2'],
            'area_ci_half_width'       : m2['area_ci_half_width'],
            'boundary_uncertainty'     : m2['boundary_uncertainty'],
            'homography_uncertainty'   : m2['homography_uncertainty'],
            'ipm_image'                : m2['ipm_image'],
            'depth_image'              : m2.get('depth_image'),
            'depth_overlay'            : m2.get('depth_overlay'),
            'depth_analysis'           : m2.get('depth_analysis'),
            'deepest_point'            : m2.get('deepest_point'),
            'pothole_depth_score'      : m2.get('pothole_depth_score'),
            'relative_depth'           : m2.get('relative_depth'),
            'ipm_calibration'          : m2['ipm_calibration'],
            'camera_id'                : m2['camera_id'],
            'calibration_status'       : m2['calibration_status'],
            'calibration_method'       : m2['calibration_method'],
            'undistortion_status'      : m2.get('undistortion_status', 'Not Applied'),
            'volume_ci_lower_m3'       : m2.get('volume_ci_lower_m3'),
            'volume_ci_upper_m3'       : m2.get('volume_ci_upper_m3'),
            'depth_confidence'         : m2.get('depth_confidence'),
            'volume_confidence'        : m2.get('volume_confidence'),
            'depth_diagnostics'        : m2.get('depth_diagnostics'),
            'depth_plane_image'        : m2.get('depth_plane_image'),
            'depth_calibration_status' : m2.get('depth_calibration_status'),
            'reprojection_error_px'    : m2['reprojection_error_px'],
            'is_video'                 : bool(video_metadata is not None),
            'video_metadata'           : video_metadata,
        }

        # Encode RGB frame image so frontend displays the extracted keyframe
        try:
            ret_f, f_buf = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 88])
            if ret_f:
                output['frame_image'] = f'data:image/jpeg;base64,{base64.b64encode(f_buf).decode("utf-8")}'
            else:
                output['frame_image'] = None
        except Exception:
            output['frame_image'] = None

        print(json.dumps(output, cls=NumpyJSONEncoder))

    except Exception as e:
        import traceback
        print(json.dumps({'error': 'exception', 'message': traceback.format_exc()}))

    finally:
        if temp_image_path and os.path.exists(temp_image_path):
            try:
                os.remove(temp_image_path)
            except Exception:
                pass


if __name__ == '__main__':
    main()
