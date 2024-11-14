// @ts-check
import { INIT_STATE, system, setLog } from "./init.mjs";
import { Template } from "./vendor/enigmarimu.js/template.mjs";
import { config } from "./vendor/enigmarimu.js/config.mjs";
import { setup, goto } from "./vendor/enigmarimu.js/pages.mjs";
import { ValueError } from "./errors.mjs";
/** @typedef {import('./types.mjs').Profile} Profile */

const CONFIG_STATE = {
  profile_name: '',
};

/** Function to gather data from the form into an object
 * @param {Document | HTMLElement} [base=document] 
 * @returns {Profile}
 */
function collectFormData(base = document) {
  const formData = {
    name: '',
    path: '',
    app: {},
    start: {},
    config: {}
  };

  base.querySelectorAll("[data-bind]").forEach((element) => {
    const bindPath = (element.getAttribute("data-bind") || '').split("/");
    let current = formData;

    // Traverse the object and create nested structure as needed
    for (let i = 0; i < bindPath.length; i++) {
      const key = bindPath[i];
      if (i === bindPath.length - 1) {
        // Set the value at the final key
        current[key] =
          // @ts-ignore
          element.type === "checkbox" ? element.checked : element.value;
      } else {
        // Create nested objects if they don't exist
        current[key] = current[key] || {};
        current = current[key];
      }
    }
  });

  // @ts-ignore
  return formData;
}

const ACTIONS = {
  /**
   * Execute a profile
   * @param {string} profile_name 
   */
  async exec(profile_name) {
    setLog(`Executing ${profile_name}`);
    await system.webview.execute(profile_name);
  },

  /**
   * Private execute a profile
   * @param {string} profile_name 
   */
  async private_exec(profile_name) {
    setLog(`Executing ${profile_name}`);
    await system.webview.pexec(profile_name);
  },

  /**
   * @param {string} profile_name
   */
  async edit(profile_name) {
    if (profile_name === null)
      throw new ValueError("Profile name must be defined")
  
    CONFIG_STATE.profile_name = profile_name;
    setLog(`Attempt to access /config, profile name is ${profile_name}`);
    await goto("/config", async () => {
      bound_buttons(document.querySelector("#app") || document.body);
      const profile = await system.webview.fetch_profile(profile_name);
      // console.debug(profile);
      // @ts-ignore
      bindForm(profile);
      // Handle form submission
      // @ts-ignore
      document
        .querySelector("form")
        .addEventListener("submit", async function (event) {
          event.preventDefault(); // Prevent the default form submission

          const profile_new = collectFormData(); // Gather form data into an object

          profile_new.name = profile_name;
          await system.webview.patch_profile(profile_new); // Call the save function
          await goto("/");
          return;
        });
    });
  },

  async rename(profile_name) {
    setLog("Attempt to rename a profile");
    await renderRenameModal(profile_name);
    // console.debug("Leaving leaving rename")
  },

  /**
   * Push back
   * @param {string} modal_name 
   */
  async push_back(modal_name) {
    console.debug(`Pushing away: ${modal_name}`)
    const modal = document.getElementById(modal_name);

    if (modal) {
      // @ts-ignore
      const bs_modal = new bootstrap.Modal(modal, {
        backdrop: 'static'
      })
      // console.debug('hiding')
      await bs_modal.dispose()
    }
    // console.debug("Leaving push_back")
  },

  /**
   * Delete
   * @param {string} name 
   */
  async delete(name) {
    console.debug('delete', name)
  },

  /**
   * Submit current form
   * @param {string} form_name 
   */
  async submit(form_name) {
    /** @type {HTMLElement} */
    // @ts-ignore
    const form = document.querySelector(`#${form_name}`);
    const formdata = collectFormData(form)
    // console.debug(formdata)
    const form_base = form.getAttribute('data-parent')
    if (form_base)
      await this.push_back(form_base)
  },

  async back() {
    await goto("/");
  },
};

/**
 * Bind forms to form element
 * @param {Object.<string, string>} data 
 * @param {Document | HTMLElement} base 
 */
function bindForm(data, base = document) {
  base.querySelectorAll("[data-bind]").forEach((element) => {
    const bindPath = (element.getAttribute("data-bind") || "").split("/");
    let value = data;

    // Traverse the object based on the bindPath array
    for (const key of bindPath) {
      if (value[key] === undefined) return; // Exit if path does not exist
      // @ts-ignore
      value = value[key];
    }

    // Set value or checked state based on element type
    // @ts-ignore
    if (element.type === "checkbox") {
      // @ts-ignore
      element.checked = Boolean(value);
    // @ts-ignore
    } else if (element.type === "number") {
      // @ts-ignore
      element.value = Number(value);
    } else {
      // @ts-ignore
      element.value = value;
    }
  });
}

/**
 *
 * @param {HTMLElement | Document | Element} base
 */
function bound_buttons(base = document) {
  if (base === null) {
    throw new ValueError("Base element must be defined. You probably forgot that the value used is not found.")
  }
  const buttons = base.querySelectorAll("[data-action]");
  buttons.forEach((button) => {
    const [action, profileName] = (button.getAttribute("data-action") || '').split(":");
    const action_prevention = JSON.parse(button.getAttribute('data-action-prevent') || 'true')
    // console.debug(`Action default prevention? ${action_prevention}`)

    if (ACTIONS[action]) {
      button.addEventListener("click", async (event) => {
        if (action_prevention)
          event.preventDefault();
        await ACTIONS[action](profileName);
      });
    } else {
      console.warn(`No action found for "${action}"`);
    }
  });
  setLog("Bound all tracable actions.");
}

async function renderProfileList() {
  return await Template.with_url("listing", "template/listing.html", 50, true).then(
    (template) => {
      system.webview.profile_list().then((profiles) => {
        /** @type {HTMLElement} */
        // @ts-ignore
        const target = document.querySelector("#lists");
        const profileData = profiles.map((profile) => ({
          name: profile.name,
          path: profile.path,
        }));
        template.batch_append("#lists", profileData);
        bound_buttons(target);
        // const dropdownElementList = document.querySelectorAll('.dropdown-toggle')
        // const _ = [...dropdownElementList].map(dropdownToggleEl => new bootstrap.Dropdown(dropdownToggleEl))

        console.log("All profiles rendered and buttons bound.");
      });
    }
  );
}

async function renderRenameModal(profile_name) {
  return await Template.with_url("rename", "template/rename.html", 50, true).then(
    async (template) => {
      /** @type {HTMLElement} */
      // @ts-ignore
      const target = document.querySelector("#modal-storage");
      template.append("#modal-storage", {
        profile_name: profile_name,
      })
      // @ts-ignore
      const rename_modal = new bootstrap.Modal(document.getElementById('rename-modal'), {backdrop: 'static'})
      rename_modal.show()
      bound_buttons(target);
      bindForm({
        // @ts-ignore
        rename: {
          old: profile_name,
        },
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
      // @ts-ignore
      async init() {
        console.debug("Begin downloading and rendering templates");
        await renderProfileList();
      },
    },
    "/config": {
      url: "page/config.html",
      // @ts-ignore
      async init() {
        if (!CONFIG_STATE.profile_name)
          throw new ValueError("Selected profile is undefined");
        // const profile = await system.webview.fetch_profile(
        //   CONFIG_STATE.profile_name
        // );
        // console.log(`Accessing /profile, current profile is...`);
        // console.log(profile);
        // return profile;
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
