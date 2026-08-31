# pyright: reportAttributeAccessIssue=none, reportGeneralTypeIssues=none, reportOptionalMemberAccess=none
# type: ignore
"""
metric_geometry.py — Module 2: Monocular Metric Estimation of Repair Geometry
Road Inspector AI Research Platform — IT22252340

Provides:
  - refine_mask()                  : Morphological opening + closing + small-component removal
  - extract_contour_polygon()      : Suzuki-Abe border following + Douglas-Peucker simplification
  - shoelace_area()                : Manual Shoelace formula for polygon area
  - polygon_area_m2()              : Metric area via shoelace polygon from mask
  - area_uncertainty()             : 95% CI from boundary uncertainty + homography error
  - compute_ipm()                  : Inverse Perspective Mapping to bird's-eye view
  - estimate_depth_midas()         : MiDaS relative depth estimation
  - fit_road_plane()               : RANSAC plane fit to recover metric depth scale
  - volume_road_plane_integration(): Per-pixel road-plane deviation volume integration
  - skeletonize_mask()             : Medial-axis skeletonisation of defect mask
  - crack_geometry()               : Arc-length, mean/max width, linear density
  - crack_branch_node_analysis()   : Skeleton graph: branch count, node count, branch density
  - classify_crack_pattern()       : Alligator / Longitudinal / Transverse / Other
  - astm_d6433_severity()          : ASTM D6433 severity from crack width thresholds
  - repair_patch_area()            : Defect area vs patch area (with margin)
  - depth_map_to_base64()          : Colourised depth map encoded as base64 JPEG

All functions return None for results that cannot be computed rather than
using fabricated values.  Callers must display 'N/A' when None is returned.
"""

import cv2
import numpy as np
import warnings
import base64

# --------------------------------------------------------------------------- #
#  Optional heavy imports — fail gracefully so Module 1 still works           #
# --------------------------------------------------------------------------- #
try:
    from skimage.morphology import skeletonize as _skimage_skeletonize
    _SKIMAGE_AVAILABLE = True
except ImportError:
    _SKIMAGE_AVAILABLE = False

try:
    import torch
    _TORCH_AVAILABLE = True
except ImportError:
    _TORCH_AVAILABLE = False

# MiDaS model is loaded lazily and cached across calls
_midas_model = None
_midas_transform = None
_midas_device = None


# =========================================================================== #
#  1. Mask Refinement Pipeline                                                 #
# =========================================================================== #

def refine_mask(mask, open_k=3, close_k=7, min_component_px=50):
    """
    Refine a binary defect mask using the Module 2 pipeline:
        1. Morphological opening  — remove isolated noise pixels
        2. Morphological closing  — fill small internal cavities
        3. Small-component removal — discard tiny disconnected blobs

    Args:
        mask              : uint8 binary (H×W), 1 = defect
        open_k            : kernel size for opening (odd integer, default 3)
        close_k           : kernel size for closing (odd integer, default 7)
        min_component_px  : minimum connected-component pixel count to retain

    Returns:
        Refined uint8 binary mask (H×W). Returns input unchanged if empty.
    """
    if mask is None or np.sum(mask) == 0:
        return mask

    mask_u8 = (mask > 0).astype(np.uint8)
    open_k  = max(3, open_k  | 1)   # ensure odd
    close_k = max(3, close_k | 1)
    k_open  = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (open_k,  open_k))
    k_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (close_k, close_k))
    refined = cv2.morphologyEx(mask_u8, cv2.MORPH_OPEN,  k_open)
    refined = cv2.morphologyEx(refined, cv2.MORPH_CLOSE, k_close)

    if min_component_px > 0:
        n_labels, labels, stats, _ = cv2.connectedComponentsWithStats(refined, connectivity=8)
        out = np.zeros_like(refined)
        for lbl in range(1, n_labels):
            if stats[lbl, cv2.CC_STAT_AREA] >= min_component_px:
                out[labels == lbl] = 1
        refined = out

    return refined


# =========================================================================== #
#  2. Contour Extraction with Douglas-Peucker Simplification                  #
# =========================================================================== #

def extract_contour_polygon(mask, dp_epsilon_frac=0.02):
    """
    Convert a binary mask to ordered vertex polygons using:
      - Suzuki-Abe border following  (cv2.findContours with CHAIN_APPROX_NONE)
      - Douglas-Peucker polygon simplification  (cv2.approxPolyDP)

    The DP epsilon is set as a fraction of the contour arc length so that
    induced area error remains below approximately 2% as required by research.

    Returns:
        tuple: (List of simplified contour arrays, diagnostics_dict)
    """
    if mask is None or np.sum(mask) == 0:
        return [], {
            'raw_vertices': 0,
            'simplified_vertices': 0,
            'dp_epsilon_px': 0.0,
            'raw_contour_area_px2': 0.0,
            'simplified_area_px2': 0.0,
            'induced_area_error_pct': 0.0,
            'target_met': True,
        }

    contours, _ = cv2.findContours(
        mask.astype(np.uint8),
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_NONE   # full Suzuki-Abe border tracing
    )

    simplified = []
    raw_verts_total = 0
    sim_verts_total = 0
    raw_area_total = 0.0
    sim_area_total = 0.0
    epsilons = []

    for cnt in contours:
        raw_verts = len(cnt)
        raw_verts_total += raw_verts
        raw_area = shoelace_area(cnt)
        raw_area_total += raw_area

        arc_len = cv2.arcLength(cnt, closed=True)
        epsilon = dp_epsilon_frac * arc_len
        epsilons.append(float(epsilon))
        approx = cv2.approxPolyDP(cnt, epsilon, closed=True)

        if len(approx) >= 3:
            simplified.append(approx)
            sim_verts_total += len(approx)
            sim_area_total += shoelace_area(approx)
        else:
            simplified.append(cnt)
            sim_verts_total += raw_verts
            sim_area_total += raw_area

    if raw_area_total > 1e-6:
        induced_error = abs(sim_area_total - raw_area_total) / raw_area_total * 100.0
    else:
        induced_error = 0.0

    diag = {
        'raw_vertices': raw_verts_total,
        'simplified_vertices': sim_verts_total,
        'dp_epsilon_px': round(float(np.mean(epsilons)), 3) if epsilons else 0.0,
        'raw_contour_area_px2': round(raw_area_total, 2),
        'simplified_area_px2': round(sim_area_total, 2),
        'induced_area_error_pct': round(induced_error, 3),
        'target_met': bool(induced_error < 2.0),
    }

    return simplified, diag


# =========================================================================== #
#  3. Shoelace Formula — Manual Implementation                                 #
# =========================================================================== #

def shoelace_area(polygon_pts):
    """
    Compute the signed area of a polygon using the Shoelace formula:

        A = 0.5 * |Σ_{i=0}^{n-1} (x_i * y_{i+1} - x_{i+1} * y_i)|

    The final-to-first vertex connection is included automatically.
    This is a direct, non-black-box implementation as required by Module 2.

    Unit test:
        Unit square (0,0),(1,0),(1,1),(0,1) → area = 1.0
        Rectangle 3×5 → area = 15.0

    Args:
        polygon_pts : array-like (N, 2) or (N, 1, 2) from cv2.approxPolyDP.

    Returns:
        float — unsigned polygon area in pixel² units. Returns 0.0 if < 3 pts.
    """
    pts = np.array(polygon_pts, dtype=np.float64)
    if pts.ndim == 3:
        pts = pts.reshape(-1, 2)
    n = len(pts)
    if n < 3:
        return 0.0

    xs = pts[:, 0]
    ys = pts[:, 1]
    xs_next = np.roll(xs, -1)
    ys_next = np.roll(ys, -1)
    area = 0.5 * abs(np.sum(xs * ys_next - xs_next * ys))
    return float(area)


def polygon_area_m2(mask, gsd_m_per_px, dp_epsilon_frac=0.02):
    """
    Compute the metric defect area by:
        1. Extract contour polygons (Suzuki-Abe)
        2. Simplify with Douglas-Peucker
        3. Apply Shoelace formula to each polygon
        4. Convert pixel² → m² using GSD²

    This is the primary Module 2 area computation method.

    Returns:
        dict with area, pixel count, and Douglas-Peucker verification diagnostics.
        Returns None if mask is empty.
    """
    if mask is None or np.sum(mask) == 0:
        return None

    gsd2 = gsd_m_per_px ** 2
    polygons, diag = extract_contour_polygon(mask, dp_epsilon_frac)
    total_px2 = sum(shoelace_area(p) for p in polygons)
    area_m2 = total_px2 * gsd2
    pixel_area_m2 = float(np.sum(mask)) * gsd2

    return {
        'area_m2': float(area_m2),
        'area_px2': float(total_px2),
        'num_polygons': len(polygons),
        'pixel_area_m2': float(pixel_area_m2),
        'raw_vertices': diag['raw_vertices'],
        'simplified_vertices': diag['simplified_vertices'],
        'dp_epsilon_px': diag['dp_epsilon_px'],
        'induced_area_error_pct': diag['induced_area_error_pct'],
        'target_met': diag['target_met'],
        'shoelace_formula': '0.5 * |Σ (x_i * y_{i+1} - x_{i+1} * y_i)|',
    }


# =========================================================================== #
#  4. Area Uncertainty (95% Confidence Interval)                               #
# =========================================================================== #

def area_uncertainty(mask, gsd_m_per_px, reprojection_error_px=None, estimated_area_m2=None):
    """
    Estimate the 95% CI for the defect area estimate.

    Error sources:
      1. Boundary pixel uncertainty: each boundary pixel may shift ±0.5 px
      2. Homography/reprojection error propagated through A = N_px × gsd²

    The 95% CI is ±2σ where σ is combined in quadrature.
    Guaranteed mathematically consistent: ci_low_m2 <= estimated_area_m2 <= ci_high_m2.

    Returns:
        dict with 'area_m2', 'ci_half_width_m2', 'ci_low_m2', 'ci_high_m2',
                  'boundary_uncertainty', 'homography_uncertainty'
        Returns None if mask is empty.
    """
    if mask is None or np.sum(mask) == 0:
        return None

    gsd2 = gsd_m_per_px ** 2
    n_px = float(np.sum(mask))
    area_m2 = float(estimated_area_m2) if estimated_area_m2 is not None else (n_px * gsd2)

    edges = cv2.Canny(mask.astype(np.uint8) * 255, 50, 150)
    perimeter_px = float(np.sum(edges > 0))
    sigma_boundary = 0.5 * perimeter_px * gsd2

    sigma_hom = None
    if reprojection_error_px is not None and reprojection_error_px > 0:
        dst_w = max(mask.shape)
        delta_gsd = (reprojection_error_px / dst_w) * gsd_m_per_px
        sigma_hom = float(n_px * 2.0 * gsd_m_per_px * delta_gsd)

    if sigma_hom is not None:
        sigma_combined = np.sqrt(sigma_boundary**2 + sigma_hom**2)
    else:
        sigma_combined = sigma_boundary

    half_width = 2.0 * sigma_combined

    return {
        'area_m2': float(area_m2),
        'ci_half_width_m2': float(half_width),
        'ci_low_m2': float(max(0.0, area_m2 - half_width)),
        'ci_high_m2': float(area_m2 + half_width),
        'boundary_uncertainty': float(sigma_boundary),
        'homography_uncertainty': float(sigma_hom) if sigma_hom is not None else None,
    }


# =========================================================================== #
#  5. Camera Calibration & Undistortion                                       #
# =========================================================================== #

CAMERA_PROFILES = {
    'CAM-001': {
        'profile_id': 'PROF-CAL-CAM001-V2',
        'camera_matrix': np.array([
            [1150.0, 0.0, 640.0],
            [0.0, 1150.0, 360.0],
            [0.0, 0.0, 1.0]
        ], dtype=np.float64),
        'dist_coeffs': np.array([-0.08, 0.04, 0.001, -0.001, 0.0], dtype=np.float64),
        'camera_height_m': 1.25,
        'pitch_deg': -15.0,
        'depth_scale_mm_per_rel': 1850.0, # Calibrated scaling factor: maps unit relative depth deviation to mm
        'calibration_target': 'Checkerboard (8x6 pattern, 30.0 mm square size)',
        'reprojection_error_px': 1.82,
        'homography_method': 'Four-Point Lane Geometry & Vanishing Point',
        'description': 'Standard Road Inspection Vehicle Forward Camera (1080p, calibrated)'
    }
}

def get_camera_calibration(camera_id='CAM-001'):
    """Return calibration dictionary for camera_id or None if uncalibrated."""
    if camera_id in CAMERA_PROFILES:
        return CAMERA_PROFILES[camera_id]
    return None

def get_camera_telemetry(camera_id='CAM-001'):
    """Return structured camera telemetry dictionary for API and research display."""
    prof = get_camera_calibration(camera_id)
    if prof is None:
        return {
            'camera_id': camera_id,
            'calibration_status': 'Uncalibrated',
            'calibration_profile_id': 'N/A',
            'camera_matrix': None,
            'dist_coeffs': None,
            'camera_height_m': None,
            'pitch_deg': None,
            'reprojection_error_px': None,
            'calibration_target': 'N/A',
            'homography_method': 'N/A',
            'undistortion_status': 'Not Applied',
            'description': 'Unregistered / uncalibrated camera sensor'
        }
    return {
        'camera_id': camera_id,
        'calibration_status': 'Calibrated',
        'calibration_profile_id': prof.get('profile_id', 'PROF-CAL-CAM001-V2'),
        'camera_matrix': prof['camera_matrix'].tolist(),
        'dist_coeffs': prof['dist_coeffs'].tolist(),
        'camera_height_m': prof.get('camera_height_m', 1.25),
        'pitch_deg': prof.get('pitch_deg', -15.0),
        'reprojection_error_px': prof.get('reprojection_error_px', 1.82),
        'calibration_target': prof.get('calibration_target', 'Checkerboard (8x6, 30.0 mm)'),
        'homography_method': prof.get('homography_method', 'Four-Point Lane Geometry & Vanishing Point'),
        'undistortion_status': 'Applied',
        'description': prof.get('description', 'Calibrated sensor')
    }

def undistort_image(img, camera_matrix, dist_coeffs):
    """
    Apply lens undistortion using pre-computed intrinsic parameters.

    Args:
        img            : numpy BGR image
        camera_matrix  : 3×3 numpy array (K matrix)
        dist_coeffs    : distortion coefficients (1×5 or similar)

    Returns:
        Undistorted BGR image of the same size.
    """
    h, w = img.shape[:2]
    new_cam, _roi = cv2.getOptimalNewCameraMatrix(camera_matrix, dist_coeffs, (w, h), 1, (w, h))
    undistorted = cv2.undistort(img, camera_matrix, dist_coeffs, None, new_cam)
    return undistorted

def apply_camera_undistortion(img, camera_id='CAM-001'):
    """
    Apply camera lens undistortion if calibration parameters exist for camera_id.

    Returns:
        tuple: (processed_img, status_str) where status_str is 'Applied' or 'Not Applied'
    """
    profile = get_camera_calibration(camera_id)
    if profile is not None and 'camera_matrix' in profile and 'dist_coeffs' in profile:
        K = profile['camera_matrix']
        D = profile['dist_coeffs']
        if np.any(np.abs(D) > 1e-6):
            try:
                undistorted = undistort_image(img, K, D)
                return undistorted, 'Applied'
            except Exception as e:
                warnings.warn(f'[metric_geometry] Undistortion failed: {e}')
                return img, 'Not Applied'
    return img, 'Not Applied'


# =========================================================================== #
#  2. Inverse Perspective Mapping (Homography)                                #
# =========================================================================== #

def compute_ipm(img, src_points=None, real_width_m=3.5, real_height_m=None, dst_size=(512, 512)):
    """
    Compute a bird's-eye view (top-down) warp via homography.

    The homography maps four ground-plane reference points in the source image
    to the four corners of the destination rectangle.  If no src_points are
    supplied the function uses a sensible default trapezoid estimated from the
    image dimensions (typical forward-facing road camera geometry).

    Args:
        img          : numpy BGR image (H×W×3)
        src_points   : list/array of 4 [x, y] source points in pixel coords
                       representing a rectangle on the road surface.
                       Order: [top-left, top-right, bottom-right, bottom-left]
                       If None, a default trapezoid is used.
        real_width_m : physical width (m) of the rectangle defined by
                       src_points (i.e. left–right road width). Default 3.5 m
                       (standard lane width).
        real_height_m: physical depth (m) from bottom to top of src_points.
                       If None it is estimated assuming square GSD.
        dst_size     : (W, H) pixel dimensions of the output bird's-eye image.

    Returns:
        dict with keys:
          'ipm_img'     : warped BGR image (dst_size)
          'H'           : 3×3 homography matrix  (src→dst)
          'H_inv'       : 3×3 inverse homography (dst→src)
          'gsd_m_per_px': ground sampling distance (metres per pixel) in IPM
          'method'      : 'user_points' | 'lane_prior'
          'src_pts'     : the four source points used (numpy float32 4×2)
    """
    h_img, w_img = img.shape[:2]
    dst_w, dst_h = dst_size

    if src_points is not None:
        src_pts = np.array(src_points, dtype=np.float32)
        method = 'user_points'
    else:
        # Default trapezoid for a standard forward-facing road camera:
        # bottom third is close road surface, upper region is far away
        # Tune based on typical dashcam / inspection camera geometry
        near_y   = h_img * 0.98   # bottom strip (near road surface)
        far_y    = h_img * 0.58   # horizon-ish
        near_xl  = w_img * 0.05
        near_xr  = w_img * 0.95
        far_xl   = w_img * 0.38
        far_xr   = w_img * 0.62
        src_pts  = np.array([
            [far_xl,  far_y ],   # top-left
            [far_xr,  far_y ],   # top-right
            [near_xr, near_y],   # bottom-right
            [near_xl, near_y],   # bottom-left
        ], dtype=np.float32)
        method = 'lane_prior'

    # Destination: full dst_size rectangle
    dst_pts = np.array([
        [0,       0      ],
        [dst_w-1, 0      ],
        [dst_w-1, dst_h-1],
        [0,       dst_h-1],
    ], dtype=np.float32)

    H, _ = cv2.findHomography(src_pts, dst_pts)
    if H is None:
        return None

    H_inv = np.linalg.inv(H)

    # Warp image
    ipm_img = cv2.warpPerspective(img, H, (dst_w, dst_h))

    # Compute GSD: physical width (m) / pixel width of dst image
    gsd_m_per_px = real_width_m / dst_w

    return {
        'ipm_img'     : ipm_img,
        'H'           : H,
        'H_inv'       : H_inv,
        'gsd_m_per_px': float(gsd_m_per_px),
        'method'      : method,
        'src_pts'     : src_pts
    }


def warp_mask_to_ipm(mask, H, dst_size=(512, 512)):
    """
    Warp a binary mask (uint8, 0/1) to the IPM space using the same homography.
    """
    dst_w, dst_h = dst_size
    mask_u8 = (mask * 255).astype(np.uint8)
    warped = cv2.warpPerspective(mask_u8, H, (dst_w, dst_h),
                                  flags=cv2.INTER_NEAREST)
    return (warped > 127).astype(np.uint8)


# =========================================================================== #
#  3. MiDaS Monocular Depth Estimation                                        #
# =========================================================================== #

def estimate_depth_midas(img_bgr):
    """
    Estimate a relative (unitless) depth map using MiDaS DPT_Hybrid.

    Requires torch and a working internet connection on first call to download
    the model (~350 MB).  The model is cached in ~/.cache/torch/hub.

    Args:
        img_bgr : numpy BGR image

    Returns:
        depth_map : float32 numpy array (H×W), larger values = closer.
                    Returns None if torch is unavailable or inference fails.
    """
    global _midas_model, _midas_transform, _midas_device

    if not _TORCH_AVAILABLE:
        warnings.warn('[metric_geometry] torch not available — depth estimation skipped')
        return None

    try:
        if _midas_model is None:
            _midas_device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
            _midas_model = torch.hub.load('intel-isl/MiDaS', 'DPT_Hybrid', trust_repo=True)
            _midas_model.to(_midas_device)
            _midas_model.eval()

            midas_transforms = torch.hub.load('intel-isl/MiDaS', 'transforms', trust_repo=True)
            _midas_transform = midas_transforms.dpt_transform

        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        input_batch = _midas_transform(img_rgb).to(_midas_device)

        with torch.no_grad():
            prediction = _midas_model(input_batch)
            prediction = torch.nn.functional.interpolate(
                prediction.unsqueeze(1),
                size=img_bgr.shape[:2],
                mode='bicubic',
                align_corners=False
            ).squeeze()

        depth_map = prediction.cpu().numpy().astype(np.float32)
        return depth_map

    except Exception as exc:
        warnings.warn(f'[metric_geometry] MiDaS depth estimation failed: {exc}')
        return None


# =========================================================================== #
#  4. Local Undamaged Road Annulus & RANSAC Road-Plane Fitting                 #
# =========================================================================== #

def create_defect_annulus(defect_mask, all_defects_mask=None, inner_pad=3, outer_pad=30):
    """
    Extract an annulus band around a defect mask representing nearby undamaged road surface.
    Strictly excludes the defect itself, any other detected defects, and invalid regions.

    Args:
        defect_mask      : uint8 binary (H×W) of the specific defect (1 = defect)
        all_defects_mask : optional uint8 binary (H×W) of all detected defects combined
        inner_pad        : pixel margin to erode away from defect border to avoid transitional edge noise
        outer_pad        : pixel radius of the outer road context band

    Returns:
        uint8 binary mask (H×W) of the undamaged road surface surrounding the defect.
    """
    if defect_mask is None or np.sum(defect_mask) == 0:
        return np.zeros_like(defect_mask if defect_mask is not None else np.zeros((1, 1), dtype=np.uint8))

    h, w = defect_mask.shape[:2]
    # Ensure kernel radii scale sensibly with image dimensions
    min_dim = min(h, w)
    inner_k_size = max(3, int(round(inner_pad * min_dim / 480.0)) | 1)
    outer_k_size = max(7, int(round(outer_pad * min_dim / 480.0)) | 1)

    k_inner = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (inner_k_size, inner_k_size))
    k_outer = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (outer_k_size, outer_k_size))

    dilated_outer = cv2.dilate(defect_mask.astype(np.uint8), k_outer)
    dilated_inner = cv2.dilate(defect_mask.astype(np.uint8), k_inner)

    # Base annulus around this defect
    annulus = (dilated_outer > 0) & (dilated_inner == 0)

    # Exclude any other detected defects in the scene
    if all_defects_mask is not None:
        other_defects = (all_defects_mask > 0) & (defect_mask == 0)
        if np.sum(other_defects) > 0:
            other_padded = cv2.dilate(other_defects.astype(np.uint8), k_inner)
            annulus = annulus & (other_padded == 0)

    return annulus.astype(np.uint8)


def fit_road_plane_ransac(depth_map, road_mask, max_iterations=200, threshold_factor=1.5, min_samples=30):
    """
    Fit a local parametric road-plane surface z_road(x, y) = a*x + b*y + c
    using RANSAC outlier rejection on depth samples from the undamaged road annulus.

    Rejects outliers caused by debris, shadows, road markings, neighbouring defects,
    and abnormal monocular depth predictions.

    Args:
        depth_map        : 2D float32 array (H×W) relative depth from Depth Anything V2
        road_mask        : 2D uint8 binary array (H×W), 1 = undamaged road samples
        max_iterations   : RANSAC trial iterations
        threshold_factor : multiplier on median residual to define inlier threshold
        min_samples      : minimum road sample points required to attempt fitting

    Returns:
        dict with:
          'plane_coeffs'          : (a, b, c) of z_road = a*x + b*y + c
          'road_plane'            : dict {'a': float, 'b': float, 'c': float}
          'inlier_count'          : int, count of RANSAC inliers
          'outlier_count'         : int, count of rejected road samples
          'residual'              : float, RMS error of inliers
          'confidence'            : float, inlier ratio (0.0 to 1.0)
          'reliable'              : bool, whether fit meets minimum sample and inlier criteria
          'road_plane_grid'       : 2D float32 array (H×W) of evaluated road plane
          'depth_deviation'       : 2D float32 array (H×W) relative depression depth below plane (>= 0)
    """
    h, w = depth_map.shape[:2]

    # Find valid finite non-negative road samples
    valid_pts = (road_mask > 0) & np.isfinite(depth_map) & (depth_map > 0)
    ys, xs = np.where(valid_pts)
    n_pts = len(xs)

    if n_pts < min_samples:
        return {
            'plane_coeffs': (0.0, 0.0, float(np.nanmean(depth_map)) if np.sum(np.isfinite(depth_map)) > 0 else 0.0),
            'road_plane': {'a': 0.0, 'b': 0.0, 'c': float(np.nanmean(depth_map)) if np.sum(np.isfinite(depth_map)) > 0 else 0.0},
            'inlier_count': n_pts,
            'outlier_count': 0,
            'residual': 0.0,
            'confidence': 0.0,
            'reliable': False,
            'road_plane_grid': np.full((h, w), float(np.nanmean(depth_map)) if np.sum(np.isfinite(depth_map)) > 0 else 0.0, dtype=np.float32),
            'depth_deviation': np.zeros((h, w), dtype=np.float32)
        }

    z_vals = depth_map[ys, xs].astype(np.float64)
    x_coords = xs.astype(np.float64)
    y_coords = ys.astype(np.float64)

    # Initial least-squares estimate to derive scale
    A_all = np.column_stack([x_coords, y_coords, np.ones(n_pts, dtype=np.float64)])
    try:
        init_coeffs, _, _, _ = np.linalg.lstsq(A_all, z_vals, rcond=None)
        init_residuals = np.abs(z_vals - (init_coeffs[0] * x_coords + init_coeffs[1] * y_coords + init_coeffs[2]))
        med_res = float(np.median(init_residuals))
        inlier_threshold = max(0.002, threshold_factor * med_res)
    except Exception:
        inlier_threshold = 0.015

    best_inliers = np.zeros(n_pts, dtype=bool)
    best_count = 0
    best_coeffs = None

    rng = np.random.default_rng(42)

    for _ in range(max_iterations):
        sample_indices = rng.choice(n_pts, size=3, replace=False)
        p1 = np.array([x_coords[sample_indices[0]], y_coords[sample_indices[0]], z_vals[sample_indices[0]]])
        p2 = np.array([x_coords[sample_indices[1]], y_coords[sample_indices[1]], z_vals[sample_indices[1]]])
        p3 = np.array([x_coords[sample_indices[2]], y_coords[sample_indices[2]], z_vals[sample_indices[2]]])

        # Check collinearity via cross product in XY
        v1 = p2[:2] - p1[:2]
        v2 = p3[:2] - p1[:2]
        cross_xy = abs(v1[0] * v2[1] - v1[1] * v2[0])
        if cross_xy < 1.0:
            continue

        A_sample = np.column_stack([
            [p1[0], p2[0], p3[0]],
            [p1[1], p2[1], p3[1]],
            [1.0, 1.0, 1.0]
        ])
        b_sample = np.array([p1[2], p2[2], p3[2]])

        try:
            candidate_coeffs = np.linalg.solve(A_sample, b_sample)
        except Exception:
            continue

        pred_z = candidate_coeffs[0] * x_coords + candidate_coeffs[1] * y_coords + candidate_coeffs[2]
        residuals = np.abs(z_vals - pred_z)
        inlier_mask = residuals <= inlier_threshold
        inlier_count = int(np.sum(inlier_mask))

        if inlier_count > best_count:
            best_count = inlier_count
            best_inliers = inlier_mask
            best_coeffs = candidate_coeffs

    # Refit plane using least squares on ALL inliers
    if best_count >= 3 and best_coeffs is not None:
        A_inliers = A_all[best_inliers]
        z_inliers = z_vals[best_inliers]
        try:
            final_coeffs, _, _, _ = np.linalg.lstsq(A_inliers, z_inliers, rcond=None)
            final_a, final_b, final_c = float(final_coeffs[0]), float(final_coeffs[1]), float(final_coeffs[2])
            inlier_residuals = np.abs(z_inliers - (final_a * A_inliers[:, 0] + final_b * A_inliers[:, 1] + final_c))
            rms_residual = float(np.sqrt(np.mean(inlier_residuals ** 2)))
        except Exception:
            final_a, final_b, final_c = float(best_coeffs[0]), float(best_coeffs[1]), float(best_coeffs[2])
            rms_residual = float(inlier_threshold)
    else:
        # Fallback to least-squares on all valid points
        try:
            final_coeffs, _, _, _ = np.linalg.lstsq(A_all, z_vals, rcond=None)
            final_a, final_b, final_c = float(final_coeffs[0]), float(final_coeffs[1]), float(final_coeffs[2])
            residuals_all = np.abs(z_vals - (final_a * x_coords + final_b * y_coords + final_c))
            rms_residual = float(np.sqrt(np.mean(residuals_all ** 2)))
            best_count = int(np.sum(residuals_all <= inlier_threshold))
        except Exception:
            final_a, final_b = 0.0, 0.0
            final_c = float(np.mean(z_vals))
            rms_residual = float(np.std(z_vals))
            best_count = n_pts

    confidence = float(best_count) / float(n_pts) if n_pts > 0 else 0.0
    reliable = (best_count >= min_samples) and (confidence >= 0.40)

    # Evaluate fitted plane across full image grid
    all_y, all_x = np.mgrid[0:h, 0:w].astype(np.float32)
    road_plane_grid = (final_a * all_x + final_b * all_y + final_c).astype(np.float32)

    # In Depth Anything V2, values increase with camera distance (Z).
    # Pothole cavity depression is further away from camera than the flat road surface:
    # z_obs > z_road. The relative cavity depression depth is: z_obs - z_road.
    # Small negative deviations (noise / slight road bumps above plane) are clamped to 0.
    depth_deviation = np.maximum(0.0, depth_map - road_plane_grid).astype(np.float32)

    return {
        'plane_coeffs': (final_a, final_b, final_c),
        'road_plane': {'a': round(final_a, 7), 'b': round(final_b, 7), 'c': round(final_c, 5)},
        'inlier_count': int(best_count),
        'outlier_count': int(n_pts - best_count),
        'residual': round(rms_residual, 6),
        'confidence': round(confidence, 4),
        'reliable': reliable,
        'road_plane_grid': road_plane_grid,
        'depth_deviation': depth_deviation
    }


def fit_road_plane(depth_map, road_mask, min_inliers=500):
    """
    Backwards-compatible wrapper calling fit_road_plane_ransac.
    """
    res = fit_road_plane_ransac(depth_map, road_mask, min_samples=min_inliers)
    if not res['reliable']:
        return None
    return {
        'plane_coeffs': res['plane_coeffs'],
        'road_plane': res['road_plane'],
        'inlier_count': res['inlier_count'],
        'residual': res['residual'],
        'residuals': res['residual'],
        'depth_at_defects': float(np.mean(res['depth_deviation'][road_mask == 0])) if np.sum(road_mask == 0) > 0 else 0.0,
        'reliable': res['reliable'],
        'depth_deviation': res['depth_deviation']
    }


# =========================================================================== #
#  Metric Depth Calibration Layer                                              #
# =========================================================================== #

class DepthCalibrator:
    """
    Scientific calibration layer converting relative depth deviation Δz_rel to metric millimetres.

    Supported calibration models:
      1. 'Camera Intrinsic Profile' (e.g. CAM-001 vehicle camera with known mounting height and optical scale)
      2. 'Ground-Truth Measured Depth' (direct physical ground-truth measurement D_max_mm from laser/ruler)
      3. 'Five-Point Profile Calibration' (ground-truth physical profile measurements)
      4. 'Custom Metric Scale' (explicit user-specified scale factor mm/rel)
      5. 'Calibration Required' (reported when camera is uncalibrated without ground reference)
    """
    def __init__(self, camera_id='CAM-001', measured_depth_mm=None, five_point_mm=None, custom_scale=None):
        self.camera_id = camera_id
        self.measured_depth_mm = float(measured_depth_mm) if measured_depth_mm is not None and float(measured_depth_mm) > 0 else None
        self.five_point_mm = [float(v) for v in five_point_mm] if five_point_mm and len(five_point_mm) >= 3 else None
        self.custom_scale = float(custom_scale) if custom_scale is not None and float(custom_scale) > 0 else None

        self.scale_factor = None
        self.calibration_status = 'Calibration Required'
        self.calibration_method = 'None'
        self.is_calibrated = False

        self._resolve_calibration()

    def _resolve_calibration(self):
        if self.custom_scale is not None and self.custom_scale > 0:
            self.scale_factor = self.custom_scale
            self.calibration_status = 'Calibrated'
            self.calibration_method = 'Custom Scale'
            self.is_calibrated = True
            return

        if self.measured_depth_mm is not None and self.measured_depth_mm > 0:
            self.calibration_status = 'Calibrated'
            self.calibration_method = 'Ground-Truth Measured Depth'
            self.is_calibrated = True
            return

        if self.five_point_mm is not None and len(self.five_point_mm) >= 3:
            self.calibration_status = 'Calibrated'
            self.calibration_method = 'Five-Point Profile Calibration'
            self.is_calibrated = True
            return

        cam_prof = get_camera_calibration(self.camera_id)
        if cam_prof is not None and 'depth_scale_mm_per_rel' in cam_prof:
            self.scale_factor = float(cam_prof['depth_scale_mm_per_rel'])
            self.calibration_status = 'Calibrated'
            self.calibration_method = f'Camera Intrinsic Profile ({self.camera_id})'
            self.is_calibrated = True
            return

        self.scale_factor = None
        self.calibration_status = 'Calibration Required'
        self.calibration_method = 'Uncalibrated'
        self.is_calibrated = False

    def relative_to_metric_mm(self, rel_deviation_array, max_rel_defect=None):
        """
        Map relative depth array to metric millimetres.
        Returns float32 numpy array, or None if uncalibrated.
        """
        if not self.is_calibrated:
            return None

        if self.measured_depth_mm is not None and max_rel_defect is not None and max_rel_defect > 1e-6:
            dynamic_scale = self.measured_depth_mm / max_rel_defect
            return (rel_deviation_array * dynamic_scale).astype(np.float32)

        if self.scale_factor is not None:
            return (rel_deviation_array * self.scale_factor).astype(np.float32)

        return None


# =========================================================================== #
#  Per-Pixel Volume Integration  (Principal Methodological Contribution)      #
# =========================================================================== #

def volume_road_plane_integration(depth_deviation, defect_mask, gsd_m_per_px, depth_scale_factor=1.0):
    """
    Integrate defect volume using per-pixel road-plane depth deviation.

    Principal methodological contribution of Module 2:
        V = Σ(d_p × a_p)
    where:
        d_p = perpendicular metric deviation below the road plane in metres
        a_p = real-world pixel area in square metres (gsd_m_per_px²)

    Formula:
        volume_m3 = Σ (depth_mm[p] / 1000.0 * a_p)

    Strictly continuous Riemann integration over pixels inside the defect mask.
    Never uses bounding-box area, and never uses area * max_depth or area * mean_depth.
    """
    if depth_deviation is None or defect_mask is None or np.sum(defect_mask) == 0:
        return None

    a_p = float(gsd_m_per_px) ** 2
    defect_mask_bool = (defect_mask > 0)
    devs = depth_deviation[defect_mask_bool]

    # Ensure strictly positive depression depths below the road datum
    positive_devs = np.maximum(0.0, devs)

    pixel_count = int(np.sum(defect_mask_bool))
    max_dev = float(np.max(positive_devs)) if pixel_count > 0 else 0.0
    mean_dev = float(np.mean(positive_devs)) if pixel_count > 0 else 0.0

    # Per-pixel volume integration: Σ(d_p * a_p)
    volume_m3 = float(np.sum(positive_devs * depth_scale_factor * a_p))

    return {
        'volume_m3': float(volume_m3),
        'max_deviation': float(max_dev),
        'mean_deviation': float(mean_dev),
        'pixel_count': pixel_count,
        'method': 'Per-pixel Road-Plane Integration',
    }


def analyze_defect_depth_and_volume(
    defect_mask,
    depth_map,
    all_defects_mask,
    gsd_m_per_px,
    calibrator,
    ipm_homography=None
):
    """
    Execute full Module 2 depth and volume pipeline on a single defect:
      1. Undamaged Road Annulus Extraction
      2. RANSAC Road-Plane Fitting
      3. Relative Depth Calculation from Road Plane Datum
      4. Metric Depth Calibration (mm)
      5. Per-Pixel Real-World Area Calculation
      6. Volume Integration: V = Σ(d_p × a_p)

    Returns:
        dict with all metric depths, volume, and diagnostic parameters.
    """
    if defect_mask is None or np.sum(defect_mask) == 0 or depth_map is None:
        return None

    # Step 1: Extract local undamaged road annulus
    annulus = create_defect_annulus(defect_mask, all_defects_mask)
    if np.sum(annulus) < 20:
        # Fallback to general road area if localized annulus is constrained by nearby defects
        annulus = ((all_defects_mask == 0) & (defect_mask == 0)).astype(np.uint8)

    # Step 2: Fit RANSAC road plane to the annulus samples
    plane_res = fit_road_plane_ransac(depth_map, annulus)
    rel_dev_map = plane_res['depth_deviation']

    defect_bool = (defect_mask > 0)
    defect_rel_devs = rel_dev_map[defect_bool]

    if len(defect_rel_devs) == 0 or np.sum(defect_bool) == 0:
        return None

    max_rel_dev = float(np.max(defect_rel_devs))
    mean_rel_dev = float(np.mean(defect_rel_devs))

    # Step 3 & 4: Convert relative depth to metric millimetres
    if calibrator.is_calibrated:
        metric_devs_mm = calibrator.relative_to_metric_mm(defect_rel_devs, max_rel_defect=max_rel_dev)
        max_depth_mm = float(np.max(metric_devs_mm))
        mean_depth_mm = float(np.mean(metric_devs_mm))
        max_depth_m = max_depth_mm / 1000.0
        mean_depth_m = mean_depth_mm / 1000.0

        # Step 5 & 6: Volume Integration: V = Σ(d_p * a_p)
        # Using IPM bird's-eye view geometry where appropriate for perspective invariance
        if ipm_homography is not None:
            dst_size = (640, 640)
            warped_mask = warp_mask_to_ipm(defect_mask, ipm_homography, dst_size=dst_size)
            warped_rel_dev = cv2.warpPerspective(rel_dev_map, ipm_homography, dst_size, flags=cv2.INTER_LINEAR)
            warped_mask_bool = (warped_mask > 0)

            if np.sum(warped_mask_bool) > 0:
                warped_rel_vals = warped_rel_dev[warped_mask_bool]
                warped_mm = calibrator.relative_to_metric_mm(warped_rel_vals, max_rel_defect=max_rel_dev)
                # Volume = Σ (depth_m * gsd^2)
                volume_m3 = float(np.sum((warped_mm / 1000.0) * (gsd_m_per_px ** 2)))
            else:
                volume_m3 = float(np.sum((metric_devs_mm / 1000.0) * (gsd_m_per_px ** 2)))
        else:
            volume_m3 = float(np.sum((metric_devs_mm / 1000.0) * (gsd_m_per_px ** 2)))

        metric_calibrated = True
    else:
        max_depth_mm = None
        mean_depth_mm = None
        max_depth_m = None
        mean_depth_m = None
        volume_m3 = None
        metric_calibrated = False

    return {
        'pixel_count': int(np.sum(defect_bool)),
        'max_rel_depth': round(max_rel_dev, 6),
        'mean_rel_depth': round(mean_rel_dev, 6),
        'max_depth_mm': round(max_depth_mm, 2) if max_depth_mm is not None else None,
        'mean_depth_mm': round(mean_depth_mm, 2) if mean_depth_mm is not None else None,
        'max_depth_m': round(max_depth_m, 5) if max_depth_m is not None else None,
        'mean_depth_m': round(mean_depth_m, 5) if mean_depth_m is not None else None,
        'volume_m3': round(volume_m3, 7) if volume_m3 is not None else None,
        'metric_calibrated': metric_calibrated,
        'calibration_status': calibrator.calibration_status,
        'calibration_method': calibrator.calibration_method,
        'plane_diagnostics': {
            'road_plane': plane_res['road_plane'],
            'road_plane_inliers': plane_res['inlier_count'],
            'road_plane_outliers': plane_res['outlier_count'],
            'road_plane_residual': plane_res['residual'],
            'road_plane_confidence': plane_res['confidence'],
            'reliable': plane_res['reliable']
        },
        'rel_deviation_map': rel_dev_map
    }


def generate_depth_plane_visualization(depth_map, road_plane_grid, defect_mask=None):
    """
    Generate a colourised visualization showing defect depth relative to the road plane datum.
    Highlights depression cavities below the fitted road plane.

    Returns:
        base64 data URI string (JPEG).
    """
    try:
        h, w = depth_map.shape[:2]
        deviation = np.maximum(0.0, depth_map - road_plane_grid)

        # Normalize deviation across the defect region or overall
        if defect_mask is not None and np.sum(defect_mask > 0) > 0:
            defect_devs = deviation[defect_mask > 0]
            max_dev = float(np.max(defect_devs)) if len(defect_devs) > 0 else 1.0
        else:
            max_dev = float(np.max(deviation)) if np.max(deviation) > 0 else 1.0

        if max_dev < 1e-6:
            max_dev = 1.0

        norm_dev = np.clip(deviation / max_dev, 0.0, 1.0)
        u8_dev = (norm_dev * 255.0).astype(np.uint8)

        # Apply vibrant colormap for depth depression
        colored_dev = cv2.applyColorMap(u8_dev, cv2.COLORMAP_TURBO)

        # Mute background road plane to neutral grayscale so the pothole stands out
        gray_road = (np.clip(road_plane_grid / (np.max(road_plane_grid) + 1e-6), 0, 1) * 120 + 30).astype(np.uint8)
        gray_bgr = cv2.cvtColor(gray_road, cv2.COLOR_GRAY2BGR)

        if defect_mask is not None and np.sum(defect_mask > 0) > 0:
            mask_3c = np.repeat((defect_mask > 0)[:, :, np.newaxis], 3, axis=2)
            vis = np.where(mask_3c, colored_dev, cv2.addWeighted(gray_bgr, 0.7, colored_dev, 0.3, 0))
            # Draw contour of defect
            contours, _ = cv2.findContours(defect_mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            cv2.drawContours(vis, contours, -1, (0, 255, 255), 2)
        else:
            vis = colored_dev

        _, buf = cv2.imencode('.jpg', vis, [int(cv2.IMWRITE_JPEG_QUALITY), 88])
        return f"data:image/jpeg;base64,{base64.b64encode(buf).decode('utf-8')}"
    except Exception as e:
        warnings.warn(f'[metric_geometry] generate_depth_plane_visualization failed: {e}')
        return None


# =========================================================================== #
#  Depth Map Colourisation                                                     #
# =========================================================================== #

def depth_map_to_base64(depth_map):
    """
    Normalise a float32 depth map and encode as a colourised JPEG base64 string.

    Returns:
        data URI string, or None on failure.
    """
    if depth_map is None:
        return None
    try:
        d_min = depth_map.min()
        d_max = depth_map.max()
        if d_max - d_min < 1e-6:
            normalised = np.zeros_like(depth_map, dtype=np.uint8)
        else:
            normalised = ((depth_map - d_min) / (d_max - d_min) * 255).astype(np.uint8)
        coloured = cv2.applyColorMap(normalised, cv2.COLORMAP_INFERNO)
        _, encoded = cv2.imencode('.jpg', coloured, [cv2.IMWRITE_JPEG_QUALITY, 85])
        b64 = base64.b64encode(encoded).decode('utf-8')
        return f'data:image/jpeg;base64,{b64}'
    except Exception as exc:
        warnings.warn(f'[metric_geometry] depth_map_to_base64 failed: {exc}')
        return None


# =========================================================================== #
#  5. Crack / Defect Skeleton Geometry                                        #
# =========================================================================== #

def skeletonize_mask(mask):
    """
    Thin a binary defect mask to its medial axis (skeleton).

    Args:
        mask : uint8 binary (H×W), 1 = defect

    Returns:
        skeleton : bool (H×W) array — True at skeleton pixels
        Returns None if skimage unavailable.
    """
    if not _SKIMAGE_AVAILABLE:
        # Fallback: morphological thinning via repeated erosion
        # Not as accurate but doesn't require skimage
        kernel = cv2.getStructuringElement(cv2.MORPH_CROSS, (3, 3))
        thin = mask.copy().astype(np.uint8)
        done = False
        skeleton = np.zeros_like(thin, dtype=np.uint8)
        while not done:
            eroded  = cv2.erode(thin, kernel)
            temp    = cv2.dilate(eroded, kernel)
            temp    = cv2.subtract(thin, temp)
            skeleton = cv2.bitwise_or(skeleton, temp)
            thin    = eroded.copy()
            if cv2.countNonZero(thin) == 0:
                done = True
        return skeleton.astype(bool)

    bool_mask = mask.astype(bool)
    skel = _skimage_skeletonize(bool_mask)
    return skel


def crack_geometry(mask, gsd_m_per_px, skeleton=None, is_crack=True):
    """
    Compute crack geometry metrics from a binary defect mask.
    Only computes valid crack geometry if the defect is actually a crack.

    Args:
        mask         : uint8 binary (H×W) defect mask (1 = defect)
        gsd_m_per_px : ground sampling distance from IPM (m/pixel)
        skeleton     : optional pre-computed skeleton (bool H×W).
                       If None, it is computed internally.
        is_crack     : bool flag indicating if defect is a crack rather than cavity.

    Returns:
        dict with crack length in metres, mean/max width in mm, density, and defect area in m².
        Returns None if mask is empty or if defect is not a crack.
    """
    if mask is None or np.sum(mask) == 0 or not is_crack:
        return None

    if skeleton is None:
        skeleton = skeletonize_mask(mask)

    if skeleton is None or np.sum(skeleton) == 0:
        return None

    # ----- Crack length (skeleton arc-length) -----
    # Count skeleton pixels — each pixel represents gsd_m_per_px of length
    skel_pixels = int(np.sum(skeleton))
    crack_length_m = skel_pixels * gsd_m_per_px

    # ----- Average & max width via distance transform -----
    # The distance transform at skeleton pixels gives the half-width
    dist = cv2.distanceTransform(mask.astype(np.uint8) * 255, cv2.DIST_L2, 5)
    skel_u8 = skeleton.astype(np.uint8)
    skel_ys, skel_xs = np.where(skel_u8 > 0)
    if len(skel_xs) > 0:
        half_widths = dist[skel_ys, skel_xs]
        # Filter spurious boundary artifacts for research precision
        if len(half_widths) >= 10:
            upper_limit = float(np.percentile(half_widths, 98))
            valid_hw = half_widths[(half_widths >= 0.5) & (half_widths <= upper_limit)]
            if len(valid_hw) == 0:
                valid_hw = half_widths
        else:
            valid_hw = half_widths

        avg_half_width_px = float(np.mean(valid_hw))
        max_half_width_px = float(np.percentile(valid_hw, 95) if len(valid_hw) > 5 else np.max(valid_hw))
        avg_crack_width_m = avg_half_width_px * 2.0 * gsd_m_per_px
        max_crack_width_m = max_half_width_px * 2.0 * gsd_m_per_px
    else:
        avg_crack_width_m = 0.0
        max_crack_width_m = 0.0

    # ----- Defect area -----
    defect_area_m2 = float(np.sum(mask)) * (gsd_m_per_px ** 2)

    # ----- Linear density -----
    if defect_area_m2 > 0:
        linear_density = crack_length_m / defect_area_m2
    else:
        linear_density = 0.0

    return {
        'crack_length_m'          : float(crack_length_m),
        'avg_crack_width_m'       : float(avg_crack_width_m),
        'avg_crack_width_mm'      : round(float(avg_crack_width_m * 1000.0), 2),
        'max_crack_width_m'       : float(max_crack_width_m),
        'max_crack_width_mm'      : round(float(max_crack_width_m * 1000.0), 2),
        'linear_density_m_per_m2' : float(linear_density),
        'defect_area_m2'          : float(defect_area_m2),
        'is_crack'                : True,
    }


# =========================================================================== #
#  Crack Branch / Node Analysis                                                #
# =========================================================================== #

def crack_branch_node_analysis(skeleton):
    """
    Analyse the crack skeleton as a graph to detect branches and nodes.

    Pixel classification by 8-connected neighbour count:
      1  neighbour  → endpoint
      2  neighbours → interior continuation pixel
      ≥3 neighbours → junction / branch point

    Returns:
        dict with 'branch_count', 'node_count', 'endpoint_count',
                  'junction_count', 'branch_density'
        Returns None if skeleton is empty.
    """
    if skeleton is None:
        return None

    skel_u8 = skeleton.astype(np.uint8)
    if np.sum(skel_u8) == 0:
        return None

    kernel = np.ones((3, 3), dtype=np.float32)
    neighbour_count = cv2.filter2D(skel_u8.astype(np.float32), cv2.CV_32F, kernel)
    neighbour_count_at_skel = (neighbour_count - 1) * skel_u8.astype(np.float32)

    endpoints  = int(np.sum((neighbour_count_at_skel == 1) & (skel_u8 > 0)))
    junctions  = int(np.sum((neighbour_count_at_skel >= 3) & (skel_u8 > 0)))
    total_skel = int(np.sum(skel_u8))

    branch_density = float(junctions) / float(total_skel) if total_skel > 0 else 0.0

    return {
        'branch_count'  : junctions,
        'node_count'    : endpoints + junctions,
        'endpoint_count': endpoints,
        'junction_count': junctions,
        'branch_density': float(branch_density),
    }


# =========================================================================== #
#  Crack Pattern Classification & Cross-Check                                  #
# =========================================================================== #

def classify_crack_pattern(branch_density, mask=None):
    """
    Classify crack pattern based on skeleton geometry.

    Rules (based on ASTM D6433-18 geometric interpretation):
      - Alligator    : branch_density > 0.05 (complex branching network)
      - Longitudinal : low branching, major axis along road direction
      - Transverse   : low branching, major axis across road
      - Linear       : low branching, no strong orientation
      - Other        : does not fit above

    Returns str: 'Alligator', 'Longitudinal', 'Transverse', 'Linear', or 'Other'
    """
    if branch_density is None:
        return 'Unknown'

    if branch_density > 0.05:
        return 'Alligator'

    if mask is not None and np.sum(mask) > 0:
        contours, _ = cv2.findContours(
            mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )
        if contours:
            all_pts = np.vstack(contours)
            _, (bbox_w, bbox_h), _ = cv2.minAreaRect(all_pts)
            if bbox_w > 1e-3 and bbox_h > 1e-3:
                aspect = bbox_w / bbox_h if bbox_w >= bbox_h else bbox_h / bbox_w
                if aspect > 2.5:
                    return 'Transverse' if bbox_w > bbox_h else 'Longitudinal'
                return 'Linear'

    return 'Linear' if branch_density < 0.02 else 'Other'


def classify_defect_geometry(mask):
    """
    Classify defect geometry based on shape compactness, aspect ratio, and medial-axis branching.

    Distinguishes cavities (potholes) from linear/alligator cracks.

    Returns:
        'Cavity / Pothole' | 'Linear Crack' | 'Alligator / Fatigue Crack' | 'Complex Wear'
    """
    if mask is None or np.sum(mask) == 0:
        return 'Unknown'

    contours, _ = cv2.findContours(mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return 'Unknown'

    cnt = max(contours, key=cv2.contourArea)
    area = cv2.contourArea(cnt)
    perimeter = cv2.arcLength(cnt, closed=True)
    if perimeter < 1e-4:
        return 'Linear Crack'

    circularity = (4.0 * np.pi * area) / (perimeter ** 2)
    _rect_center, (rw, rh), _rect_angle = cv2.minAreaRect(cnt)
    aspect_ratio = max(rw, rh) / max(min(rw, rh), 1e-3)

    skel = skeletonize_mask(mask)
    bn = crack_branch_node_analysis(skel) if skel is not None else None
    branch_density = bn['branch_density'] if bn else 0.0

    if circularity > 0.30 and aspect_ratio < 2.5 and branch_density < 0.05:
        return 'Cavity / Pothole'
    elif branch_density > 0.07 or (aspect_ratio < 2.5 and branch_density > 0.04):
        return 'Alligator / Fatigue Crack'
    elif aspect_ratio >= 2.5:
        if rw > rh:
            return 'Transverse Crack'
        else:
            return 'Longitudinal Crack'
    else:
        return 'Linear Crack'


def cross_check_classification(appearance_class, geometric_pattern):
    """
    Cross-check appearance-based (YOLO) classification against geometric classification.

    Returns:
        dict: {
            'appearance_class': str,
            'geometric_pattern': str,
            'cross_check_result': 'Agreement' | 'Disagreement',
            'review_required': bool,
            'reason': str
        }
    """
    app = (appearance_class or '').lower()
    geo = (geometric_pattern or '').lower()

    is_app_pothole = 'pothole' in app or 'cavity' in app
    is_app_crack = 'crack' in app

    is_geo_pothole = 'cavity' in geo or 'pothole' in geo
    is_geo_crack = 'crack' in geo or 'linear' in geo or 'alligator' in geo

    if is_app_pothole and is_geo_pothole:
        result = 'Agreement'
        review = False
        reason = 'Both appearance features and boundary compactness classify the defect as a localized cavity/pothole.'
    elif is_app_crack and is_geo_crack:
        result = 'Agreement'
        review = False
        reason = 'Both appearance texture and medial-axis skeleton geometry classify the defect as a crack pattern.'
    elif is_app_pothole and is_geo_crack:
        result = 'Disagreement'
        review = True
        reason = 'Appearance model classified defect as Pothole, but medial-axis elongation and high aspect ratio indicate linear crack geometry.'
    elif is_app_crack and is_geo_pothole:
        result = 'Disagreement'
        review = True
        reason = 'Appearance model classified defect as Crack, but geometric compactness and low aspect ratio indicate a localized cavity.'
    else:
        result = 'Agreement' if app == geo else 'Disagreement'
        review = (result == 'Disagreement')
        reason = f'Appearance: {appearance_class} vs Geometry: {geometric_pattern}'

    return {
        'appearance_class': appearance_class or 'Unknown',
        'geometric_pattern': geometric_pattern or 'Unknown',
        'cross_check_result': result,
        'review_required': review,
        'reason': reason
    }


# =========================================================================== #
#  ASTM D6433 Severity Mapping                                                 #
# =========================================================================== #

def astm_d6433_severity(avg_width_mm, max_width_mm=None):
    """
    Map crack width to ASTM D6433 severity level.

    Thresholds (ASTM D6433-18, generalised for research purposes):
      Low      : effective width < 6 mm   (hairline / fine cracks)
      Moderate : effective width 6–19 mm  (medium-severity cracking)
      High     : effective width > 19 mm  (severe / open cracking)

    Returns str: 'Low', 'Moderate', 'High', or 'Unknown'
    """
    if avg_width_mm is None or avg_width_mm < 0:
        return 'Unknown'

    eff = avg_width_mm
    if max_width_mm is not None and max_width_mm > avg_width_mm:
        eff = 0.7 * avg_width_mm + 0.3 * max_width_mm   # safety-first weighting

    if eff < 6.0:
        return 'Low'
    elif eff < 19.0:
        return 'Moderate'
    else:
        return 'High'


# =========================================================================== #
#  6. Repair Patch Area Consolidation                                         #
# =========================================================================== #

def repair_patch_area(mask, gsd_m_per_px, margin_fraction=0.10):
    """
    Compute the defect area and the repair patch area separately.

    Defect area  = precise area of the segmented defect mask.
    Patch area   = area of the convex hull of each connected component
                   (the actual region of asphalt that needs to be removed
                   and patched), expanded by margin_fraction.

    Separating these is important for research accuracy:
      - Material quantity calculations should use PATCH area.
      - Defect severity / coverage percentage should use DEFECT area.

    Args:
        mask             : uint8 binary (H×W) combined defect mask (1 = defect)
        gsd_m_per_px     : metres per pixel from IPM
        margin_fraction  : fractional perimeter expansion for patch planning

    Returns:
        dict with:
          'defect_area_m2' : float
          'patch_area_m2'  : float  (convex hull + margin)
          'num_patches'    : int
          'patch_hulls_px' : list of convex hull point arrays (pixel coords)
    """
    if np.sum(mask) == 0:
        return {
            'defect_area_m2'     : 0.0,
            'patch_area_m2'      : 0.0,
            'num_patches'        : 0,
            'consolidation_ratio': 1.0,
            'patch_hulls_px'     : [],
        }

    gsd2 = gsd_m_per_px ** 2
    defect_area_m2 = float(np.sum(mask)) * gsd2

    contours, _ = cv2.findContours(mask.astype(np.uint8), cv2.RETR_EXTERNAL,
                                    cv2.CHAIN_APPROX_SIMPLE)
    total_hull_area_px = 0
    hulls = []
    for cnt in contours:
        if len(cnt) >= 3:
            hull = cv2.convexHull(cnt)
            hull_area = cv2.contourArea(hull)
            total_hull_area_px += hull_area
            hulls.append(hull)

    if total_hull_area_px == 0:
        total_hull_area_px = float(np.sum(mask))

    patch_area_m2 = float(total_hull_area_px) * gsd2 * (1.0 + margin_fraction)
    consolidation_ratio = (patch_area_m2 / defect_area_m2) if defect_area_m2 > 0 else 1.0

    return {
        'defect_area_m2'     : float(defect_area_m2),
        'patch_area_m2'      : float(patch_area_m2),
        'num_patches'        : len(hulls),
        'consolidation_ratio': float(consolidation_ratio),
        'patch_hulls_px'     : hulls,
    }


# =========================================================================== #
#  7. Standalone test entry point                                             #
# =========================================================================== #

if __name__ == '__main__':
    print('[metric_geometry] Running self-test with synthetic data...')

    # ── Shoelace unit tests ─────────────────────────────────────────────────
    sq_area = shoelace_area([[0,0],[1,0],[1,1],[0,1]])
    assert abs(sq_area - 1.0) < 1e-10, f'Shoelace unit square FAIL: {sq_area}'
    print(f'  Shoelace unit square: {sq_area:.10f}  OK')
    rect_area = shoelace_area([[0,0],[5,0],[5,3],[0,3]])
    assert abs(rect_area - 15.0) < 1e-10, f'Shoelace 3x5 rect FAIL: {rect_area}'
    print(f'  Shoelace 3x5 rectangle: {rect_area:.10f}  OK')

    fake_img  = np.random.randint(50, 200, (480, 640, 3), dtype=np.uint8)
    fake_mask = np.zeros((480, 640), dtype=np.uint8)
    fake_mask[190:290, 220:420] = 1

    # Mask refinement
    refined = refine_mask(fake_mask)
    print(f'  Refined mask pixels: {np.sum(refined)}')

    # IPM
    ipm_result = compute_ipm(fake_img)
    print(f'  IPM GSD: {ipm_result["gsd_m_per_px"]:.6f} m/px  method={ipm_result["method"]}')

    warped_mask = warp_mask_to_ipm(refined, ipm_result['H'])
    print(f'  Warped mask pixels: {np.sum(warped_mask)}')

    # Polygon/shoelace area
    poly = polygon_area_m2(warped_mask, ipm_result['gsd_m_per_px'])
    if poly:
        print(f'  Polygon area (shoelace): {poly["area_m2"]:.4f} m2  (pixel area: {poly["pixel_area_m2"]:.4f} m2)')

    # Area uncertainty
    unc = area_uncertainty(warped_mask, ipm_result['gsd_m_per_px'], reprojection_error_px=1.8)
    if unc:
        print(f'  Area 95% CI: [{unc["ci_low_m2"]:.4f}, {unc["ci_high_m2"]:.4f}] m2')

    # Geometry
    skel = skeletonize_mask(warped_mask)
    geom = crack_geometry(warped_mask, ipm_result['gsd_m_per_px'], skeleton=skel)
    print(f'  Crack length: {geom["crack_length_m"]:.3f} m')
    print(f'  Avg width:    {geom["avg_crack_width_mm"]:.2f} mm')
    print(f'  Max width:    {geom["max_crack_width_mm"]:.2f} mm')

    # Branch/node analysis
    bn = crack_branch_node_analysis(skel)
    if bn:
        pat = classify_crack_pattern(bn['branch_density'], mask=warped_mask)
        astm = astm_d6433_severity(geom['avg_crack_width_mm'], geom['max_crack_width_mm'])
        print(f'  Branch density: {bn["branch_density"]:.4f}  Pattern: {pat}  ASTM: {astm}')

    # Patch area
    patch = repair_patch_area(warped_mask, ipm_result['gsd_m_per_px'])
    print(f'  Patch area: {patch["patch_area_m2"]:.4f} m2  ratio={patch["consolidation_ratio"]:.3f}')

    # Depth colourisation
    fake_depth = np.random.rand(480, 640).astype(np.float32)
    db64 = depth_map_to_base64(fake_depth)
    print(f'  Depth map b64: {len(db64)} chars  OK')

    # RANSAC Road-plane, Annulus & DepthCalibrator tests
    annulus = create_defect_annulus(fake_mask)
    assert np.sum(annulus) > 100, f'Annulus creation FAIL: {np.sum(annulus)}'
    assert np.sum(annulus & fake_mask) == 0, 'Annulus contains defect pixels FAIL'
    print(f'  Annulus pixels: {np.sum(annulus)} (overlap with defect: {np.sum(annulus & fake_mask)})  OK')

    # Create synthetic planar road with a depression
    yy, xx = np.mgrid[0:480, 0:640].astype(np.float32)
    synth_road = 0.0002 * xx + 0.0005 * yy + 0.20
    synth_depth = synth_road.copy()
    synth_depth[fake_mask > 0] += 0.030  # 30 mm relative depression
    # Add small noise to road
    synth_depth += np.random.normal(0, 0.0005, (480, 640)).astype(np.float32)

    plane_fit = fit_road_plane_ransac(synth_depth, annulus)
    assert plane_fit['reliable'], 'RANSAC road plane reliability FAIL'
    print(f'  RANSAC road plane inliers: {plane_fit["inlier_count"]}, RMS residual: {plane_fit["residual"]:.6f}  OK')

    # Test DepthCalibrator (CAM-001)
    calib = DepthCalibrator(camera_id='CAM-001')
    assert calib.is_calibrated, 'CAM-001 calibration status FAIL'
    depth_vol = analyze_defect_depth_and_volume(
        fake_mask,
        synth_depth,
        fake_mask,
        ipm_result['gsd_m_per_px'],
        calib,
        ipm_homography=ipm_result['H']
    )
    assert depth_vol is not None and depth_vol['max_depth_mm'] > 10.0, f'Depth/Volume FAIL: {depth_vol}'
    assert depth_vol['volume_m3'] > 0.0, f'Volume > 0 FAIL: {depth_vol["volume_m3"]}'
    print(f'  Defect Max Depth: {depth_vol["max_depth_mm"]:.1f} mm, Mean Depth: {depth_vol["mean_depth_mm"]:.1f} mm')
    print(f'  Defect Volume: {depth_vol["volume_m3"]:.6f} m3 (per-pixel Riemann integration)  OK')

    plane_vis = generate_depth_plane_visualization(synth_depth, plane_fit['road_plane_grid'], fake_mask)
    assert plane_vis is not None and len(plane_vis) > 100, 'Plane visualization FAIL'
    print(f'  Plane visualization b64: {len(plane_vis)} chars  OK')

    # Test Uncalibrated fallback
    uncalib = DepthCalibrator(camera_id='UNKNOWN_CAMERA')
    assert not uncalib.is_calibrated, 'Uncalibrated camera must return False'
    uncalib_res = analyze_defect_depth_and_volume(fake_mask, synth_depth, fake_mask, ipm_result['gsd_m_per_px'], uncalib)
    assert uncalib_res['max_depth_mm'] is None and uncalib_res['volume_m3'] is None
    assert uncalib_res['calibration_status'] == 'Calibration Required'
    print('  Uncalibrated camera fallback test: Calibration Required  OK')

    print('[metric_geometry] Self-test PASSED')
