# pyright: reportAttributeAccessIssue=none, reportGeneralTypeIssues=none, reportOptionalMemberAccess=none
# type: ignore
"""
Road Inspector — Train Crack Segmentation Model (YOLOv8-Seg)
============================================================
Supports both:
  1. Google Colab (with free GPU acceleration & automatic cloud download)
  2. Local workstation (Windows/Linux/macOS with local dataset paths)
"""

import os
import subprocess
import sys
import urllib.request
import zipfile

# ---------------------------------------------------------------------------
# 1. Environment Detection (Google Colab vs Local)
# ---------------------------------------------------------------------------
base_repo = os.path.dirname(os.path.abspath(__file__))
IS_COLAB = 'google.colab' in sys.modules or os.path.exists('/content')
print(f"--> Environment: {'Google Colab' if IS_COLAB else 'Local Workstation'}")

# ---------------------------------------------------------------------------
# 2. Check Device / GPU
# ---------------------------------------------------------------------------
print("--> Checking compute device...")
cuda_available = False
device = 'cpu'
try:
    import torch
    cuda_available = torch.cuda.is_available()
    device = 0 if cuda_available else 'cpu'
    print(f"    CUDA Available: {cuda_available}")
    if cuda_available:
        print(f"    GPU Device: {torch.cuda.get_device_name(0)}")
    else:
        print("    Using CPU for training/validation.")
except Exception as e:  # noqa: BLE001
    device = 'cpu'
    print(f"    Device check note: {e}")

# ---------------------------------------------------------------------------
# 3. Ensure Ultralytics is installed
# ---------------------------------------------------------------------------
try:
    from ultralytics import YOLO
except ImportError:
    print("--> Installing ultralytics...")
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", "ultralytics"], check=True)
    from ultralytics import YOLO

# ---------------------------------------------------------------------------
# 4. Resolve Dataset Path
# ---------------------------------------------------------------------------
if IS_COLAB:
    dataset_dir = "/content/datasets/crack-seg"
    dataset_zip = "/content/datasets/crack-seg.zip"
    os.makedirs("/content/datasets", exist_ok=True)

    if not os.path.exists(dataset_dir):
        print("\n--> Downloading crack-seg dataset (~91.6 MB)...")
        url = "https://github.com/ultralytics/assets/releases/download/v0.0.0/crack-seg.zip"
        urllib.request.urlretrieve(url, dataset_zip)
        print("--> Extracting dataset...")
        with zipfile.ZipFile(dataset_zip, "r") as zip_ref:
            zip_ref.extractall("/content/datasets/crack-seg")
        print("--> Dataset ready at:", dataset_dir)
    yaml_path = "/content/crack-seg.yaml"
    project_dir = "/content/runs/crack_seg"
else:
    # Local workspace path resolution
    base_repo = os.path.dirname(os.path.abspath(__file__))
    local_candidates = [
        os.path.join(base_repo, "RepairAreaSegmentation", "src", "dataset", "Train model", "crack-seg"),
        os.path.join(base_repo, "src", "dataset", "Train model", "crack-seg"),
        os.path.join(base_repo, "crack-seg"),
    ]
    dataset_dir = None
    for cand in local_candidates:
        if os.path.exists(cand):
            dataset_dir = cand
            break
    if not dataset_dir:
        dataset_dir = local_candidates[0]

    yaml_path = os.path.join(os.path.dirname(dataset_dir), "crack-seg.yaml") if os.path.exists(os.path.join(os.path.dirname(dataset_dir), "crack-seg.yaml")) else os.path.join(dataset_dir, "crack-seg.yaml")
    project_dir = os.path.join(base_repo, "runs", "crack_seg")

# Create / verify YAML configuration
clean_dataset_path = dataset_dir.replace('\\', '/')
yaml_content = f"""
path: {clean_dataset_path}
train: images/train
val: images/val
test: images/test

names:
  0: crack
"""
with open(yaml_path, "w") as f:
    f.write(yaml_content.strip())
print(f"--> Dataset YAML configured at: {yaml_path}")

# ---------------------------------------------------------------------------
# 5. Train YOLOv8-Seg Model
# ---------------------------------------------------------------------------
print(f"\n--> Starting YOLOv8-seg training on device: {device}...")
model = YOLO("yolov8n-seg.pt")

results = model.train(
    data=yaml_path,
    epochs=50,
    imgsz=640,
    batch=16 if cuda_available else 4,
    device=device,
    workers=4 if cuda_available else 0,
    optimizer="AdamW",
    lr0=0.01,
    patience=15,
    project=project_dir,
    name="train_exp",
    save=True,
    exist_ok=True
)

# ---------------------------------------------------------------------------
# 6. Evaluate Validation Metrics
# ---------------------------------------------------------------------------
best_weights = os.path.join(project_dir, "train_exp", "weights", "best.pt")
if os.path.exists(best_weights):
    print("\n--> Validating best model weights...")
    best_model = YOLO(best_weights)
    metrics = best_model.val(data=yaml_path, split="val")

    print("\n==========================================")
    print("       TRAINING COMPLETE METRICS          ")
    print("==========================================")
    print(f"Mask mAP@50:     {metrics.seg.map50:.4f}")
    print(f"Mask mAP@50-95:  {metrics.seg.map:.4f}")
    print(f"Box mAP@50:      {metrics.box.map50:.4f}")
    print(f"Box mAP@50-95:   {metrics.box.map:.4f}")
    print("==========================================")
    print(f"\nTrained model weights saved to: {best_weights}")

    # In Colab: initiate browser download
    if IS_COLAB:
        try:
            import importlib
            colab_files = importlib.import_module("google.colab.files")
            colab_files.download(best_weights)
        except Exception as dl_err:  # noqa: BLE001
            print(f"Colab download note: {dl_err}")
    else:
        # Copy to project model weights folder if on local machine
        target_model_path = os.path.join(base_repo, "RepairAreaSegmentation", "backend", "models", "best.pt")
        if os.path.exists(os.path.dirname(target_model_path)):
            import shutil
            shutil.copy2(best_weights, target_model_path)
            print(f"✓ Automatically copied weights to: {target_model_path}")
else:
    print(f"Training completed. Check weights at: {project_dir}")
