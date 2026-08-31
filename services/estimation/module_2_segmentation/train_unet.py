import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
import cv2
import numpy as np

# Combined Focal + Dice Loss to handle severe class imbalance
class FocalDiceLoss(nn.Module):
    def __init__(self, alpha=0.25, gamma=2.0, smooth=1e-5):
        super(FocalDiceLoss, self).__init__()
        self.alpha = alpha
        self.gamma = gamma
        self.smooth = smooth

    def forward(self, inputs, targets):
        # Flatten label and prediction tensors
        inputs = inputs.view(-1)
        targets = targets.view(-1)
        
        # Binary Cross Entropy
        BCE = nn.functional.binary_cross_entropy_with_logits(inputs, targets, reduction='none')
        BCE_EXP = torch.exp(-BCE)
        
        # Focal Loss
        focal_loss = self.alpha * (1 - BCE_EXP)**self.gamma * BCE
        focal_loss = focal_loss.mean()
        
        # Dice Loss
        inputs_sigmoid = torch.sigmoid(inputs)
        intersection = (inputs_sigmoid * targets).sum()
        dice_score = (2. * intersection + self.smooth) / (inputs_sigmoid.sum() + targets.sum() + self.smooth)
        dice_loss = 1 - dice_score
        
        # Combine
        return focal_loss + dice_loss

class RoadDefectDataset(Dataset):
    def __init__(self, images_dir, masks_dir, transform=None):
        self.images_dir = images_dir
        self.masks_dir = masks_dir
        self.transform = transform
        self.image_filenames = sorted(os.listdir(images_dir))

    def __len__(self):
        return len(self.image_filenames)

    def __getitem__(self, idx):
        img_name = self.image_filenames[idx]
        img_path = os.path.join(self.images_dir, img_name)
        
        # The mask must have the same name based on our constraints
        # Try both .png and .jpg for the mask
        mask_path = os.path.join(self.masks_dir, img_name)
        if not os.path.exists(mask_path):
            mask_path = os.path.join(self.masks_dir, img_name.replace('.jpg', '.png').replace('.jpeg', '.png'))

        image = cv2.imread(img_path)
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)
        
        # Resize to standard input size for U-Net
        image = cv2.resize(image, (256, 256))
        mask = cv2.resize(mask, (256, 256))
        
        # Normalize
        image = image.astype(np.float32) / 255.0
        mask = (mask > 127).astype(np.float32) # Binary mask 0 or 1
        
        # HWC to CHW format for PyTorch
        image = np.transpose(image, (2, 0, 1))
        
        image_tensor = torch.tensor(image, dtype=torch.float32)
        mask_tensor = torch.tensor(mask, dtype=torch.float32).unsqueeze(0) # Add channel dim
        
        return image_tensor, mask_tensor

# Dummy U-Net implementation for skeleton
class UNetSkeleton(nn.Module):
    def __init__(self):
        super(UNetSkeleton, self).__init__()
        # In a real scenario, implement full Encoder-Decoder blocks here
        self.conv = nn.Conv2d(3, 1, kernel_size=1)

    def forward(self, x):
        return self.conv(x)

def train_model():
    print("Starting Module 2 U-Net Training Sequence...")
    
    # Path configuration restricted to datasets/segmentation_masks/
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'datasets', 'segmentation_masks'))
    train_images_dir = os.path.join(base_dir, 'train_images')
    train_masks_dir = os.path.join(base_dir, 'train_masks')
    
    models_dir = os.path.join(os.path.dirname(__file__), 'models')
    os.makedirs(models_dir, exist_ok=True)
    
    if not os.path.exists(train_images_dir) or len(os.listdir(train_images_dir)) == 0:
        print(f"Warning: Training directory is empty or missing: {train_images_dir}")
        print("Please populate the dataset folders before running training.")
        return
        
    # Dataset and Dataloader
    dataset = RoadDefectDataset(train_images_dir, train_masks_dir)
    dataloader = DataLoader(dataset, batch_size=4, shuffle=True)
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = UNetSkeleton().to(device) # Replace with full U-Net
    
    # Initialize our custom Focal + Dice loss
    criterion = FocalDiceLoss()
    optimizer = optim.Adam(model.parameters(), lr=1e-4)
    
    epochs = 1
    for epoch in range(epochs):
        model.train()
        epoch_loss = 0
        for images, masks in dataloader:
            images = images.to(device)
            masks = masks.to(device)
            
            optimizer.zero_grad()
            outputs = model(images)
            
            loss = criterion(outputs, masks)
            loss.backward()
            optimizer.step()
            
            epoch_loss += loss.item()
            
        print(f"Epoch {epoch+1}/{epochs}, Loss: {epoch_loss/len(dataloader):.4f}")
        
    # Save isolated model
    save_path = os.path.join(models_dir, 'unet_weights.pt')
    torch.save(model.state_dict(), save_path)
    print(f"Training complete. Weights saved to {save_path}")

if __name__ == "__main__":
    train_model()
