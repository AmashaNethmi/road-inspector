# pyright: reportAttributeAccessIssue=none, reportGeneralTypeIssues=none, reportOptionalMemberAccess=none
# type: ignore
from typing import Any

import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

from .dinov2 import DINOv2


class Scratch(nn.Module):
    layer1_rn: Any
    layer2_rn: Any
    layer3_rn: Any
    layer4_rn: Any
    refinenet1: Any
    refinenet2: Any
    refinenet3: Any
    refinenet4: Any
    output_conv1: Any
    output_conv2: Any

    def __init__(self, in_shape, out_shape, groups=1, expand=False):
        super().__init__()
        out_shape1 = out_shape
        out_shape2 = out_shape
        out_shape3 = out_shape
        out_shape4 = out_shape
        if expand:
            out_shape1 = out_shape
            out_shape2 = out_shape * 2
            out_shape3 = out_shape * 4
            out_shape4 = out_shape * 8

        self.layer1_rn = nn.Conv2d(in_shape[0], out_shape1, kernel_size=3, stride=1, padding=1, bias=False, groups=groups)
        self.layer2_rn = nn.Conv2d(in_shape[1], out_shape2, kernel_size=3, stride=1, padding=1, bias=False, groups=groups)
        self.layer3_rn = nn.Conv2d(in_shape[2], out_shape3, kernel_size=3, stride=1, padding=1, bias=False, groups=groups)
        self.layer4_rn = nn.Conv2d(in_shape[3], out_shape4, kernel_size=3, stride=1, padding=1, bias=False, groups=groups)

def _make_scratch(in_shape, out_shape, groups=1, expand=False) -> Scratch:
    return Scratch(in_shape, out_shape, groups=groups, expand=expand)

class ResidualConvUnit(nn.Module):
    def __init__(self, features, activation=None):
        super().__init__()
        if activation is None:
            activation = nn.ReLU(True)
        self.conv1 = nn.Conv2d(features, features, kernel_size=3, stride=1, padding=1, bias=True)
        self.conv2 = nn.Conv2d(features, features, kernel_size=3, stride=1, padding=1, bias=True)
        self.act = activation

    def forward(self, x):
        out = self.act(x)
        out = self.conv1(out)
        out = self.act(out)
        out = self.conv2(out)
        return out + x

class FeatureFusionBlock(nn.Module):
    def __init__(self, features, activation=None, deconv=False, expand=False):
        super().__init__()
        if activation is None:
            activation = nn.ReLU(True)
        self.deconv = deconv
        out_features = features
        if expand:
            out_features = features // 2

        self.out_conv = nn.Conv2d(features, out_features, kernel_size=1, stride=1, padding=0, bias=True)
        self.resConfUnit1 = ResidualConvUnit(features, activation)
        self.resConfUnit2 = ResidualConvUnit(features, activation)

    def forward(self, *xs, size=None):
        output = xs[0]
        if len(xs) == 2:
            res = self.resConfUnit1(xs[1])
            output = output + res

        output = self.resConfUnit2(output)
        if size is not None:
            output = F.interpolate(output, size=size, mode="bilinear", align_corners=True)
        else:
            output = F.interpolate(output, scale_factor=2, mode="bilinear", align_corners=True)
        output = self.out_conv(output)
        return output

class DPTHead(nn.Module):
    projects: Any
    resize_layers: Any
    scratch: Any

    def __init__(self, in_channels=384, features=64, out_channels=None):
        super().__init__()
        if out_channels is None:
            out_channels = [48, 96, 192, 384]
        self.projects = nn.ModuleList([
            nn.Conv2d(in_channels=in_channels, out_channels=out_channel, kernel_size=1, stride=1, padding=0)
            for out_channel in out_channels
        ])

        self.resize_layers = nn.ModuleList([
            nn.ConvTranspose2d(out_channels[0], out_channels[0], kernel_size=4, stride=4, padding=0),
            nn.ConvTranspose2d(out_channels[1], out_channels[1], kernel_size=2, stride=2, padding=0),
            nn.Identity(),
            nn.Conv2d(out_channels[3], out_channels[3], kernel_size=3, stride=2, padding=1)
        ])

        self.scratch: Scratch = _make_scratch(out_channels, features, groups=1, expand=False)
        self.scratch.refinenet1 = FeatureFusionBlock(features)
        self.scratch.refinenet2 = FeatureFusionBlock(features)
        self.scratch.refinenet3 = FeatureFusionBlock(features)
        self.scratch.refinenet4 = FeatureFusionBlock(features)

        self.scratch.output_conv1 = nn.Conv2d(features, features // 2, kernel_size=3, stride=1, padding=1)
        self.scratch.output_conv2 = nn.Sequential(
            nn.Conv2d(features // 2, 32, kernel_size=3, stride=1, padding=1),
            nn.ReLU(True),
            nn.Conv2d(32, 1, kernel_size=1, stride=1, padding=0),
            nn.ReLU(True),
        )

    def forward(self, out_features, patch_h, patch_w):
        out = []
        for i, x in enumerate(out_features):
            x = x[:, 1:].permute(0, 2, 1).reshape((x.shape[0], x.shape[-1], patch_h, patch_w))
            x = self.projects[i](x)
            x = self.resize_layers[i](x)
            out.append(x)

        layer_1, layer_2, layer_3, layer_4 = out
        scratch: Any = self.scratch
        layer_1_rn = scratch.layer1_rn(layer_1)
        layer_2_rn = scratch.layer2_rn(layer_2)
        layer_3_rn = scratch.layer3_rn(layer_3)
        layer_4_rn = scratch.layer4_rn(layer_4)

        path_4 = scratch.refinenet4(layer_4_rn, size=layer_3_rn.shape[2:])
        path_3 = scratch.refinenet3(path_4, layer_3_rn, size=layer_2_rn.shape[2:])
        path_2 = scratch.refinenet2(path_3, layer_2_rn, size=layer_1_rn.shape[2:])
        path_1 = scratch.refinenet1(path_2, layer_1_rn)

        out = scratch.output_conv1(path_1)
        out = F.interpolate(out, (int(patch_h * 14), int(patch_w * 14)), mode="bilinear", align_corners=True)
        out = scratch.output_conv2(out)
        return out

class DepthAnythingV2(nn.Module):
    pretrained: Any
    depth_head: Any
    encoder: str

    def __init__(self, encoder='vits', features=64, out_channels=None):
        super().__init__()
        if out_channels is None:
            out_channels = [48, 96, 192, 384]
        self.encoder = encoder
        self.pretrained = DINOv2(patch_size=14, in_chans=3, embed_dim=384, depth=12, num_heads=6)
        self.depth_head = DPTHead(in_channels=384, features=features, out_channels=out_channels)

    def forward(self, x):
        patch_h, patch_w = x.shape[-2] // 14, x.shape[-1] // 14
        features = self.pretrained(x)
        depth = self.depth_head(features, patch_h, patch_w)
        return depth.squeeze(1)

    @torch.no_grad()
    def infer_image(self, raw_image, input_size=518, device='cpu'):
        """
        Infer depth from raw BGR/RGB image.
        Returns:
            depth : 2D numpy float32 array (H, W) normalized to relative depth
        """
        if isinstance(raw_image, np.ndarray):
            h, w = raw_image.shape[:2]
            # Convert to RGB if BGR
            if len(raw_image.shape) == 3 and raw_image.shape[2] == 3:
                image = cv2.cvtColor(raw_image, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
            else:
                image = raw_image.astype(np.float32) / 255.0
        else:
            raise TypeError("raw_image must be a numpy ndarray")

        # Resize keeping aspect ratio divisible by 14
        scale = input_size / max(h, w)
        new_h = int(round(h * scale / 14.0) * 14)
        new_w = int(round(w * scale / 14.0) * 14)
        resized: np.ndarray = cv2.resize(image.astype(np.float32), (new_w, new_h), interpolation=cv2.INTER_CUBIC)

        # Normalize with ImageNet mean/std
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        resized = (resized - mean) / std

        tensor = torch.from_numpy(resized).permute(2, 0, 1).unsqueeze(0).float().to(device)

        pred = self.forward(tensor)
        pred = F.interpolate(pred.unsqueeze(1), size=(h, w), mode='bilinear', align_corners=True).squeeze().cpu().numpy()
        return pred.astype(np.float32)
