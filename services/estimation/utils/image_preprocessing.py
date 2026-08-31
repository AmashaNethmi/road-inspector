import cv2
import numpy as np

def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """
    Decodes image bytes, applies CLAHE for contrast enhancement, 
    and applies Non-Local Means Denoising to reduce IoT camera artifacts.
    """
    # 1. Decode image bytes to numpy array (OpenCV format)
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        raise ValueError("Could not decode image bytes")
        
    # 2. Denoising (Fast Non-Local Means Denoising)
    # This is crucial for low-quality IoT camera feeds
    denoised = cv2.fastNlMeansDenoisingColored(image, None, 10, 10, 7, 21)
    
    # 3. Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
    # Convert to LAB color space to apply CLAHE only to the Lightness channel
    lab = cv2.cvtColor(denoised, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    
    # Create CLAHE object and apply it to the L-channel
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    cl = clahe.apply(l_channel)
    
    # Merge the CLAHE enhanced L-channel with the original A and B channels
    merged = cv2.merge((cl, a_channel, b_channel))
    
    # Convert back to BGR format
    enhanced_image = cv2.cvtColor(merged, cv2.COLOR_LAB2BGR)
    
    return enhanced_image

def calculate_shadow_density(roi: np.ndarray) -> float:
    """
    Calculates the ratio of dark pixels in a region of interest (ROI)
    to approximate depth or severity of a pothole/crack.
    """
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    # Threshold for what is considered a "dark" pixel
    threshold = 50 
    dark_pixels = np.sum(gray < threshold)
    total_pixels = gray.size
    
    if total_pixels == 0:
        return 0.0
        
    return float(dark_pixels / total_pixels)

def calculate_edge_sharpness(roi: np.ndarray) -> float:
    """
    Calculates the variance of the Laplacian to measure edge sharpness.
    Sharp edges can indicate fresh, severe cracks or steep pothole walls.
    """
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    return float(laplacian_var)

def apply_inverse_perspective_mapping(image: np.ndarray, src_points=None, dst_points=None) -> np.ndarray:
    "\""
    Corrects the angular tilt of a vehicle-mounted camera, flattening the image into an 
    orthographic top-down view using a homography matrix.
    "\""
    h, w = image.shape[:2]
    
    # If no points are provided, we use a generic assumption for a dashcam view
    # (These points must be calibrated to the specific vehicle/camera setup later)
    if src_points is None:
        src_points = np.float32([
            [w * 0.4, h * 0.6], [w * 0.6, h * 0.6],  # Top-left, Top-right of road ROI
            [w * 0.1, h * 0.9], [w * 0.9, h * 0.9]   # Bottom-left, Bottom-right of road ROI
        ])
        
    if dst_points is None:
        # Map them to a flat top-down rectangle
        dst_points = np.float32([
            [0, 0], [w, 0],
            [0, h], [w, h]
        ])
        
    # Calculate the perspective transform matrix
    matrix = cv2.getPerspectiveTransform(src_points, dst_points)
    
    # Warp the image
    warped_image = cv2.warpPerspective(image, matrix, (w, h))
    
    return warped_image
