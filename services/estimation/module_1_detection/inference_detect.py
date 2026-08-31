import os
import cv2
import numpy as np
import torch
import torch.nn as nn
from torchvision import models, transforms
from ultralytics import YOLO
import joblib
import sys

# Add root to sys path if not there so we can import utils
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from utils.image_preprocessing import preprocess_image, calculate_shadow_density, calculate_edge_sharpness

class FeatureExtractor(nn.Module):
    def __init__(self):
        super(FeatureExtractor, self).__init__()
        # Use a pre-trained ResNet as a feature extractor
        resnet = models.resnet18(pretrained=True)
        # Remove the final classification layer
        self.features = nn.Sequential(*list(resnet.children())[:-1])
        
    def forward(self, x):
        x = self.features(x)
        return x.view(x.size(0), -1)

class DefectDetector:
    def __init__(self, yolo_model_path: str = 'models/yolov8_custom.pt', 
                 rf_model_path: str = 'models/rf_risk_model.pkl'):
        """
        Initializes the defect detection pipeline.
        NOTE: These paths are placeholders and must be populated with trained models.
        """
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # 1. Load YOLOv8 for object detection (potholes, cracks)
        # We wrap in a try-catch to allow instantiation even if weights don't exist yet for testing.
        try:
            self.yolo = YOLO(yolo_model_path)
            print(f"Loaded YOLO model from {yolo_model_path}")
        except Exception as e:
            print(f"Warning: Could not load YOLO model. {e}")
            self.yolo = None
            
        # 2. Load CNN Feature Extractor
        self.cnn_extractor = FeatureExtractor().to(self.device)
        self.cnn_extractor.eval()
        
        # 3. Load Random Forest Classifier
        try:
            self.rf_classifier = joblib.load(rf_model_path)
            print(f"Loaded RF model from {rf_model_path}")
        except Exception as e:
            print(f"Warning: Could not load RF model. {e}")
            self.rf_classifier = None
            
        # Standard PyTorch transforms for the CNN
        self.transform = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

    def predict(self, image_bytes: bytes) -> dict:
        """
        Runs the full detection and risk classification pipeline.
        """
        # Step 1: Preprocess Image (CLAHE & Denoising)
        image = preprocess_image(image_bytes)
        
        if self.yolo is None:
            return {"error": "YOLO model not loaded. Pipeline cannot proceed."}
            
        # Step 2: YOLO Inference
        results = self.yolo(image)
        
        detections = []
        
        for r in results:
            boxes = r.boxes
            for box in boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                conf = float(box.conf[0])
                cls = int(box.cls[0])
                class_name = self.yolo.names[cls]
                
                # Crop ROI for feature extraction
                roi = image[y1:y2, x1:x2]
                
                # If the box is too small, skip it
                if roi.shape[0] < 10 or roi.shape[1] < 10:
                    continue
                    
                # Step 3: Visual Approximations (Heuristics)
                shadow_density = calculate_shadow_density(roi)
                edge_sharpness = calculate_edge_sharpness(roi)
                
                # Step 4: CNN Feature Extraction
                roi_tensor = self.transform(roi).unsqueeze(0).to(self.device)
                with torch.no_grad():
                    cnn_features = self.cnn_extractor(roi_tensor).cpu().numpy().flatten()
                
                severity_class = "Unknown"
                
                # Step 5: Random Forest Risk Classification
                if self.rf_classifier is not None:
                    # Construct feature vector: [confidence, shadow, edge, cnn_feat_1, cnn_feat_2, ...]
                    feature_vector = np.concatenate(([conf, shadow_density, edge_sharpness], cnn_features))
                    # Reshape for sklearn
                    feature_vector = feature_vector.reshape(1, -1)
                    
                    try:
                        severity_pred = self.rf_classifier.predict(feature_vector)[0]
                        severity_map = {0: "Minor", 1: "Moderate", 2: "Major", 3: "Critical"}
                        severity_class = severity_map.get(int(severity_pred), "Unknown")
                    except Exception as e:
                        print(f"Error during RF prediction: {e}")
                
                detections.append({
                    "class": class_name,
                    "confidence": round(conf, 4),
                    "bbox": [x1, y1, x2, y2],
                    "shadow_density": round(shadow_density, 4),
                    "edge_sharpness": round(edge_sharpness, 4),
                    "severity": severity_class
                })
                
        return {
            "status": "success",
            "num_defects": len(detections),
            "detections": detections
        }

if __name__ == "__main__":
    # Quick sanity check for syntax
    print("DefectDetector pipeline loaded successfully.")
