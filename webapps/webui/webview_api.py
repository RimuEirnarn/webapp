"""Webview API"""

import logging
from pathlib import Path
from shutil import copytree, rmtree
from subprocess import Popen, DEVNULL, STDOUT
from atexit import register

from .error import SecurityError
from ..profiles import PROFILE_DIR, CWConfig, Profile, SELF, StartConfig, WebviewSetting

PROCESSES: list[Popen] = []

def check_path(target: str):
    """Check path"""
    if '..' in target or '/' in target:
        raise SecurityError("Target path can escalate")
    
def check_paths(paths):
    """Check all paths"""
    for i in paths:
        check_path(i)

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

    def rename(self, name: str, to: str):
        """Rename a profile"""
        # pylint: disable=protected-access
        check_path(name)
        data = Profile.load(name)
        profile_dir: Path = PROFILE_DIR / name
        profile_dir.rename(to)
        data._name = to
        data.save()

    def shallow_copy(self, name: str, to: str, ignore_exists: bool = False):
        """Shallow copy a profile"""
        # pylint: disable=protected-access
        check_paths((name, to))
        profile = Profile.load(name)
        new_profile = Profile(to, None, None)
        if (PROFILE_DIR / to).exists() and ignore_exists is False:
            return "Destination/new profile must not be an active profile"
        new_profile._data = profile.data
        new_profile._start_data = profile.start_data
        new_profile.common_config = profile.common_config
        new_profile.save()
        return 'ok'

    def deep_copy(self, name: str, to: str):
        """Deep copy a profile"""
        check_paths((name, to))
        profile: Path = PROFILE_DIR / name
        new_profile: Path = PROFILE_DIR / to
        if new_profile.exists():
            return "Destination/new profile must not be an active profile"
        copytree(profile, new_profile)
        self.shallow_copy(name, to, True)
        return 'ok'

    def delete_profile(self, name: str):
        """Delete a profile"""
        check_path(name)
        profile: Path = PROFILE_DIR / name
        rmtree(profile)
