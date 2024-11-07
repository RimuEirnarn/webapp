"""Webui Dependency Manager"""
import os
from zipfile import ZipFile
from tqdm import tqdm
import requests

def download_file(url, destination):
    """Download a file with a progress bar using requests and tqdm."""
    response = requests.head(url, timeout=10)
    total_size = int(response.headers.get("content-length", 0))

    with requests.get(url, stream=True, timeout=10) as r, open(destination, "wb") as f:
        r.raise_for_status()
        with tqdm(
            total=total_size, unit="B", unit_scale=True, desc=destination, ncols=100
        ) as pbar:
            for chunk in r.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    pbar.update(len(chunk))


def install_webui_dependency(force=False):
    """Install Web UI dependencies."""
    if os.path.exists("data/vendor/jquery.js") and not force:
        return

    urls = {
        "bootstrap_icons": "https://github.com/twbs/icons/releases/download/v1.11.3/bootstrap-icons-1.11.3.zip",
        "bootstrap": "https://github.com/twbs/bootstrap/releases/download/v5.3.3/bootstrap-5.3.3-dist.zip",
        "jquery": "https://code.jquery.com/jquery-3.6.4.min.js",
        "enigmarimu": "https://rimueirnarn.github.io/package-snapshot/enigmarimu.js.zip",
    }

    os.makedirs("data/vendor", exist_ok=True)

    for name, url in urls.items():
        print(f"Downloading {name} from {url}...")
        destination = (
            f"data/vendor/{name}.js"
            if url.endswith(".js")
            else f"data/vendor/{name}.zip"
        )

        # Use download_file function with progress bar
        download_file(url, destination)

        if url.endswith(".zip"):
            # Unzip the file if it is a zip
            with ZipFile(destination) as zip_file:
                zip_file.extractall("data/vendor/")
                print(f"{name} extracted to data/vendor")
            os.remove(destination)  # Clean up the zip file after extraction
        else:
            print(f"{name} saved to {destination}")

    print("All dependencies installed in data/vendor/")
