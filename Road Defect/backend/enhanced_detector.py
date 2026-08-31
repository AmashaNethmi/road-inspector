# pyright: reportAttributeAccessIssue=none, reportGeneralTypeIssues=none, reportOptionalMemberAccess=none
# type: ignore
"""
enhanced_detector.py — High-Recall Multi-Scale & Tiled Road Damage Detection Engine
Road Inspector AI Research Platform — IT22252340

Provides:
  - DetectorConfig            : Centralized configuration dataclass for all detection hyperparameters
  - EnhancedRoadDetector      : High-resolution multi-scale + overlapping tiled inference with Weighted Box Fusion
  - render_enhanced_visualization : Research-grade visualization with non-obstructing labels and translucent polygon masks
"""

import os
from dataclasses import dataclass
from typing import Any

import cv2
import numpy as np
from ultralytics import YOLO


def resolve_model_path(candidate_path: str) -> str:
    """Resolve model weights across potential backend, root, and training directories."""
    if candidate_path and os.path.exists(candidate_path):
        return candidate_path

    search_candidates = [
        candidate_path,
        os.path.join(os.path.dirname(__file__), 'models', 'best.pt'),
        os.path.join(os.path.dirname(__file__), '..', 'models', 'best.pt'),
        os.path.join(os.path.dirname(__file__), '..', 'src', 'dataset', 'Train model', 'crack-seg', 'weights', 'best.pt'),
        os.path.join(os.path.dirname(__file__), '..', 'src', 'dataset', 'Train model', 'best.pt'),
        os.path.join(os.path.dirname(__file__), '..', '..', 'RepairAreaSegmentation', 'backend', 'models', 'best.pt'),
        os.path.join(os.path.dirname(__file__), '..', '..', 'RepairAreaSegmentation', 'src', 'dataset', 'Train model', 'crack-seg', 'weights', 'best.pt'),
        'runs/crack_seg/train_exp/weights/best.pt',
        'backend/models/best.pt',
        'models/best.pt',
        'best.pt'
    ]

    for p in search_candidates:
        if p and os.path.exists(p):
            return os.path.abspath(p)

    return candidate_path or 'yolov8n-seg.pt'


@dataclass
class DetectorConfig:
    """
    Hyperparameters and runtime settings for the enhanced road defect detector.
    Avoids magic numbers throughout the codebase.
    """
    conf_threshold: float = 0.12          # Balanced confidence threshold for high recall without excessive FPs
    iou_threshold: float = 0.40           # IoU threshold for Weighted Box Fusion / duplicate suppression
    enable_tiling: bool = True            # Enable overlapping sliding window (tiled) inference
    tile_size: int = 384                  # Native patch size in pixels for sliding window
    tile_overlap: float = 0.28            # Overlap ratio between adjacent sliding window tiles (28%)
    enable_multiscale: bool = True        # Run multi-scale full-image passes
    multiscale_sizes: tuple[int, ...] = (640, 960) # Inference image sizes for multi-scale pass
    enable_clahe: bool = True             # Contrast Limited Adaptive Histogram Equalization for shadowed defects
    clahe_clip_limit: float = 2.0         # CLAHE contrast clipping limit
    clahe_grid_size: tuple[int, int] = (8, 8) # CLAHE grid tile dimensions
    min_box_area_px: int = 25             # Minimum pixel area for a valid defect box (filters single-pixel noise)
    wbf_cluster_iou: float = 0.40         # IoU threshold to cluster bounding boxes in Weighted Box Fusion


def compute_box_iou(box1: list[float], box2: list[float]) -> float:
    """Calculate Intersection over Union (IoU) between two [x1, y1, x2, y2] boxes."""
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])
    
    inter_w = max(0.0, x2 - x1)
    inter_h = max(0.0, y2 - y1)
    inter_area = inter_w * inter_h
    
    area1 = max(0.0, box1[2] - box1[0]) * max(0.0, box1[3] - box1[1])
    area2 = max(0.0, box2[2] - box2[0]) * max(0.0, box2[3] - box2[1])
    union_area = area1 + area2 - inter_area
    
    return inter_area / union_area if union_area > 0.0 else 0.0


def apply_adaptive_clahe(img: np.ndarray, clip_limit: float = 2.0, grid_size: tuple[int, int] = (8, 8)) -> np.ndarray:
    """
    Enhance local contrast in shadowed, low-contrast, or wet road regions
    using CLAHE on the luminance (L) channel in LAB color space.
    """
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=grid_size)
    cl = clahe.apply(l)
    enhanced_lab = cv2.merge((cl, a, b))
    return cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)


def weighted_box_and_mask_fusion(
    boxes: list[list[float]],
    scores: list[float],
    masks: list[np.ndarray],
    classes: list[int],
    iou_thresh: float = 0.40,
    img_shape: tuple[int, int] = (640, 640)
) -> tuple[list[list[float]], list[float], list[np.ndarray], list[int]]:
    """
    Performs Weighted Box Fusion (WBF) and binary mask logical combination across
    multi-scale passes and overlapping sliding-window tiles.
    """
    if len(boxes) == 0:
        return [], [], [], []

    np_boxes = np.array(boxes, dtype=float)
    np_scores = np.array(scores, dtype=float)
    np_classes = np.array(classes, dtype=int)

    # Sort descending by confidence score
    order = np_scores.argsort()[::-1]
    np_boxes = np_boxes[order]
    np_scores = np_scores[order]
    np_classes = np_classes[order]
    sorted_masks = [masks[i] for i in order]

    clusters: list[dict[str, Any]] = []

    for i in range(len(np_boxes)):
        box = np_boxes[i]
        score = np_scores[i]
        cls_id = np_classes[i]
        mask = sorted_masks[i]

        matched_cluster = None
        best_iou = 0.0

        for cluster in clusters:
            if cluster['class_id'] != cls_id:
                continue

            # Average weighted bounding box of existing cluster
            cluster_weights = np.array(cluster['scores'])
            c_box = np.average(cluster['boxes'], axis=0, weights=cluster_weights)
            iou = compute_box_iou(box.tolist(), c_box.tolist())

            if iou > iou_thresh and iou > best_iou:
                best_iou = iou
                matched_cluster = cluster

        if matched_cluster is not None:
            matched_cluster['boxes'].append(box)
            matched_cluster['scores'].append(score)
            matched_cluster['masks'].append(mask)
        else:
            clusters.append({
                'class_id': cls_id,
                'boxes': [box],
                'scores': [score],
                'masks': [mask]
            })

    fused_boxes: list[list[float]] = []
    fused_scores: list[float] = []
    fused_masks: list[np.ndarray] = []
    fused_classes: list[int] = []

    H, W = img_shape

    for cluster in clusters:
        weights = np.array(cluster['scores'], dtype=float)
        # Coordinate fusion: weighted average coordinates
        weighted_box = np.average(cluster['boxes'], axis=0, weights=weights)
        
        # Confidence score: dominant detection with confidence reinforcement for multi-pass agreement
        max_score = float(np.max(weights))
        agreement_bonus = min(0.08, 0.02 * (len(cluster['boxes']) - 1))
        fused_score = min(1.0, max_score + agreement_bonus)

        # Mask fusion: logical OR across all matching predictions in cluster
        combined_cluster_mask = np.zeros((H, W), dtype=np.uint8)
        for m in cluster['masks']:
            if m is not None and m.shape == (H, W):
                combined_cluster_mask = np.logical_or(combined_cluster_mask, m).astype(np.uint8)

        # Ensure box boundaries are clipped to image
        x1 = max(0.0, min(float(W - 1), float(weighted_box[0])))
        y1 = max(0.0, min(float(H - 1), float(weighted_box[1])))
        x2 = max(0.0, min(float(W), float(weighted_box[2])))
        y2 = max(0.0, min(float(H), float(weighted_box[3])))

        # If mask is empty, construct a fallback rectangle mask
        if np.sum(combined_cluster_mask) == 0:
            combined_cluster_mask[int(y1):int(y2), int(x1):int(x2)] = 1

        fused_boxes.append([x1, y1, x2, y2])
        fused_scores.append(fused_score)
        fused_masks.append(combined_cluster_mask)
        fused_classes.append(cluster['class_id'])

    return fused_boxes, fused_scores, fused_masks, fused_classes


class EnhancedRoadDetector:
    """
    Advanced High-Recall Road Defect Detector with multi-scale aggregation,
    tiled sliding-window inference, and Weighted Box Fusion.
    """

    def __init__(self, model_path: str, config: DetectorConfig | None = None):
        self.model_path = resolve_model_path(model_path)
        self.config = config or DetectorConfig()
        self.model = YOLO(self.model_path)
        self.class_names = self.model.names if hasattr(self.model, 'names') else {0: 'Pothole'}

    def detect(self, img: np.ndarray) -> dict[str, Any]:
        """
        Execute full multi-scale + tiled inference on an input image.

        Args:
            img: BGR image (H×W×3 numpy array)

        Returns:
            Dictionary containing:
              - 'boxes'         : List of [x1, y1, x2, y2]
              - 'scores'        : List of confidence floats
              - 'classes'       : List of class IDs (int)
              - 'class_names'   : List of class names (str)
              - 'masks'         : List of binary uint8 masks for each defect
              - 'combined_mask' : Combined binary defect mask (H×W uint8, 1=defect)
              - 'defect_count'  : Total number of detected road damages
        """
        H, W = img.shape[:2]
        all_raw_boxes: list[list[float]] = []
        all_raw_scores: list[float] = []
        all_raw_masks: list[np.ndarray] = []
        all_raw_classes: list[int] = []

        # ------------------------------------------------------------------ #
        #  Phase 1: Multi-scale global inference passes                       #
        # ------------------------------------------------------------------ #
        scales = list(self.config.multiscale_sizes) if self.config.enable_multiscale else [640]
        # For large images (>1000px in either dim), add 1280px high-res pass
        if max(H, W) >= 1000 and 1280 not in scales and self.config.enable_multiscale:
            scales.append(1280)

        image_variants = [img]
        if self.config.enable_clahe:
            image_variants.append(
                apply_adaptive_clahe(
                    img,
                    clip_limit=self.config.clahe_clip_limit,
                    grid_size=self.config.clahe_grid_size
                )
            )

        for sz in scales:
            for im_var in image_variants:
                results = self.model.predict(
                    im_var,
                    conf=self.config.conf_threshold,
                    imgsz=sz,
                    verbose=False
                )
                if len(results) > 0 and len(results[0].boxes) > 0:
                    res = results[0]
                    for b_idx, box in enumerate(res.boxes):
                        coords = box.xyxy[0].cpu().numpy().tolist()
                        score = float(box.conf[0].cpu().item())
                        cls_id = int(box.cls[0].cpu().item())

                        bw = coords[2] - coords[0]
                        bh = coords[3] - coords[1]
                        if bw * bh < self.config.min_box_area_px:
                            continue

                        all_raw_boxes.append(coords)
                        all_raw_scores.append(score)
                        all_raw_classes.append(cls_id)

                        if res.masks is not None and len(res.masks) > b_idx:
                            m = res.masks.data[b_idx].cpu().numpy()
                            m_full = cv2.resize(m, (W, H), interpolation=cv2.INTER_NEAREST)
                            all_raw_masks.append(m_full.astype(np.uint8))
                        else:
                            m_full = np.zeros((H, W), dtype=np.uint8)
                            x1, y1, x2, y2 = [int(v) for v in coords]
                            m_full[max(0, y1):min(H, y2), max(0, x1):min(W, x2)] = 1
                            all_raw_masks.append(m_full)

        # ------------------------------------------------------------------ #
        #  Phase 2: Overlapping Tiled Sliding-Window Inference                #
        # ------------------------------------------------------------------ #
        if self.config.enable_tiling:
            tile_sz = min(self.config.tile_size, min(H, W))
            stride = max(32, int(tile_sz * (1.0 - self.config.tile_overlap)))

            y_starts = list(range(0, max(1, H - tile_sz + 1), stride))
            if len(y_starts) == 0 or y_starts[-1] != H - tile_sz:
                y_starts.append(max(0, H - tile_sz))
            y_starts = sorted(set(y_starts))

            x_starts = list(range(0, max(1, W - tile_sz + 1), stride))
            if len(x_starts) == 0 or x_starts[-1] != W - tile_sz:
                x_starts.append(max(0, W - tile_sz))
            x_starts = sorted(set(x_starts))

            for ys in y_starts:
                ye = min(H, ys + tile_sz)
                for xs in x_starts:
                    xe = min(W, xs + tile_sz)
                    tile_crop = img[ys:ye, xs:xe]

                    tile_res = self.model.predict(
                        tile_crop,
                        conf=self.config.conf_threshold,
                        imgsz=640,
                        verbose=False
                    )

                    if len(tile_res) > 0 and len(tile_res[0].boxes) > 0:
                        tres = tile_res[0]
                        for b_idx, box in enumerate(tres.boxes):
                            t_coords = box.xyxy[0].cpu().numpy().tolist()
                            score = float(box.conf[0].cpu().item())
                            cls_id = int(box.cls[0].cpu().item())

                            # Map coordinates back to full image space
                            gx1 = t_coords[0] + xs
                            gy1 = t_coords[1] + ys
                            gx2 = t_coords[2] + xs
                            gy2 = t_coords[3] + ys

                            bw = gx2 - gx1
                            bh = gy2 - gy1
                            if bw * bh < self.config.min_box_area_px:
                                continue

                            all_raw_boxes.append([gx1, gy1, gx2, gy2])
                            all_raw_scores.append(score)
                            all_raw_classes.append(cls_id)

                            m_full = np.zeros((H, W), dtype=np.uint8)
                            if tres.masks is not None and len(tres.masks) > b_idx:
                                tm = tres.masks.data[b_idx].cpu().numpy()
                                tm_resized = cv2.resize(tm, (xe - xs, ye - ys), interpolation=cv2.INTER_NEAREST)
                                m_full[ys:ye, xs:xe] = tm_resized.astype(np.uint8)
                            else:
                                m_full[int(gy1):int(gy2), int(gx1):int(gx2)] = 1
                            all_raw_masks.append(m_full)

        # ------------------------------------------------------------------ #
        #  Phase 3: Weighted Box Fusion & Mask Consolidation                  #
        # ------------------------------------------------------------------ #
        fused_boxes, fused_scores, fused_masks, fused_classes = weighted_box_and_mask_fusion(
            all_raw_boxes,
            all_raw_scores,
            all_raw_masks,
            all_raw_classes,
            iou_thresh=self.config.iou_threshold,
            img_shape=(H, W)
        )

        # Build overall combined binary defect mask (logical OR of all individual masks)
        combined_mask = np.zeros((H, W), dtype=np.uint8)
        for m in fused_masks:
            combined_mask = np.logical_or(combined_mask, m).astype(np.uint8)

        # Build class names list
        class_names_list = [
            self.class_names.get(cid, f'Defect_{cid}')
            for cid in fused_classes
        ]

        return {
            'boxes'        : fused_boxes,
            'scores'       : fused_scores,
            'classes'      : fused_classes,
            'class_names'  : class_names_list,
            'masks'        : fused_masks,
            'combined_mask': combined_mask,
            'defect_count' : len(fused_boxes),
        }


def render_enhanced_visualization(
    img: np.ndarray,
    detections: dict[str, Any],
    alpha_mask: float = 0.42,
    draw_boxes: bool = True
) -> np.ndarray:
    """
    Render clean, research-grade visual overlays:
      - Translucent segmentation mask filling exact pothole shapes
      - Distinct vibrant bounding contours with unobtrusive labels
      - Numbered tags (e.g. "POTHOLE 01 — 91.5%")
    """
    overlay = img.copy()
    H, W = img.shape[:2]

    # Color palette for defect classes (BGR)
    colors = [
        (0, 230, 115),   # Emerald / Bright Green
        (255, 128, 0),   # Electric Blue / Azure
        (0, 165, 255),   # Vibrant Amber
        (204, 50, 255),  # Violet
        (0, 255, 255),   # Yellow
    ]

    boxes = detections.get('boxes', [])
    scores = detections.get('scores', [])
    class_names = detections.get('class_names', [])
    masks = detections.get('masks', [])
    combined_mask = detections.get('combined_mask', None)

    # 1. Draw translucent segmentation masks
    if combined_mask is not None and np.sum(combined_mask) > 0:
        mask_overlay = img.copy()
        # Default defect mask tint: Vibrant Magenta / Cyan blend
        mask_overlay[combined_mask > 0] = [235, 30, 215]
        cv2.addWeighted(mask_overlay, alpha_mask, overlay, 1.0 - alpha_mask, 0, overlay)

    # 2. Draw per-object contours and bounded labels
    for idx, (box, score, cname) in enumerate(zip(boxes, scores, class_names)):
        color = colors[idx % len(colors)]
        x1, y1, x2, y2 = [int(v) for v in box]
        x1 = max(0, min(W - 1, x1))
        y1 = max(0, min(H - 1, y1))
        x2 = max(0, min(W, x2))
        y2 = max(0, min(H, y2))

        # Draw contour of individual mask if present, otherwise bounding rectangle
        if idx < len(masks) and masks[idx] is not None and np.sum(masks[idx]) > 0:
            contours, _ = cv2.findContours(masks[idx], cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            cv2.drawContours(overlay, contours, -1, color, 2, cv2.LINE_AA)
        
        if draw_boxes:
            cv2.rectangle(overlay, (x1, y1), (x2, y2), color, 2, cv2.LINE_AA)

        # Label tag format: "POTHOLE 01 — 91.2%"
        tag_title = f'{cname.upper()} {idx + 1:02d}'
        tag_conf = f'{score * 100:.1f}%'
        tag_text = f'{tag_title} ({tag_conf})'

        font_scale = 0.38
        font_thickness = 1
        font_face = cv2.FONT_HERSHEY_SIMPLEX

        (tw, th), baseline = cv2.getTextSize(tag_text, font_face, font_scale, font_thickness)
        
        # Position label above bounding box if space allows; otherwise place inside top edge
        tag_y = max(th + 6, y1 - 4) if (y1 - th - 6) >= 0 else y1 + th + 6
        tag_x = x1

        # Background badge for high legibility
        cv2.rectangle(
            overlay,
            (tag_x, tag_y - th - 4),
            (min(W, tag_x + tw + 6), tag_y + baseline),
            (20, 20, 20),
            -1
        )
        cv2.rectangle(
            overlay,
            (tag_x, tag_y - th - 4),
            (min(W, tag_x + tw + 6), tag_y + baseline),
            color,
            1
        )
        cv2.putText(
            overlay,
            tag_text,
            (tag_x + 3, tag_y - 2),
            font_face,
            font_scale,
            (255, 255, 255),
            font_thickness,
            cv2.LINE_AA
        )

    return overlay
