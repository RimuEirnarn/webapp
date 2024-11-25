"""Web UI"""
from .webview_api import WebviewAPI
from .os_api import OSAPI
from .config_api import ConfigAPI

class API:
    """API to pass"""

    def app_name(self):
        """App name"""
        return "Webapp Profile UI Manager"

    def short_name(self):
        """Shorter Version"""
        return "Webapp Manager"

    def version(self):
        """App version"""
        return 'v0.0.1'

    webview = WebviewAPI()
    os = OSAPI()
    config = ConfigAPI()

api = API()
