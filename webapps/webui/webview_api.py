"""Webview API"""

import logging
from subprocess import Popen, DEVNULL, STDOUT
from atexit import register
from ..profiles import PROFILE_DIR, CWConfig, Profile, SELF, StartConfig, WebviewSetting

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
        logging.debug("profile list")
        profiles = (
            {"name": path.name, "path": str(path), **Profile.load_return(path.name)}
            for path in (a for a in PROFILE_DIR.iterdir() if a.is_dir())
        )
        return tuple(profiles)

    def fetch_profile(self, name):
        """Fetch profile"""
        logging.debug("fetch profile")
        profile = {"name": name, "path": str(PROFILE_DIR / name)}
        profile_data = Profile.load_return(name)
        profile.update(profile_data)
        return profile

    def execute(self, name):
        """Execute a profile"""
        logging.debug("Executing %s", name)
        # pylint: disable=consider-using-with
        proc = Popen(
            ["python", SELF, "run", name],
            start_new_session=True,
            stdout=DEVNULL,
            stderr=STDOUT,
        )
        PROCESSES.append(proc)
        return True

    def pexec(self, name):
        """Execute a profile"""
        logging.debug("Executing %s", name)
        # pylint: disable=consider-using-with
        proc = Popen(
            ["python", SELF, "run", name, "--private"],
            start_new_session=True,
            stdout=DEVNULL,
            stderr=STDOUT,
        )
        PROCESSES.append(proc)
        return True

    def patch_profile(self, profile_data):
        """Patch a profile"""
        # pylint: disable=protected-access
        profile = Profile(profile_data['name'], None)
        profile._data = CWConfig(**profile_data['app'])
        profile._start_data = StartConfig(**profile_data['start'])
        profile.common_config = WebviewSetting(**profile_data['config'])
        profile.save()
        return True
