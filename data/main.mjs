import { INIT_STATE, system, setLog } from "./init.mjs";
import { Template } from "./vendor/enigmarimu.js/template.mjs";
import { config } from "./vendor/enigmarimu.js/config.mjs";
import { setup, goto, page_dm } from "./vendor/enigmarimu.js/pages.mjs";
import { ValueError } from "./errors.mjs";

const CONFIG_STATE = {
  profile_name: null,
};

const ACTIONS = {
  async exec(profile_name) {
    setLog(`Executing ${profile_name}`)
    await system.webview.execute(profile_name);
  },

  async private_exec(profile_name) {
    setLog(`Executing ${profile_name}`)
    await system.webview.pexec(profile_name)
  },

  async edit(profile_name) {
    CONFIG_STATE.profile_name = profile_name;
    console.log(`Attempt to access /config, profile name is ${profile_name}`);
    await goto("/config", () => {
      bound_buttons(document.querySelector('#app'))
    });
  },

  async back() {
    await goto("/");
  },
};

/**
 *
 * @param {HTMLElement} base
 */
function bound_buttons(base) {
  const buttons = base.querySelectorAll("button[data-action]");
  buttons.forEach((button) => {
    const [action, profileName] = button.getAttribute("data-action").split(":");

    if (ACTIONS[action]) {
      button.addEventListener(
        "click",
        async () => await ACTIONS[action](profileName)
      );
    } else {
      console.warn(`No action found for "${action}"`);
    }
  });
  setLog("Bound all tracable actions.")
}

async function renderProfileList() {
  return Template.with_url("listing", "template/listing.html", 50, true).then(
    (template) => {
      system.webview.profile_list().then((profiles) => {
        const target = document.querySelector("#lists");
        const profileData = profiles.map((profile) => ({
          name: profile.name,
          path: profile.path,
        }));
        template.batch_append("#lists", profileData);
        bound_buttons(target)

        console.log("All profiles rendered and buttons bound.");
      });
    }
  );
}

async function main() {
  INIT_STATE.mainjs_start = performance.now();
  config.target.app = "#app";

  console.debug("Downloading pages");
  setup({
    "/": {
      url: "page/index.html",
      async init() {
        console.debug("Begin downloading and rendering templates");
        await renderProfileList();
      },
    },
    "/config": {
      url: "page/config.html",
      async init() {
        if (!CONFIG_STATE.profile_name)
          throw new ValueError("Selected profile is undefined");
        const profile = await system.webview.fetch_profile(
          CONFIG_STATE.profile_name
        );
        console.log(`Accessing /profile, current profile is...`);
        console.log(profile);
        return profile;
      },
    },
  });

  await goto("/");
  INIT_STATE.mainjs_end = performance.now();

  console.log(
    `Main module initiated at ${
      INIT_STATE.mainjs_end - INIT_STATE.mainjs_start
    }ms`
  );
}

await main();
