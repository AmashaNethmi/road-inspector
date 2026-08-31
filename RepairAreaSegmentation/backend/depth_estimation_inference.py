# pyright: reportAttributeAccessIssue=none, reportGeneralTypeIssues=none, reportOptionalMemberAccess=none
# type: ignore
import argparse
import base64
import json
import os
import sys

import cv2
import numpy as np
import torch
from depth_anything_v2 import DepthAnythingV2

# Singleton model cache to avoid reloading
_DEPTH_MODEL = None
_DEVICE = None

def get_depth_model(model_path=None):
    global _DEPTH_MODEL, _DEVICE
    if _DEPTH_MODEL is not None:
        return _DEPTH_MODEL, _DEVICE

    _DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    if model_path is None or not os.path.exists(model_path):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(base_dir, 'models', 'depth_anything_v2_vits.pth')

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Depth Anything V2 weights not found at: {model_path}")

    model = DepthAnythingV2(encoder='vits', features=64, out_channels=[48, 96, 192, 384])
    state_dict = torch.load(model_path, map_location=_DEVICE)
    model.load_state_dict(state_dict)
    model.to(_DEVICE)
    model.eval()

    _DEPTH_MODEL = model
    return _DEPTH_MODEL, _DEVICE

def array_to_base64_jpeg(img_bgr, quality=90):
    _, buf = cv2.imencode('.jpg', img_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), quality])
    return f"data:image/jpeg;base64,{base64.b64encode(buf).decode('utf-8')}"

def colorize_depth_map(depth_norm, colormap=cv2.COLORMAP_INFERNO):
    """
    Colorize normalized depth [0, 1] into a vibrant scientific depth visualization.
    In monocular depth, higher values = closer/surface, lower values = deeper/further.
    For road damage indentation analysis, we invert or normalize so deeper depressions
    stand out clearly with intuitive hot-to-cold / dark-to-light thermal gradient.
    """
    depth_u8 = (np.clip(depth_norm, 0.0, 1.0) * 255.0).astype(np.uint8)
    colored = cv2.applyColorMap(depth_u8, colormap)
    return colored

def analyze_pothole_depth(depth_norm, mask=None, bbox=None):
    """
    Extract relative depth characteristics for a specific defect region.

    Args:
        depth_norm: 2D float32 numpy array in [0, 1] (relative depth)
        mask: optional binary mask (uint8 or bool) of the pothole
        bbox: optional [x1, y1, x2, y2] bounding box

    Returns:
        dict with min, max, mean relative depth, deepest point (x, y), and relative score.
    """
    h, w = depth_norm.shape[:2]
    
    if mask is not None and np.count_nonzero(mask) > 10:
        region_mask = mask.astype(bool)
        # Surround context (road surface around the pothole)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
        dilated_mask = cv2.dilate(mask.astype(np.uint8), kernel).astype(bool)
        surround_mask = dilated_mask & (~region_mask)
    elif bbox is not None:
        x1, y1, x2, y2 = [round(v) for v in bbox]
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)
        region_mask = np.zeros((h, w), dtype=bool)
        region_mask[y1:y2, x1:x2] = True
        surround_mask = None
    else:
        # Whole image analysis
        region_mask = np.ones((h, w), dtype=bool)
        surround_mask = None

    region_depths = depth_norm[region_mask]
    if len(region_depths) == 0:
        return None

    # Deepest point: in Depth Anything V2, lower numerical raw values often represent
    # larger physical distance from camera / depression, while higher values represent closer.
    # For a localized road patch, the lowest depth value relative to local road surface is the deepest point.
    min_val = float(np.min(region_depths))
    max_val = float(np.max(region_depths))
    mean_val = float(np.mean(region_depths))

    # Find coordinate of deepest point (minimum depth value within mask)
    masked_depth = np.full_like(depth_norm, fill_value=1e9)
    masked_depth[region_mask] = depth_norm[region_mask]
    min_loc = np.unravel_index(np.argmin(masked_depth), depth_norm.shape) # (row_y, col_x)
    deepest_x = int(min_loc[1])
    deepest_y = int(min_loc[0])
    deepest_rel_val = float(depth_norm[deepest_y, deepest_x])

    # Relative depth score (0 - 100)
    # Measures the relative depression depth compared to the local background / dynamic range
    if surround_mask is not None and np.count_nonzero(surround_mask) > 10:
        surround_mean = float(np.mean(depth_norm[surround_mask]))
        rel_drop = max(0.0, surround_mean - deepest_rel_val)
        depth_score = min(100.0, rel_drop * 250.0 + (max_val - min_val) * 100.0)
    else:
        depth_score = min(100.0, (max_val - min_val) * 150.0 + (1.0 - deepest_rel_val) * 50.0)

    return {
        'deepestPoint': {
            'x': deepest_x,
            'y': deepest_y,
            'relativeDepth': round(deepest_rel_val, 4)
        },
        'minDepth': round(min_val, 4),
        'maxDepth': round(max_val, 4),
        'meanDepth': round(mean_val, 4),
        'relativeDepthScore': round(float(depth_score), 2)
    }

def draw_deepest_point_marker(img_bgr, deepest_x, deepest_y, label="Deepest Point"):
    """
    Draw a high-contrast engineering target reticle and coordinate tag at the deepest point.
    """
    out = img_bgr.copy()
    x, y = int(deepest_x), int(deepest_y)
    
    # Outer animated-style pulsing target rings
    cv2.circle(out, (x, y), 16, (0, 255, 255), 2, cv2.LINE_AA) # Yellow ring
    cv2.circle(out, (x, y), 8, (0, 0, 255), 2, cv2.LINE_AA)   # Red ring
    cv2.circle(out, (x, y), 3, (255, 255, 255), -1, cv2.LINE_AA) # White center point
    
    # Crosshairs
    cv2.line(out, (x - 22, y), (x - 6, y), (0, 255, 255), 2, cv2.LINE_AA)
    cv2.line(out, (x + 6, y), (x + 22, y), (0, 255, 255), 2, cv2.LINE_AA)
    cv2.line(out, (x, y - 22), (x, y - 6), (0, 255, 255), 2, cv2.LINE_AA)
    cv2.line(out, (x, y + 6), (x, y + 22), (0, 255, 255), 2, cv2.LINE_AA)

    # Text badge
    tag = f"{label} ({x}, {y})"
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.45
    thickness = 1
    (text_w, text_h), _baseline = cv2.getTextSize(tag, font, font_scale, thickness)
    
    box_x1 = max(0, x - text_w // 2 - 4)
    box_y1 = max(0, y - 30 - text_h - 4)
    box_x2 = min(out.shape[1] - 1, box_x1 + text_w + 8)
    box_y2 = min(out.shape[0] - 1, box_y1 + text_h + 8)
    
    cv2.rectangle(out, (box_x1, box_y1), (box_x2, box_y2), (15, 23, 42), -1)
    cv2.rectangle(out, (box_x1, box_y1), (box_x2, box_y2), (0, 255, 255), 1)
    cv2.putText(out, tag, (box_x1 + 4, box_y2 - 4), font, font_scale, (255, 255, 255), thickness, cv2.LINE_AA)

    return out

def estimate_depth_pipeline(image_path, model_path=None, defects=None):
    """
    Main depth estimation pipeline.
    
    Args:
        image_path: Path to input road image
        model_path: Optional path to Depth Anything V2 weights
        defects: Optional list of detected defects from YOLO segmentation

    Returns:
        dict structured for API response
    """
    if not os.path.exists(image_path):
        return {'success': False, 'error': f'Image not found: {image_path}'}

    img_bgr = cv2.imread(image_path)
    if img_bgr is None:
        return {'success': False, 'error': f'Failed to decode image at {image_path}'}

    h_orig, w_orig = img_bgr.shape[:2]

    # Load model
    model, device = get_depth_model(model_path)

    # Run inference
    raw_depth = model.infer_image(img_bgr, input_size=518, device=device)

    # Robust normalization using percentiles
    depth_min = float(np.percentile(raw_depth, 2))
    depth_max = float(np.percentile(raw_depth, 98))
    if depth_max > depth_min:
        depth_norm = np.clip((raw_depth - depth_min) / (depth_max - depth_min), 0.0, 1.0)
    else:
        depth_norm = np.zeros_like(raw_depth)

    # Create colorized Depth Map
    depth_color = colorize_depth_map(depth_norm, cv2.COLORMAP_INFERNO)
    depth_map_b64 = array_to_base64_jpeg(depth_color, quality=92)

    # Analyze global deepest point
    global_analysis = analyze_pothole_depth(depth_norm)

    # Defect-by-defect depth analysis
    analyzed_defects = []
    deepest_overall = global_analysis['deepestPoint'] if global_analysis else {'x': w_orig // 2, 'y': h_orig // 2, 'relativeDepth': 0.5}
    max_defect_score = global_analysis['relativeDepthScore'] if global_analysis else 0.0

    # Defect-aware overlay should be based on the colorized depth map
    overlay_bgr = depth_color.copy()

    if defects and len(defects) > 0:
        for idx, defect in enumerate(defects):
            bbox = defect.get('bbox')
            polygon = defect.get('polygon')
            
            mask = None
            if polygon and len(polygon) >= 3:
                mask = np.zeros((h_orig, w_orig), dtype=np.uint8)
                pts = np.array(polygon, dtype=np.int32)
                cv2.fillPoly(mask, [pts], 1)
                # Draw the defect boundary on the depth map
                cv2.polylines(overlay_bgr, [pts], isClosed=True, color=(0, 255, 0), thickness=2)
            
            analysis = analyze_pothole_depth(depth_norm, mask=mask, bbox=bbox)
            if analysis:
                defect_info = {
                    'id': defect.get('id', idx + 1),
                    'class_name': defect.get('class_name', 'pothole'),
                    'deepestPoint': analysis['deepestPoint'],
                    'minRelativeDepth': analysis['minDepth'],
                    'maxRelativeDepth': analysis['maxDepth'],
                    'meanRelativeDepth': analysis['meanDepth'],
                    'relativeDepthScore': analysis['relativeDepthScore']
                }
                analyzed_defects.append(defect_info)

                # Keep track of defect with highest depth score
                if analysis['relativeDepthScore'] > max_defect_score:
                    max_defect_score = analysis['relativeDepthScore']
                    deepest_overall = analysis['deepestPoint']

                # Draw reticle on overlay
                overlay_bgr = draw_deepest_point_marker(
                    overlay_bgr,
                    analysis['deepestPoint']['x'],
                    analysis['deepestPoint']['y'],
                    label=f"Pothole #{defect.get('id', idx + 1)} Deepest"
                )
    else:
        # No specific pothole bounding boxes passed — draw global deepest marker
        if global_analysis:
            overlay_bgr = draw_deepest_point_marker(
                overlay_bgr,
                global_analysis['deepestPoint']['x'],
                global_analysis['deepestPoint']['y'],
                label="Deepest Road Point"
            )

    depth_overlay_b64 = array_to_base64_jpeg(overlay_bgr, quality=92)

    return {
        'success': True,
        'raw_depth': raw_depth,
        'depth_map': depth_map_b64,
        'depthMap': depth_map_b64,
        'depthOverlay': depth_overlay_b64,
        'depth_overlay': depth_overlay_b64,
        'depth_model': 'Depth Anything V2 (ViT-Small)',
        'depth_mode': 'relative',
        'depth_min': depth_min,
        'depth_max': depth_max,
        'minDepth': global_analysis['minDepth'] if global_analysis else 0.0,
        'maxDepth': global_analysis['maxDepth'] if global_analysis else 1.0,
        'deepestPoint': deepest_overall,
        'potholeDepthScore': max_defect_score,
        'relativeDepth': {
            'score': max_defect_score,
            'label': 'Relative Depth',
            'min': global_analysis['minDepth'] if global_analysis else 0.0,
            'max': global_analysis['maxDepth'] if global_analysis else 1.0,
            'mean': global_analysis['meanDepth'] if global_analysis else 0.5
        },
        'defects': analyzed_defects,
        'modelUsed': 'Depth Anything V2 (ViT-Small)',
        'calibration': {
            'type': 'relative',
            'unit': 'normalized relative depth (0 - 1)',
            'method': 'Monocular Vision Depth Estimation (Pretrained ViT-S Backbone)',
            'metricCalibrated': False,
            'note': 'Monocular RGB estimation provides relative depth representation. Metric centimetre calibration requires camera intrinsics or known ground reference targets.'
        }
    }

def main():
    parser = argparse.ArgumentParser(description="Depth Anything V2 Monocular Depth Estimation Service")
    parser.add_argument('--image_path', type=str, required=True, help="Path to input road image")
    parser.add_argument('--model_path', type=str, default=None, help="Path to Depth Anything V2 weights")
    parser.add_argument('--defects_json', type=str, default=None, help="JSON string of defect regions/polygons")

    args = parser.parse_args()

    defects = None
    if args.defects_json:
        try:
            defects = json.loads(args.defects_json)
        except Exception as e:  # noqa: BLE001
            sys.stderr.write(f"Warning: Failed to parse defects_json: {e}\n")

    result = estimate_depth_pipeline(args.image_path, args.model_path, defects=defects)
    json_safe_result = {k: v for k, v in result.items() if k != 'raw_depth'}
    print(json.dumps(json_safe_result))

if __name__ == '__main__':
    main()
