"""Profile handler"""

from urllib.parse import urlparse
from pathlib import Path
from platform import system
from configparser import ConfigParser
from typing import NamedTuple, Callable, Any
from io import StringIO
from sys import exit  # pylint: disable=redefined-builtin
import os

from webapps.validation import Validation

APP_BAT_TEMPLATE = """\
@echo off
echo Executing "{name}"
cd {dir}
.venv\\Scripts\\activate.bat
py {self} run "{name}"
"""

APP_SH_TEMPLATE = """\
printf "Executing '{name}'"
cd {dir}
source .venv/bin/activate
python {self} run '{name}'
"""

# DEFINE PROFILE DIRECTORY
# avoid conflicting with other 'webapps'
CONFIG_DIR = (
    Path("~/.config/rimueirnarn.webapps")
    if system() == "Linux"
    else Path("~/.rimueirnarn.webapps")
).expanduser()
# CONFIG_FILE = CONFIG_DIR / "config.conf"
PROFILE_DIR = CONFIG_DIR / "profiles"
# _PROFILE = ConfigParser(interpolation=None)
# _PROFILE.read(CONFIG_FILE)
SELF = Path(__file__).parent.parent / "main.py"

if not CONFIG_DIR.exists():
    CONFIG_DIR.mkdir()
    # CONFIG_FILE.touch()
    PROFILE_DIR.mkdir()

OptStr = str | None
OptInt = int | None
default = object()
_DELOBJS_CW = ["js_api", "server", "server_args", "localization"]
_DELOBJS_S = ["func", "server", "server_args", "menu"]
_STR_DEFKEY = "py:default"
_DELOBJS_API = ["html", "http_server", "http_port", "storage_path", "ssl", "args"]

def check(name):
    if '/' in name:
        return False
    if '\\' in name:
        return False
    return True

class CWConfig(NamedTuple):
    """Create Window Config"""

    title: str
    url: OptStr = None
    html: OptStr = None
    js_api: OptStr = None
    width: int = 800
    height: int = 600
    x: OptInt = None
    y: OptInt = None
    resizable: bool = True
    fullscreen: bool = False
    hidden: bool = False
    frameless: bool = False
    easy_drag: bool = True
    minimized: bool = False
    on_top: bool = False
    confirm_close: bool = False
    background_color: str = "#FFFFFF"
    transparent: bool = False
    text_select: bool = False
    zoomable: bool = False
    draggable: bool = False
    server: Any = default
    server_args: dict | Any = default
    localization: dict | None = None

    def validate(self):
        """Validate create-window configs"""
        vl = Validation()
        vl.set(isinstance(self.title, str), "app/title", "Title is not a string")
        r = urlparse(self.url)
        vl.set(
            all((r.scheme, r.netloc)) and self.html is None,
            "app/url",
            "URL is malformed",
        )
        # HTML is optional
        vl.set(isinstance(self.width, int), "app/width", "the width is not an integer")
        vl.set(
            isinstance(self.height, int),
            "app/height",
            "the height is not an integer",
        )
        vl.set(self.width > 0, "app/width", "width must not less than 0")
        vl.set(self.height > 0, "app/height", "height must not less than 0")
        # X, Y is optional
        vl.set(
            all(
                map(
                    lambda stuff: isinstance(stuff, bool),
                    (
                        self.resizable,
                        self.fullscreen,
                        self.hidden,
                        self.frameless,
                        self.easy_drag,
                        self.minimized,
                        self.on_top,
                        self.confirm_close,
                        self.transparent,
                        self.text_select,
                        self.zoomable,
                        self.draggable,
                    ),
                )
            ),
            "app/bools",
            "A value is detected to be non-boolean",
        )
        vl.set(
            self.background_color[0] == "#" and len(self.background_color) == 7,
            "app/background_color",
            "Color format is invalid",
        )
        return vl


class StartConfig(NamedTuple):
    """Start config"""

    func: Callable[[...], Any] | None = None  # type: ignore
    args: Any | tuple[Any, ...] | None = None
    localization: dict | None = None
    gui: OptStr = None
    debug: bool = False
    http_server: bool = False
    http_port: bool = False
    user_agent: str | None = None
    private_mode: bool = True
    storage_path: str | None = None
    menu: list | Any = default
    server: Any = default
    ssl: bool = False
    server_args: dict | Any = default

    def validate(self):
        """Validate start config"""
        vl = Validation()
        vl.set(
            all(
                map(
                    lambda stuff: isinstance(stuff, bool),
                    (self.debug, self.private_mode),
                )
            ),
            "start/any",
            "Either debug/private mode is not boolean",
        )
        return vl


class WebviewSetting(NamedTuple):
    """Webview Setting"""

    ALLOW_DOWNLOADS: bool = False
    ALLOW_FILE_URLS: bool = True
    ALLOW_EXTERNAL_LINKS_IN_BROWSER: bool = True
    OPEN_DEVTOOL_IN_DEBUG: bool = True

    def validate(self):
        """Webview config validator"""
        assert all(map(lambda stuff: isinstance(stuff, bool), self))


def replace_default(ns: dict[str, Any], with_: Any):
    """Replace constant default with others"""
    copied = ns.copy()
    for k in ns.copy():
        if copied[k] is default:
            copied[k] = with_
    return copied


def annihilate_defconst(ns: dict[str, Any], to_api: bool = False):
    """Delete any constant default"""
    copied = ns.copy()
    for k in ns.copy():
        if ns[k] is default or ns[k] == _STR_DEFKEY:
            del copied[k]
            continue
        if k in _DELOBJS_CW or k in _DELOBJS_S:
            del copied[k]
        if to_api and k in _DELOBJS_API:
            del copied[k]
    return copied


def _dstring(ns: dict[Any, Any]):
    for k, v in ns.items():
        print(f"[{type(k)}] {k!r} -> {v!r}")
        if not isinstance(k, str):
            exit(1)


def _dset(profile: ConfigParser, section: str, ns: dict[str, Any]):
    for k, v in ns.items():
        # print(f"[{section} {type(section)}] {k!r} -> {v!r}")
        if v in (None, False):
            profile.set(section, k, "no")
            continue
        if v is True:
            profile.set(section, k, "yes")
            continue
        profile.set(section, k, str(v))


def _dump(profile: ConfigParser, section: str):
    data = {}
    for k, v in profile[section].items():
        if v in ("no", "false", "0"):
            data[k] = False
            continue
        if v in ("yes", "true", "1"):
            data[k] = True
            continue
        if v.isnumeric():
            data[k] = int(v)
            continue
        if v == _STR_DEFKEY:
            continue
        data[k] = v
    return data


class Profile:
    """Profile for webapps. Options will follow pywebview.create_window"""

    # @staticmethod
    # def delete_cache(name: str):
    #     """Delete cache data from name"""
    #     del Profile._caches[name]

    def __init__(self, name: str, url: str, title: str = None):
        self._data = CWConfig(name or title, url=url)
        self._name = name
        self._start_data = StartConfig(private_mode=False, storage_path=str(self._dir))
        self.common_config = WebviewSetting()
        # self._dir.mkdir(exist_ok=True)
        self._profile = ConfigParser(interpolation=None)

    @property
    def _dir(self):
        return PROFILE_DIR / self._name

    @property
    def _config(self):
        return self._dir / "config.conf"

    @property
    def _custom_exec(self):
        return self._dir / f"{self._name}.{'bat' if os.name == 'nt' else 'sh'}"

    @property
    def data(self):
        """Return data used for webapps"""
        return self._data

    @property
    def start_data(self):
        """Return data used for starting webapps"""
        return self._start_data

    def save(self):
        """Save data to config file"""
        self._dir.mkdir(exist_ok=True)
        name = self._name
        app = self._custom_exec
        sio = StringIO()
        sio.write("# This file is generated by Webapp\n")
        parsed_data = self._data._asdict()
        parsed_sdata = self._start_data._asdict()
        parsed_wvdata = self.common_config._asdict()
        for i in _DELOBJS_CW:
            del parsed_data[i]

        for i in _DELOBJS_S:
            del parsed_sdata[i]

        rd_parsed = replace_default(parsed_data, _STR_DEFKEY)
        rd_sparsed = replace_default(parsed_sdata, _STR_DEFKEY)
        rd_wvparsed = replace_default(parsed_wvdata, _STR_DEFKEY)
        # print(rd_parsed, '\n', rd_sparsed)
        if not self._profile.has_section(name):
            self._profile.add_section(name)
            self._profile.add_section(f"{name}.start")
            self._profile.add_section(f"{name}.common")
        # _dstring(rd_parsed)
        # _dstring(rd_sparsed)
        # _PROFILE[name] = rd_parsed
        # _PROFILE[f"{name}.start"] = rd_sparsed
        _dset(self._profile, name, rd_parsed)
        _dset(self._profile, f"{name}.start", rd_sparsed)
        _dset(self._profile, f"{name}.common", rd_wvparsed)
        self._profile.write(sio)
        with open(self._config, "w", encoding="utf-8") as config:
            config.write(sio.getvalue())

        if os.name == "nt":
            with open(app, "w", encoding="UTF-8") as batfile:
                batfile.write(
                    APP_BAT_TEMPLATE.format(dir=SELF.parent, self=str(SELF), name=name)
                )
        else:
            with open(app, "w", encoding="UTF-8") as shellfile:
                shellfile.write(
                    APP_SH_TEMPLATE.format(dir=SELF.parent, self=str(self), name=name)
                )
        # CONFIG_FILE.write_text(sio.getvalue())
        print(f"App shell is created at: {app}")

    @classmethod
    def load(cls, name: str):
        """Load data from config file"""
        self = cls(name, None)
        if self._config.exists():
            profile = ConfigParser(interpolation=None)
            profile.read(self._config)
            self._data = CWConfig(**_dump(profile, name))
            self._start_data = StartConfig(**_dump(profile, f"{name}.start"))
            self.common_config = WebviewSetting(
                **{
                    key.upper(): value
                    for key, value in _dump(profile, f"{name}.common").items()
                }
            )
            self._profile = profile
        return self

    @staticmethod
    def load_return(name: str):
        """Load return"""
        self = Profile.load(name)
        return self.to_dict()

    def to_dict(self):
        """Return the instance into JSON-able"""
        return {
            "app": annihilate_defconst(self.data._asdict(), True),
            "start": annihilate_defconst(self.start_data._asdict(), True),
            "config": annihilate_defconst(self.common_config._asdict(), True),
        }

    def load_missing(self):
        """Load missing app name"""
        app = self._custom_exec
        name = self._name
        if app.exists():
            return
        if os.name == "nt":
            with open(app, "w", encoding="UTF-8") as batfile:
                batfile.write(
                    APP_BAT_TEMPLATE.format(dir=SELF.parent, self=str(SELF), name=name)
                )
        else:
            with open(app, "w", encoding="UTF-8") as shellfile:
                shellfile.write(
                    APP_SH_TEMPLATE.format(dir=SELF.parent, self=str(self), name=name)
                )
        print(f"Refreshed {self._name}")

    def validate(self):
        """Validate this profile"""
        vl = Validation()
        # vl.set(False, "name", "test :3")
        vl.set(
            check(self._name),
            "name",
            "Profile name contains illegal character",
        )
        vl.set(len(self._name) > 0, "name", "Profile name must not be empty")
        vl1 = self.data.validate()
        vl2 = self.start_data.validate()
        self.common_config.validate()
        a0 = vl.to_json()
        a0.extend(vl1.to_json())
        a0.extend(vl2.to_json())
        return a0
