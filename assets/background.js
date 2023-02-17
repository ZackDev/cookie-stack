import { CookiesAPI } from '/assets/modules.mjs';


/**
 * runs in the background without user-interaction and is responsible for:
 * - instantiating a CookiesAPI object and add it to 'window'
 * - updating the extension's badge text (number of locally stored cookies)
 * - applying the domain filter (when the filter changes or new cookies are set)
 */

const cookiesAPI = new CookiesAPI();
window.cookiesAPI = cookiesAPI;

cookiesAPI.browserAction.setBadgeTextColor({ color: "#000000" });
cookiesAPI.browserAction.setBadgeBackgroundColor({ color: "#FFFFFF" });

const cookieEventListener = (event) => {
    cookiesAPI.cookies.getAll({}, (cookies) => {
        var numCookies = String(cookies.length);
        cookiesAPI.browserAction.setBadgeText({ "text": numCookies });
        cookiesAPI.filter.applyFilter(cookies);
    });
}

if (!cookiesAPI.cookies.onChanged.hasListener(cookieEventListener)) {
    cookiesAPI.cookies.onChanged.addListener(cookieEventListener);
    cookieEventListener({});
}
