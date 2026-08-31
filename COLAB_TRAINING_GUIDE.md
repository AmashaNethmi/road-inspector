# 🚀 How to Train `crack-seg` Dataset on Google Colab (Step-by-Step Guide)

This guide walks you through training the **`crack-seg`** dataset (3,717 training images, 200 validation images) using **Google Colab's free NVIDIA T4 GPU**.

---

## 📁 Files Prepared in This Repository

1. [`train_crack_seg_colab.ipynb`](file:///d:/Downloads/road-inspector-IT22252340-Repair-Area-Segmentation/road-inspector-IT22252340-Repair-Area-Segmentation/train_crack_seg_colab.ipynb): Ready-to-upload Jupyter Notebook with cells pre-configured.
2. [`train_colab.py`](file:///d:/Downloads/road-inspector-IT22252340-Repair-Area-Segmentation/road-inspector-IT22252340-Repair-Area-Segmentation/train_colab.py): Standalone Python script for Colab.
3. Dataset folder: [`RepairAreaSegmentation/src/dataset/Train model/crack-seg/`](file:///d:/Downloads/road-inspector-IT22252340-Repair-Area-Segmentation/road-inspector-IT22252340-Repair-Area-Segmentation/RepairAreaSegmentation/src/dataset/Train%20model/crack-seg/)

---

## ⚡ Method 1: Upload the Jupyter Notebook to Google Colab (Recommended)

### Step 1: Open Google Colab
1. Navigate to: **[https://colab.research.google.com/](https://colab.research.google.com/)**
2. In the popup window, click on the **Upload** tab.
3. Drag & drop or browse for [`train_crack_seg_colab.ipynb`](file:///d:/Downloads/road-inspector-IT22252340-Repair-Area-Segmentation/road-inspector-IT22252340-Repair-Area-Segmentation/train_crack_seg_colab.ipynb) from your computer.

### Step 2: Enable GPU Hardware Acceleration
1. In the Colab top menu, click **Runtime** → **Change runtime type**.
2. Under **Hardware accelerator**, select **T4 GPU**.
3. Click **Save**.

### Step 3: Run the Cells in Order
1. **Step 1 (Check GPU):** Verify NVIDIA GPU device is active (`!nvidia-smi`).
2. **Step 2 (Install Dependencies):** Installs `ultralytics`.
3. **Step 3 (Download & Extract Dataset):** Automatically downloads the complete 91.6 MB `crack-seg.zip` dataset at ~100 MB/s directly inside Colab.
4. **Step 4 (Config):** Creates `/content/crack-seg.yaml`.
5. **Step 5 (Train Model):** Runs YOLOv8-seg training for 50 epochs on GPU.
6. **Step 6 (Validate):** Calculates final `mAP50` and `mAP50-95` mask and bounding box metrics.
7. **Step 7 (Plots):** Displays training curves and sample segmentation prediction batches.
8. **Step 8 (Download Weights):** Automatically downloads `best.pt` to your computer.

---

## 💻 Method 2: Single-Cell Execution in a Blank Colab Notebook

If you prefer to start a blank Colab notebook, copy and paste this single block into the first cell and press **Shift + Enter**:

```python
# 1. Install Ultralytics
!pip install -q ultralytics

# 2. Download and extract crack-seg dataset
import os, urllib.request, zipfile
os.makedirs('/content/datasets', exist_ok=True)
url = 'https://github.com/ultralytics/assets/releases/download/v0.0.0/crack-seg.zip'
urllib.request.urlretrieve(url, '/content/datasets/crack-seg.zip')
with zipfile.ZipFile('/content/datasets/crack-seg.zip', 'r') as zip_ref:
    zip_ref.extractall('/content/datasets/crack-seg')

# 3. Create dataset YAML config
yaml_content = """
path: /content/datasets/crack-seg
train: images/train
val: images/val
test: images/test

names:
  0: crack
"""
with open('/content/crack-seg.yaml', 'w') as f:
    f.write(yaml_content.strip())

# 4. Train YOLOv8-seg on GPU
from ultralytics import YOLO
model = YOLO('yolov8n-seg.pt')

results = model.train(
    data='/content/crack-seg.yaml',
    epochs=50,
    imgsz=640,
    batch=16,
    device=0,
    project='/content/runs/crack_seg',
    name='train_exp',
    save=True
)

# 5. Download trained weights to your computer
from google.colab import files
files.download('/content/runs/crack_seg/train_exp/weights/best.pt')
```

---

## 🎯 How to Use the Trained `best.pt` in Your Road Inspector App

Once `best.pt` is downloaded from Google Colab:
1. Copy the file into your local project at:
   ```
   RepairAreaSegmentation/backend/models/best.pt
   ```
2. The Road Inspector backend will automatically load the newly trained model weights on its next inference scan!
