export { getCookiesAPI, StackCookie, Helper }

const getCookiesAPI = () => {
    try {
        setAPI('ff', browser);
    }
    catch (error) {
        console.log(error)
    }

    try {
        setAPI('chrome', chrome);
    }
    catch (error) {
        console.log(error)
    }
    return cookiesAPI;
}

const cookiesAPI = {
    browser: '',
}

const setAPI = (b, r) => {
    if (cookiesAPI.browser === '') {
        cookiesAPI.browser = b;
        cookiesAPI.browserAction = r.browserAction;
        cookiesAPI.cookies = r.cookies;
        cookiesAPI.runtime = r.runtime;
        cookiesAPI.storage = r.storage;
    }
    else {
        console.log('cookiesAPI properties already set.');
        return;
    }

    switch (b) {

        case 'ff':
            cookiesAPI.remove = (stack_cookie) => {
                let details = {
                    name: stack_cookie.cookie.name,
                    url: stack_cookie.url(),
                    storeId: stack_cookie.cookie.storeId,
                    firstPartyDomain: stack_cookie.cookie.firstPartyDomain,
                }
                cookiesAPI.cookies.remove(details);
            }
            cookiesAPI.getAll = (o, fn) => {
                cookiesAPI.cookies.getAll(o)
                    .then((c) => {
                        fn(c);
                    });
            }
            cookiesAPI.storeValue = (v) => {
                return cookiesAPI.storage.local.set(v);
            }
            cookiesAPI.getValue = (v) => {
                return cookiesAPI.storage.local.get(v);
            }
            break;

        case 'chrome':
            cookiesAPI.remove = (stack_cookie) => {
                let details = {
                    name: stack_cookie.cookie.name,
                    url: stack_cookie.url(),
                    storeId: stack_cookie.cookie.storeId,
                }
                cookiesAPI.cookies.remove(details);
            }
            cookiesAPI.getAll = r.cookies.getAll;
            cookiesAPI.browserAction.setBadgeTextColor = () => { };
            cookiesAPI.storeValue = (v) => {
                return new Promise((res, rej) => {
                    cookiesAPI.storage.local.set(v, (r) => {
                        res(r);
                    });
                });
            }
            cookiesAPI.getValue = (v) => {
                return new Promise((res, rej) => {
                    cookiesAPI.storage.local.get(v, (r) => {
                        res(r);
                    });
                });
            }
            break;
    }
}


/*
  Helper class
  - static unique_string( str )
  -- returns the concatenated ascii-number representation of the passed string
  -- solely for generating valid HTML-Element selectors from strings that contain special
  -- characters like '.' and '#'
  - negative example 'github.com' as selector would select tags named 'github' with class 'com'
*/
class Helper {
    static unique_string(str) {
        let u_str = '';
        for (let i = 0; i < str.length; i++) {
            u_str += str.charCodeAt(i);
        }
        return u_str;
    }
}


/*
  StackCookie class
  - wrapper class for cookies provided by the cookies.onChanged event
  - adds functionality that is used by StackCookieDisplay
*/
class StackCookie {
    constructor(cookie) {
        this.cookie = cookie;
    }

    unique_cookie_string() {
        let u_str = '';
        u_str += this.cookie.domain;
        u_str += this.cookie.path;
        u_str += this.cookie.name;
        return Helper.unique_string(u_str);
    }

    unique_domain_string() {
        let u_str = '';
        //this.cookie.secure ? u_str = "https://" : u_str = "http://";
        u_str += this.cookie.domain;
        return Helper.unique_string(u_str);
    }

    url() {
        let url_str = ''
        this.cookie.secure ? url_str = 'https://' : url_str = 'http://';
        url_str += this.cookie.domain;
        url_str += this.cookie.path;
        return url_str;
    }

    domain() {
        let domain_str = ''
        domain_str += this.cookie.domain;
        return domain_str;
    }
}