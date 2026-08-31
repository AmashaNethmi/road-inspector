import os
import sys
import json
import numpy as np
import cv2

# Add root to sys path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from module_1_detection.inference_detect import DefectDetector

def main():
    print("Initializing DefectDetector pipeline...")
    # Initialize without weights (will print warnings but load CNN)
    detector = DefectDetector(yolo_model_path="dummy.pt", rf_model_path="dummy.pkl")
    
    print("Creating a mock image (black square)...")
    # Create a simple 500x500 black image as a mock byte payload
    mock_image = np.zeros((500, 500, 3), dtype=np.uint8)
    
    # Encode to bytes as if it came from an HTTP request
    success, encoded_image = cv2.imencode('.jpg', mock_image)
    if not success:
        print("Failed to encode mock image.")
        return
        
    image_bytes = encoded_image.tobytes()
    
    print("Running inference prediction pipeline...")
    result = detector.predict(image_bytes)
    
    print("\nResult JSON:")
    print(json.dumps(result, indent=4))

if __name__ == "__main__":
    main()
