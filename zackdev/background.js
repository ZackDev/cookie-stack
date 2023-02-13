import { CookiesAPI } from '/zackdev/modules.mjs';


/**
 * runs in the background without user-interaction and is responsible for:
 * - updating the extension's badge text (number of locally stored cookies)
 * - applying the domain filter (when the filter changes or new cookies are set)
 */


const cookiesAPI = new CookiesAPI();


cookiesAPI.browserAction.setBadgeTextColor({ color: "#000000" });


cookiesAPI.browserAction.setBadgeBackgroundColor({ color: "#FFFFFF" });


/*
  Listener for cookie change events
  - fetches all cookies from the browser's store
  - updates the extension's badge text
  - applies cookies filter
*/
const cookie_event_listener = (event) => {
    console.log('background.js', 'cookie_event_listener()', event);
    cookiesAPI.cookies.getAll({}, (cookies) => {
        var num_cookies = String(cookies.length);
        cookiesAPI.browserAction.setBadgeText({ "text": num_cookies });
        cookiesAPI.filter.applyFilter(cookies);
    });
}


if (!cookiesAPI.cookies.onChanged.hasListener(cookie_event_listener)) {
    cookiesAPI.cookies.onChanged.addListener(cookie_event_listener);
    cookie_event_listener({});
}
