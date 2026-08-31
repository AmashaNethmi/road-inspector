import os
import cv2
import numpy as np
import torch
from ultralytics import YOLO
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from utils.image_preprocessing import preprocess_image, apply_inverse_perspective_mapping

class AreaEstimator:
    def __init__(self, seg_model_path: str = 'models/unet_weights.pt'):
        """
        Initializes the semantic segmentation pipeline for exact area estimation.
        Handles both U-Net (PyTorch) or YOLOv8-Seg models.
        """
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Load Segmentation Model (Placeholder for YOLOv8-seg or custom U-Net)
        try:
            # We assume YOLO-seg format for the base skeleton to easily plug into Ultralytics API
            self.seg_model = YOLO(seg_model_path)
            print(f"Loaded Segmentation model from {seg_model_path}")
        except Exception as e:
            print(f"Warning: Could not load Segmentation model. {e}")
            self.seg_model = None
            
        # Hardcoded Pinhole Calibration (Pixel to Real-World scaling)
        # e.g., 1 pixel = 0.005 meters (0.5 cm). This MUST be calibrated.
        self.pixel_to_meter_ratio = 0.005 
        
    def calculate_shoelace_area(self, contour: np.ndarray) -> float:
        """
        Calculates the area of an irregular polygon using the Shoelace formula (or OpenCV contour area).
        Returns the area in square meters based on the pixel_to_meter_ratio.
        """
        pixel_area = cv2.contourArea(contour)
        
        # Area in sq meters = pixel_area * (pixel_to_meter_ratio)^2
        # Because we are converting an area, the linear scaling factor is squared.
        real_world_area = pixel_area * (self.pixel_to_meter_ratio ** 2)
        
        return float(real_world_area)

    def predict_area(self, image_bytes: bytes) -> dict:
        """
        Runs the full segmentation, IPM correction, and area estimation pipeline.
        """
        # Step 1: Preprocess Image
        image = preprocess_image(image_bytes)
        
        if self.seg_model is None:
            return {"error": "Segmentation model not loaded."}
            
        # Step 2: Inference to get binary masks
        results = self.seg_model(image)
        
        repairs = []
        
        for r in results:
            if r.masks is None:
                continue
                
            # Iterate through each detected mask in the image
            for mask, box in zip(r.masks.data, r.boxes):
                # Convert tensor mask to numpy binary image (0 or 255)
                mask_np = mask.cpu().numpy().astype(np.uint8) * 255
                
                # Resize mask back to original image size if it was downscaled
                mask_np = cv2.resize(mask_np, (image.shape[1], image.shape[0]))
                
                # Step 3: Inverse Perspective Mapping (IPM)
                # We flatten the mask so the perspective distortion doesn't ruin the area calculation
                flat_mask = apply_inverse_perspective_mapping(mask_np)
                
                # Step 4: Morphological Operations to clean noise
                kernel = np.ones((5,5), np.uint8)
                cleaned_mask = cv2.morphologyEx(flat_mask, cv2.MORPH_OPEN, kernel)
                cleaned_mask = cv2.morphologyEx(cleaned_mask, cv2.MORPH_CLOSE, kernel)
                
                # Step 5: Suzuki's Algorithm (Contour Tracing)
                contours, _ = cv2.findContours(cleaned_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                
                for contour in contours:
                    # Ignore tiny false positive specs
                    if cv2.contourArea(contour) < 50:
                        continue
                        
                    # Step 6: Shoelace Area Calculation
                    area_sq_meters = self.calculate_shoelace_area(contour)
                    
                    class_name = self.seg_model.names[int(box.cls[0])]
                    
                    repairs.append({
                        "class": class_name,
                        "area_sq_meters": round(area_sq_meters, 4),
                        # Convert contour array to list of points for frontend JSON transmission
                        "polygon_points": contour.reshape(-1, 2).tolist() 
                    })
                    
        return {
            "status": "success",
            "total_defects_segmented": len(repairs),
            "repair_estimates": repairs
        }

if __name__ == "__main__":
    print("AreaEstimator segmentation pipeline loaded successfully.")
