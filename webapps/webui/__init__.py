"""Web UI"""
from .webview_api import WebviewAPI
from .os_api import OSAPI
from .config_api import ConfigAPI

class API:
    """API to pass"""

    webview = WebviewAPI()
    os = OSAPI()
    config = ConfigAPI()

api = API()
