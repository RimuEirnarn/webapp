"""Webview API"""

from subprocess import Popen, DEVNULL, STDOUT
from atexit import register
from ..profiles import PROFILE_DIR, Profile, SELF

PROCESSES: list[Popen] = []

@register
def unloading():
    """Unloading"""
    for process in PROCESSES:
        process.wait(2)


class WebviewAPI:
    """Webview API"""

    def profile_list(self):
        """Profile list"""
        print("profile list")
        profiles = (
            {"name": path.name, "path": str(path), **Profile.load_return(path.name)}
            for path in (a for a in PROFILE_DIR.iterdir() if a.is_dir())
        )
        return tuple(profiles)

    def fetch_profile(self, name):
        """Fetch profile"""
        print("fetch profile")
        profile = {"name": name, "path": str(PROFILE_DIR / name)}
        profile_data = Profile.load_return(name)
        profile.update(profile_data)
        return profile

    def execute(self, name):
        """Execute a profile"""
        print("Executing", name)
        # pylint: disable=consider-using-with
        proc = Popen(
            ["python", SELF, "run", name],
            start_new_session=True,
            stdout=DEVNULL,
            stderr=STDOUT,
        )
        PROCESSES.append(proc)
        return True
