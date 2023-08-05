import webview
from webapps.profiles import Profile, CONFIG_FILE, annihilate_defconst
from argh import ArghParser, arg

#@arg("link", help="Link or name")
#def main(link: str):
#    webview.create_window(link, link)
#    webview.start()

def create_profile(name: str, url: str, title: str | None = None):
    """Create profile"""
    profile = Profile(name, url, title)
    profile.save()
    print("Profile created")

def run(name: str):
    """Execute from profile"""
    profile = Profile.load(name)
    data = annihilate_defconst(profile.data._asdict())
    start = annihilate_defconst(profile.start_data._asdict())
    if profile.data.url in (None, ''):
        print(f"Please change URL entry for {name} at {str(CONFIG_FILE)}")
        return
    webview.create_window(**data)
    webview.start(**start)

def dump(name):
    """Dump profile data"""
    profile = Profile.load(name)
    data = annihilate_defconst(profile.data._asdict())
    start = annihilate_defconst(profile.start_data._asdict())
    print(data)
    print(start)

if __name__ == '__main__':
    parser = ArghParser()
    parser.add_commands([create_profile, run, dump])
    parser.dispatch()
