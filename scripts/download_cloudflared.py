import urllib.request
import os
import sys

TARGET_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "cloudflared.exe")
DOWNLOAD_URL = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"

def download_cloudflared():
    if os.path.exists(TARGET_PATH):
        print(f"cloudflared.exe already exists at: {TARGET_PATH}")
        return

    print(f"Downloading cloudflared-windows-amd64.exe to {TARGET_PATH}...")
    try:
        def progress(count, block_size, total_size):
            percent = int(count * block_size * 100 / total_size)
            sys.stdout.write(f"\rDownloading: {percent}% ({count * block_size // (1024*1024)}MB / {total_size // (1024*1024)}MB)")
            sys.stdout.flush()

        urllib.request.urlretrieve(DOWNLOAD_URL, TARGET_PATH, reporthook=progress)
        print("\nDownload complete! cloudflared.exe is ready.")
    except Exception as e:
        print(f"\nDownload error: {e}")

if __name__ == "__main__":
    download_cloudflared()
