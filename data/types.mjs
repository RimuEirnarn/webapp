/**
 * @typedef PyWebviewAPI API
 * @type {object}
 * 
 * @prop {function(): Promise<string>} app_name Application Name
 * @prop {function(): Promise<string>} short_name Application Short Name
 * @prop {OSAPI} os OS API
 * @prop {WebviewAPI} webview Webview API
 * @prop {ConfigAPI} config Config Store
 */


/**
 * @typedef ValidationEntry Validation Entry
 * @type {object}
 * 
 * @prop {boolean} condition The condition that was passed in
 * @prop {string} of The target data-bind
 * @prop {string} message Reason of the validation entry
 */

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
 */

/**
 * Webview Start Config
 * @typedef StartConfig
 * @type {object}
 * @prop {string?} gui Webview Backend GUI
 * @prop {boolean} debug Debug
 * @prop {string} user_agent User Agent
 * @prop {boolean} private_mode Private Mode
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
 * @prop {function(string): Promise<null>} pexec Private execute a profile
 * @prop {function(Profile): Promise<ValidationEntry[]>} patch_profile Save profile configuration
 * @prop {function(string, string): Promise<null>} rename Rename a profile
 * @prop {function(string, string): Promise<string>} shallow_copy Shallow copy a profile
 * @prop {function(string, string): Promise<string>} deep_copy Deep copy a profile (this copies application data as well)
 * @prop {function(string): Promise<null>} delete_profile Delete a profile
 * @prop {function(Profile): Promise<ValidationEntry[]>} new_profile Save a new profile configuration
 * @prop {function(Profile): Promise<ValidationEntry[]>} validate_profile Validate a profile state
 * @prop {function(): Promise<Profile>} provide_default Returns a default Profile
 * @prop {function(): Promise<never>} error just raise an exception
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