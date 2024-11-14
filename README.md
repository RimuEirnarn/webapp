# Webapp

This simply a wrapper for Pywebview, so you can create 'desktop app' from a URL.

## Installation

Base installation

```sh
git clone https://github.com/RimuEirnarn/webapp
cd webapp
python -m venv .venv
# If using bash, uncomment this next line:
#source .venv/bin/activate
# If using powershell (Windows):
#.venv/Scripts/Activate.ps1

python -m pip install -r ./requirements.txt
python main.py webui
```

## Issues

If your issues is likely with external component and is required by Web UI (most likely enigmarimu.js), I forgot to provide updates to that thing. So good luck trying to run it.
