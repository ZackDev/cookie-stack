export { getCookiesAPI, StackCookie, Helper }

/**
 * 
 */
const filter = {
    filterObj: {
        ss: '',
        fa: [],
        fd: [],
    },
    applyFilter: (cookies) => {
        console.log('modules.msj', 'filter.applyFilter()', cookies);
        switch (filter.filterObj.ss) {
            case 'disabled':
                console.log('filter: disabled');
                break;

            case 'allowlist':
                console.log('filter: allowlist');
                var cookiesToDelete = cookies.filter((c) => {
                    return !filter.filterObj.fa.includes(c.domain);
                });
                cookiesToDelete.forEach((c) => {
                    console.log('removing cookie', c);
                    cookiesAPI.remove(new StackCookie(c));
                });
                break;

            case 'denylist':
                console.log('filter: denylist');
                var cookiesToDelete = cookies.filter((c) => {
                    return filter.filterObj.fa.includes(c.domain);
                });
                cookiesToDelete.forEach((c) => {
                    console.log('removing cookie', c);
                    cookiesAPI.remove(new StackCookie(c));
                });
                break;
        }
    },
    getFilterObject: () => {
        return filter.filterObj;
    },
    setupFilter: () => {
        cookiesAPI.getValue('ss')
            .then((r) => {
                if (r.ss) {
                    filter.filterObj.ss = r.ss;
                }
                else {
                    filter.filterObj.ss = 'disabled';
                }
            })

        cookiesAPI.getValue('fa')
            .then((r) => {
                if (r.fa) {
                    filter.filterObj.fa = r.fa;
                }
            });

        cookiesAPI.getValue('fd')
            .then((r) => {
                if (r.fd) {
                    filter.filterObj.fd = r.fd;
                }
            });
    },
    updateFilter: (c, a) => {
        let key = Object.keys(c)[0];
        switch (key) {
            case 'fa':
                if (c.fa.newValue) {
                    filter.filterObj.fa = c.fa.newValue;
                }
                else {
                    filter.filterObj.fa = [];
                }
                break;
            case 'fd':
                if (c.fd.newValue) {
                    filter.filterObj.fd = c.fd.newValue;
                }
                else {
                    filter.filterObj.fd = [];
                }
                break;
            case 'ss':
                if (c.ss.newValue) {
                    filter.filterObj.ss = c.ss.newValue;
                }
                else {
                    filter.filterObj.ss = 'disabled';
                }
                break;
        }
        cookiesAPI.getAll({}, filter.applyFilter);
    }
}

/**
 * 
 * @returns a cookiesAPI object
 */
const getCookiesAPI = () => {
    console.log('getCookiesAPI(): detecting browser');
    try {
        console.log('getCookiesAPI(): trying firefox');
        setAPI('firefox', browser);
        console.log('getCookiesAPI(): firefox found');
    }
    catch (error) {
        console.log('getCookiesAPI(): firefox not found');
    }

    try {
        console.log('getCookiesAPI(): trying chromium');
        setAPI('chromium', chrome);
        console.log('getCookiesAPI(): chromium found');
    }
    catch (error) {
        console.log('getCookiesAPI(): chromium not found');
    }
    return cookiesAPI;
}

/**
 * facade bundling select browser functionality
 */
const cookiesAPI = {
    browser: '',
}

/**
 * determines the used browser and builds the cookiesAPI facade to partially uniform the usage of chromium's and firefox's WebAPI
 * @param {String} b shorthand name of the browser 'firefox' or 'chromium' 
 * @param {Object} r the browser's top level access to the WebAPI 
 * @returns {cookiesAPI}
 */
const setAPI = (b, r) => {
    if (cookiesAPI.browser === '') {
        cookiesAPI.browser = b;
        cookiesAPI.browserAction = r.browserAction;
        cookiesAPI.cookies = r.cookies;
        cookiesAPI.downloads = r.downloads;
        cookiesAPI.filter = filter;
        cookiesAPI.runtime = r.runtime;
        cookiesAPI.storage = r.storage;
    }
    else {
        console.log('cookiesAPI properties already set.');
        return;
    }

    switch (b) {

        case 'firefox':
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
            cookiesAPI.filter.setupFilter();
            cookiesAPI.storage.onChanged.addListener(cookiesAPI.filter.updateFilter);
            break;

        case 'chromium':
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
            cookiesAPI.filter.setupFilter();
            cookiesAPI.storage.onChanged.addListener(cookiesAPI.filter.updateFilter);
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
  - adds functionality that is used by the extension
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