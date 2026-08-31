# pyright: reportAttributeAccessIssue=none, reportGeneralTypeIssues=none, reportOptionalMemberAccess=none
# type: ignore
import os
import urllib.request
import sys

def download_weights():
    models_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models')
    os.makedirs(models_dir, exist_ok=True)
    target_path = os.path.join(models_dir, 'depth_anything_v2_vits.pth')
    
    url = "https://huggingface.co/depth-anything/Depth-Anything-V2-Small/resolve/main/depth_anything_v2_vits.pth"
    
    if os.path.exists(target_path) and os.path.getsize(target_path) > 10_000_000:
        print(f"Depth Anything V2 Small weights already exist ({os.path.getsize(target_path)} bytes).")
        return target_path

    print(f"Downloading Depth Anything V2 Small weights from {url}...")
    def report_hook(count, block_size, total_size):
        percent = int(count * block_size * 100 / total_size) if total_size > 0 else 0
        sys.stdout.write(f"\rDownloading: {percent}% ({count * block_size // (1024*1024)}MB / {total_size // (1024*1024)}MB)")
        sys.stdout.flush()

    urllib.request.urlretrieve(url, target_path, reporthook=report_hook)
    print("\nDownload complete! File saved to:", target_path)
    return target_path

if __name__ == '__main__':
    download_weights()
