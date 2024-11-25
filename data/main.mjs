// @ts-check
import { INIT_STATE, system, setLog } from "./init.mjs";
import { initialise, inherit } from "./elements.mjs"
import { Template } from "./vendor/enigmarimu.js/template.mjs";
import { config } from "./vendor/enigmarimu.js/config.mjs";
import { setup, goto } from "./vendor/enigmarimu.js/pages.mjs";
import { ValueError } from "./errors.mjs";
/** @typedef {import('./types.mjs').Profile} Profile */

const CONFIG_STATE = {
  profile_name: '',
};

const PROFILE_FORM = {
  name: '',
  path: '',
  app: {},
  start: {},
  config: {}
}

/** Function to gather data from the form into an object
 * @param {Document | HTMLElement} [base=document]
 * @param {Object?} [base]
 */
function collectFormData(base = document, forms = undefined) {
  const formData = forms !== undefined ? forms : structuredClone(PROFILE_FORM)

  base.querySelectorAll("[data-bind]").forEach((element) => {
    const bindPath = (element.getAttribute("data-bind") || '').split("/");
    let current = formData;

    // Traverse the object and create nested structure as needed
    for (let i = 0; i < bindPath.length; i++) {
      const key = bindPath[i];
      if (i === bindPath.length - 1) {
        // Determine the correct value type based on input type
        let value;
        // @ts-ignore
        switch (element.type) {
          case "checkbox":
            // @ts-ignore
            value = element.checked;
            break;
          case "number":
            // @ts-ignore
            value = element.value !== '' ? parseFloat(element.value) : null;
            break;
          case "date":
            // @ts-ignore
            value = element.value ? new Date(element.value).toISOString() : null;
            break;
          case "radio":
            // @ts-ignore
            if (element.checked) {
              // @ts-ignore
              value = element.value;
            }
            break;
          case "select-multiple":
            // @ts-ignore
            value = Array.from(element.selectedOptions).map(opt => opt.value);
            break;
          case "json": // Custom type for textarea/json fields
            try {
              // @ts-ignore
              value = JSON.parse(element.value);
            } catch {
              value = null;
            }
            break;
          default: // For text and other types
            // @ts-ignore
            value = element.value;
        }
        current[key] = value;
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

          /** @type {Profile} */
          // @ts-ignore
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
    await renderRenameModal(profile_name, {
      profile_name: profile_name,
      action: 'submit_rename',
      title: "Rename Profile",
      prompt: "What's the new profile name?"
    });
    // console.debug("Leaving leaving rename")
  },

  async shallow_copy(profile_name) {
    setLog("Attempt to shallow copy a profile")
    await renderRenameModal(profile_name, {
      profile_name: profile_name,
      action: 'submit_shcopy',
      title: "Shallow copy a Profile",
      prompt: "What's the new profile name?"
    });
  },

  async deep_copy(profile_name) {
    setLog("Attempt to deep copy a profile")
    await renderRenameModal(profile_name, {
      profile_name: profile_name,
      action: 'submit_dcopy',
      title: "Shallow copy a Profile",
      prompt: "What's the new profile name?"
    });
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
      // @ts-ignore
      $(document.querySelector("#modal-storage")).empty()
    }
    // console.debug("Leaving push_back")
  },

  /**
   * Delete
   * @param {string} name 
   */
  async delete(name) {
    console.debug('delete', name)
    await system.webview.delete_profile(name)
    await renderProfileList()
  },

  /**
   * Submit current rename form
   * @param {string} form_name 
   */
  async submit_rename(form_name) {
    /** @type {HTMLElement} */
    // @ts-ignore
    const form = document.querySelector(`#${form_name}`);
    // @ts-ignore
    const formdata = collectFormData(form, {})
    // console.debug(formdata, 'rename')
    await system.webview.rename(formdata.rename.old, formdata.rename.new)
    await renderProfileList()
    const form_base = form.getAttribute('data-parent')
    if (form_base)
      await this.push_back(form_base)
  },

  /**
   * Submit current shallow copy form
   * @param {string} form_name 
   */
  async submit_shcopy(form_name) {
    /** @type {HTMLElement} */
    // @ts-ignore
    const form = document.querySelector(`#${form_name}`);
    // @ts-ignore
    const formdata = collectFormData(form, {})
    await system.webview.shallow_copy(formdata.rename.old, formdata.rename.new)
    await renderProfileList()
    // console.debug(formdata, 'shcopy')
    const form_base = form.getAttribute('data-parent')
    if (form_base)
      await this.push_back(form_base)
  },

  /**
   * Submit current rename form
   * @param {string} form_name 
   */
  async submit_dcopy(form_name) {
    /** @type {HTMLElement} */
    // @ts-ignore
    const form = document.querySelector(`#${form_name}`);
    // @ts-ignore
    const formdata = collectFormData(form, {})
    // console.debug(formdata, 'dcopy')
    await system.webview.deep_copy(formdata.rename.old, formdata.rename.new)
    await renderProfileList()
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
 * @param {boolean} require
 */
function bindForm(data, base = document, require = false) {
  base.querySelectorAll("[data-bind]").forEach((element) => {
    const bindPath = (element.getAttribute("data-bind") || "").split("/");
    let value = data;

    if ((require) && (!element.hasAttribute('data-unrequire'))) {
      // console.log(element, 'bindform')
      // @ts-ignore
      element.setAttribute('required', true)
    }

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
      $("#lists").empty()
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

async function renderRenameModal(profile_name, template_data) {
  return await Template.with_url("rename", "template/rename.html", 50, true).then(
    async (template) => {
      /** @type {HTMLElement} */
      // @ts-ignore
      const target = document.querySelector("#modal-storage");
      template.append("#modal-storage", template_data)
      // @ts-ignore
      const rename_modal = new bootstrap.Modal(document.getElementById('rename-modal'), { backdrop: 'static' })
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

async function init_navbar() {
  /** @type {Element} */
  // @ts-ignore
  const base = document.querySelector('#nav')
  setLog("Downloading base navigation template")
  const nav = await Template.with_url("navbar", "template/navbar.html", 50);
  nav.render("#nav", {
    app_name: await system.app_name()
  })
  base.querySelectorAll("a[href]").forEach((element) => {
    element.addEventListener('click', (event) => {
      event.preventDefault()
      const url = element.getAttribute('href')
      if (!url)
        return;
      goto(url)
    })
  })
}

async function main() {
  INIT_STATE.mainjs_start = performance.now();
  config.target.app = "#app";

  console.debug("Downloading pages");
  await init_navbar()
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
        return { submit_text: "Update", submit_class: "btn-primary", state: false }
      },
      async post_init() {
        // @ts-ignore
        initialise(document.querySelector('#app'), {
          visibility: 'hidden',
          require: "required"
        }, {
          require: ['set', 'ignore'],
          visibility: ['set', 'ignore']
        })

        // console.log(inherit(document.querySelector('#app'), "inherit?system-name/data-visibility"))
        // @ts-ignore
        bindForm({}, document.querySelector("#app"), true)
        // @ts-ignore
        document
          .querySelector("form")
          .addEventListener("submit", async function (event) {
            event.preventDefault(); // Prevent the default form submission

            /** @type {Profile} */
            // @ts-ignore
            const profile_new = collectFormData(); // Gather form data into an object

            await system.webview.patch_profile(profile_new); // Call the save function
            await goto("/");
            return;
          });
      }
    },
    "/new_profile": {
      url: "page/config.html",
      // @ts-ignore
      async init() {
        return { submit_text: "Create New", submit_class: 'btn-primary', state: true }
      },
      async post_init() {
        console.log("Reaching /new_profile")
        bound_buttons(document.querySelector('#app') || document.body)
        // @ts-ignore
        initialise(document.querySelector("#app"), {
          visibility: "hidden",
          require: "required"
        }, {
          require: ['set', 'ignore'],
          visibility: ['set', 'ignore']
        })
        // @ts-ignore
        bindForm(await system.webview.provide_default(), document.querySelector("#app") || document.body)

        // @ts-ignore
        const this_form = document
          .querySelector("form");
        if (this_form == null)
          throw new Error("Form is undefined?")

        console.debug(this_form)
        this_form
          .addEventListener("submit", async function (event) {
            console.log("Submitting...")
            // if (!this_form.checkValidity()) {
            //   console.warn("Validity of the form is invalid. There's high chance that a value is skipped.")
            //   if (this_form.classList.contains('needs-validation')) {
            //     this_form.classList.remove("needs-validation")
            //     this_form.classList.add("was-validated")
            //   }
            //   event.preventDefault()
            //   event.stopPropagation()
            //   return;
            // }
            event.preventDefault(); // Prevent the default form submission
            /** @type {Profile} */
            // @ts-ignore
            const profile_new = collectFormData(); // Gather form data into an object
            document.querySelectorAll('[data-bind]').forEach(element => {
              element.classList.contains("is-valid") ? element.classList.remove('is-valid') : null;
              element.classList.contains("is-invalid") ? element.classList.remove('is-invalid') : null;
            })
            console.debug(profile_new)
            let validated = await system.webview.validate_profile(profile_new)

            if (validated.length == 0) {
              validated = await system.webview.new_profile(profile_new)
              if (validated.length == 0) {
                await goto("/");
                return
              }
            }

            console.error("Validity of the form is marked invalid by the backend.")
            const errornous = {}
            validated.forEach(element => {
              // // @ts-ignore
              // const elem = document.querySelector(`[data-bind="${element.of}"]`)
              // if (elem?.classList.contains("is-valid"))
              //   elem.classList.remove('is-valid')
              // elem?.classList.add('is-invalid')
              errornous[element.of] = element
            });
            console.debug(validated)
            document.querySelectorAll('[data-bind]').forEach(element => {
              /** @type {string} */
              // @ts-ignore
              const data = element.getAttribute("data-bind")
              if (data in errornous) {
                element.classList.add('is-invalid')
                /** @type {HTMLElement} */
                // @ts-ignore
                const fd = document.querySelector(`[data-feedback="${data}"]`)
                fd.innerText = errornous[data].message
              } else {
                element.classList.add('is-valid')
              }
            })
          });
      }
    }
  });

  await goto("/");
  INIT_STATE.mainjs_end = performance.now();
  // await system.webview.error()

  console.log(
    `Main module initiated at ${INIT_STATE.mainjs_end - INIT_STATE.mainjs_start
    }ms`
  );
}

await main();
