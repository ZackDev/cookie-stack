import { CookiesAPI } from '/assets/modules.mjs';


/**
 * runs in the background without user-interaction and is responsible for:
 * - updating the extension's badge text (number of locally stored cookies)
 * - applying the domain filter (when the filter changes or new cookies are set)
 */


const cookiesAPI = new CookiesAPI();


window.cookiesAPI = cookiesAPI;

cookiesAPI.browserAction.setBadgeTextColor({ color: "#000000" });


cookiesAPI.browserAction.setBadgeBackgroundColor({ color: "#FFFFFF" });


/*
  Listener for cookie change events
  - fetches all cookies from the browser's store
  - updates the extension's badge text
  - applies cookies filter
*/
const cookieEventListener = (event) => {
    console.log('background.js', 'cookie_event_listener()', event);
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
