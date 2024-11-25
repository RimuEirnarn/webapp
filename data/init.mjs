// @ts-check
import { Template } from "./vendor/enigmarimu.js/template.mjs";
/** @typedef {import('./types.mjs').PyWebviewAPI} PyWebviewAPI */

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

/**
 * Set log
 * @param {string} text 
 */
function setLog(text) {
  const syslog = document.querySelector("#system-log");
  console.log(`[SYSLOG] ${text}`);
  if (syslog)
    // @ts-ignore
    syslog.innerText = text;
}

async function init_alert() {
  // @ts-ignore
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
    // @ts-ignore
    document.querySelector("html").setAttribute("data-bs-theme", theme);
}

try {
  // Attempt to initialize system and wait for pywebview to be available
  alert_tmpl = await init_alert();

  INIT_STATE.initjs_end = performance.now();

  setLog("Initiating pywebview API");
  INIT_STATE.pywebview_start = performance.now();
  system = await (async () => {
    return new Promise((resolve) => {
      setTimeout(resolve, 10);
    // @ts-ignore
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
