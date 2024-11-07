import { getCookie, setCookie } from "./vendor/enigmarimu.js/utils.mjs";

/**
 * @typedef CookieStore
 * @type {Object}
 * @prop {function(string, any): null} set Set data
 * @prop {function(string): any} get Get data
 * @prop {function(string): null} delete delete data
 * @prop {function(): null} save save data 
 * @prop {function(): null} load load data
 */

/**
 * Cookie returns
 * @param {string} store 
 * @returns {CookieStore}
 */
function _Cookies(store) {

    let data = getCookie(store) || {}
    return {
        set(name, value) {
            data[name] = value
            this.save()
        },

        get(name) {
            return data[name]
        },

        delete(name) {
            delete data[name]
        },

        save() {
            setCookie(store, JSON.stringify(data))
        },

        load() {
            data = JSON.parse(getCookie(store) || '{}')
        }
    }
}

const base_config = _Cookies('webapp.transient')

export { base_config }