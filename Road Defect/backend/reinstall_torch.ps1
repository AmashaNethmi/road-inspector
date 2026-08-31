$ErrorActionPreference = 'Stop'
$sp = "C:\Users\laksh\Desktop\abc\RepairAreaSegmentation\backend\.venv\Lib\site-packages"
$tmp = "C:\Users\laksh\Desktop\abc\RepairAreaSegmentation\backend\tmp"

if (!(Test-Path $tmp)) { New-Item -ItemType Directory -Path $tmp }

Write-Host "Removing bad torch installation..."
Remove-Item -Path "$sp\torch" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$sp\torchgen" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$sp\torchvision" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$sp\torch-*.dist-info" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$sp\torchvision-*.dist-info" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Downloading torch 2.3.1 wheel..."
curl.exe -L "https://download.pytorch.org/whl/cpu/torch-2.3.1%2Bcpu-cp311-cp311-win_amd64.whl" -o "$tmp\torch.whl"

Write-Host "Downloading torchvision 0.18.1 wheel..."
curl.exe -L "https://download.pytorch.org/whl/cpu/torchvision-0.18.1%2Bcpu-cp311-cp311-win_amd64.whl" -o "$tmp\torchvision.whl"

Write-Host "Extracting torch wheel using tar..."
Set-Location -Path $sp
tar.exe -xf "$tmp\torch.whl"

Write-Host "Extracting torchvision wheel using tar..."
tar.exe -xf "$tmp\torchvision.whl"

Write-Host "Cleaning up temp files..."
Remove-Item -Path $tmp -Recurse -Force

Write-Host "Done reinstalling PyTorch."
