from argh import ArghParser, arg
import webview
from webapps.profiles import Profile, annihilate_defconst, PROFILE_DIR
from webapps.webui import api
from webapps.webui.dependency import install_webui_dependency
from webapps.webui.logs import setup_logging

setup_logging()

#@arg("link", help="Link or name")
#def main(link: str):
#    webview.create_window(link, link)
#    webview.start()

@arg("name", help="Profile name")
@arg("url", help="Profile URL")
@arg("--title", '-t', help="Profile Title")
def create_profile(name: str, url: str, title: str | None = None):
    """Create profile"""
    profile = Profile(name, url, title)
    profile.save()
    print("Profile created")

@arg("name", help="Name of the profile")
@arg('-p', '--private', help="Open the profile in private? This omit private configuration")
def run(name: str, private: bool = False):
    """Execute from profile"""
    profile = Profile.load(name)
    data = annihilate_defconst(profile.data._asdict())
    start = annihilate_defconst(profile.start_data._asdict())
    settings = annihilate_defconst(profile.common_config._asdict())
    if private:
        data['title'] += " (Private Mode)"
        start['private_mode'] = True
    if profile.data.url in (None, ''):
        print(f"Please change URL entry for {name} at {PROFILE_DIR / name / 'config.conf'}")
        return
    webview.settings = settings
    webview.create_window(**data)
    webview.start(**start)

@arg("name", help="Name of the profile")
def dump(name):
    """Dump profile data"""
    profile = Profile.load(name)
    data = annihilate_defconst(profile.data._asdict())
    start = annihilate_defconst(profile.start_data._asdict())
    settings = annihilate_defconst(profile.common_config._asdict())
    print(settings)
    print(data)
    print(start)

@arg("name", help="Name of the profile")
def load_missing(name):
    """Load missing configuration"""
    profile = Profile.load(name)
    profile.load_missing()

def webui():
    """Web UI"""
    install_webui_dependency()
    webview.create_window("Webapp Profile UI Manager", 'data/main.html', js_api=api)
    webview.start(debug=True)

def webui_reinstall():
    """Web UI reinstall"""
    install_webui_dependency(True)

if __name__ == '__main__':
    parser = ArghParser()
    parser.add_commands([create_profile, run, dump, load_missing, webui, webui_reinstall])
    parser.dispatch()
