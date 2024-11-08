import { Template } from "./vendor/enigmarimu.js/template.mjs";

/**
 * Profile
 * @typedef Profile
 * @type {object}
 *
 * @property {string} name Profile name
 * @property {string} path Profile path
 * @property {WindowConfig} app Profile window config
 * @property {StartConfig} start Profile initial/start config
 * @property {WebviewConfig} config Profile webview config
 */

/**
 * Window Config
 * @typedef WindowConfig
 * @type {object}
 *
 * @property {string} title App title
 * @property {string?} url Application URL
 * @property {string?} html Application HTML code
 * @property {null} js_api Application JS API, always null
 * @property {number} width Application window width
 * @property {number} height Application window heigth
 * @property {number} x Application window x-pos
 * @property {number} y Application window y-pos
 * @property {boolean} resizable Is the app resizeable?
 * @property {boolean} fullscreen Will the app be fullscreen?
 * @property {boolean} hidden Will the app be hidden by default?
 * @property {boolean} frameless Will the app has frames?
 * @property {boolean} easy_drag Will the app allows easy dragging?
 * @property {boolean} minimized Will the app started minimized?
 * @property {boolean} on_top Will the app be on top?
 * @property {boolean} confirm_close Alert user when closing?
 * @property {string} background_color Application default BG color
 * @property {boolean} transparent Is the app allows transparency?
 * @property {boolean} text_select Will the user able to select?
 * @property {boolean} zoomable Is the app zoomable?
 * @property {boolean} draggable Is the app draggable?
 * @property {null} server App server
 * @property {null} server_args Server arguments
 * @property {object} localization App localization
 */

/**
 * Webview Start Config
 * @typedef StartConfig
 * @type {object}
 * @prop {null} func Function
 * @prop {null} args Function arguments
 * @prop {object} localization App localization
 * @prop {string?} gui Webview Backend GUI
 * @prop {boolean} debug Debug
 * @prop {boolean} http_server HTTP Server
 * @prop {boolean} http_port HTTP Port
 * @prop {string} user_agent User Agent
 * @prop {boolean} private_mode Private Mode
 * @prop {string} storage_pat Storage Path
 * @prop {null} menu Menu
 * @prop {null} server Server
 * @prop {boolean} ssl SSL
 * @prop {null} server_args Server ARGS
 */

/**
 * Webview Setting
 * @typedef WebviewConfig
 * @type {object}
 *
 * @prop {boolean} ALLOW_DOWNLOADS Will the app able to download?
 * @prop {boolean} ALLOW_FILE_URLS Will the app able to access file://?
 * @prop {boolean} ALLOW_EXTERNAL_LINKS_IN_BROWSER Will the app open browser tap when clicking _target=blank?
 * @prop {bool} OPEN_DEVTOOL_IN_DEBUG Will the app open DEVTOOL in debug mode?
 */

/**
 * @typedef OSAPI
 * @type {object}
 *
 * @prop {function(string): string} readfile Read a file
 * @prop {function(string, string): number} writefile Write to a file
 */

/**
 * @typedef WebviewAPI
 * @type {object}
 *
 * @prop {function(): Promise<Profile[]>} profile_list Returns an array of Profile
 * @prop {function(string): Promise<Profile>} fetch_profile Returns a specific Profile
 * @prop {function(string): Promise<null>} execute Execute a profile
 */

/**
 * @typedef ConfigAPI
 * @type {object}
 *
 * @prop {function(string): Promise<any>} get Fetch a data from config store
 * @prop {function(string, any): Promise<null>} set Set a data to config store
 * @prop {function(string): Promise<Number>} delete Delete a data from config store
 * @prop {function(string, any): Promise<null>} set_if_not_exists Set a data to config store IF not exists
 */

/**
 * @typedef PyWebviewAPI API
 * @type {object}
 *
 * @prop {OSAPI} os OS API
 * @prop {WebviewAPI} webview Webview API
 * @prop {ConfigAPI} config Config Store
 */

/** @type {PyWebviewAPI} */
let system;
/** @type {Template} */
let alert_tmpl;

const DEFAULT_THEME = "dark";

console.log("Initiating the system");
const INIT_STATE = {
  initjs_start: performance.now(),
  mainjs_start: 0,
  initjs_end: 0,
  mainjs_end: 0,
};

function setLog(text) {
  const syslog = document.querySelector("#system-log");
  console.log(`[SYSLOG] ${text}`);
  if (syslog)
    syslog.innerText = text;
}

async function init() {
  document.querySelector("html").setAttribute("data-bs-theme", DEFAULT_THEME);
  setLog("Downloading alert template");
  return Template.with_url("alert", "template/alert.html", 50);
}

async function pywebview_config_store_seeder() {
  setLog("Seeding probably unitialized config store");
  await system.config.set_if_not_exists("theme", DEFAULT_THEME);
}

async function post_pywebview_init() {
  setLog("Configuring theme");
  /** @type {string} */
  const theme = await system.config.get("theme");
  if (theme !== DEFAULT_THEME)
    document.querySelector("html").setAttribute("data-bs-theme", theme);
}

try {
  // Attempt to initialize system and wait for pywebview to be available
  alert_tmpl = await init();

  INIT_STATE.initjs_end = performance.now();

  setLog("Initiating pywebview API");
  INIT_STATE.pywebview_start = performance.now();
  system = await (async () => {
    return new Promise((resolve) => {
      setTimeout(resolve, 1000);
    }).then(() => window.pywebview.api);
  })();

  if (!system) {
    throw new Error("PyWebview is not available.");
  }

  await pywebview_config_store_seeder();
  await post_pywebview_init();

  INIT_STATE.pywebview_end = performance.now();

  console.log(
    `Base system initialized at ${
      INIT_STATE.initjs_end - INIT_STATE.initjs_start
    }ms`
  );
  console.log(
    `PyWebview API initialized at ${
      INIT_STATE.pywebview_end - INIT_STATE.pywebview_start
    }ms`
  );
  setLog("Base initialization is completed");
} catch (error) {
  console.error("Error initializing pywebview:", error);
}

export { system, INIT_STATE, setLog };
