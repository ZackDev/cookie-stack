export { CookiesAPI, StackCookie, Helper }


/**
 * 
 * @returns a cookiesAPI object
 */
class CookiesAPI {
    constructor() {
        console.log('CookiesAPI', 'constructor()', CookiesAPI.instance);
        if (CookiesAPI.instance) {
            return CookiesAPI.instance;
        }
        else {
            this.browser = '';
            console.log('getCookiesAPI(): detecting browser');
            try {
                console.log('getCookiesAPI(): trying firefox');
                this.setAPI('firefox', browser);
                CookiesAPI.instance = this;
            }
            catch (error) {
                console.log('getCookiesAPI(): firefox not found');
            }

            try {
                console.log('getCookiesAPI(): trying chromium');
                this.setAPI('chromium', chrome);
                CookiesAPI.instance = this;
            }
            catch (error) {
                console.log('getCookiesAPI(): chromium not found');
            }
        }
    }

    /**
     * determines the used browser and builds the cookiesAPI facade to partially uniform the usage of chromium's and firefox's WebAPI
     * @param {String} b shorthand name of the browser 'firefox' or 'chromium' 
     * @param {Object} r the browser's top level access to the WebAPI 
     * @returns {cookiesAPI}
     */
    setAPI = (b, r) => {
        console.log('modules.mjs', 'setAPI()');
        if (this.browser === '') {
            this.browser = b;
            this.browserAction = r.browserAction;
            this.cookies = r.cookies;
            this.downloads = r.downloads;
            this.filter = {
                filterObj: {
                    ss: '',
                    fa: [],
                    fd: [],
                },
                applyFilter: (cookies) => {
                    console.log('modules.msj', 'filter.applyFilter()', cookies);
                    switch (this.filter.filterObj.ss) {
                        case 'disabled':
                            console.log('filter: disabled');
                            break;

                        case 'allowlist':
                            console.log('filter: allowlist');
                            var cookiesToDelete = cookies.filter((c) => {
                                return !this.filter.filterObj.fa.includes(c.domain);
                            });
                            cookiesToDelete.forEach((c) => {
                                console.log('removing cookie', c);
                                this.remove(new StackCookie(c));
                            });
                            break;

                        case 'denylist':
                            console.log('filter: denylist');
                            var cookiesToDelete = cookies.filter((c) => {
                                return this.filter.filterObj.fa.includes(c.domain);
                            });
                            cookiesToDelete.forEach((c) => {
                                console.log('removing cookie', c);
                                this.remove(new StackCookie(c));
                            });
                            break;
                    }
                },
                getFilterObject: () => {
                    return this.filter.filterObj;
                },
                initStorage: () => {
                    this.getValue('ss')
                        .then((r) => {
                            if (!r.ss) {
                                this.storeValue({ 'ss': 'disabled' });
                            }
                        });
                    this.getValue('fa')
                        .then((r) => {
                            if (!r.fa) {
                                this.storeValue({ 'fa': [] });
                            }
                        });
                    this.getValue('fd')
                        .then((r) => {
                            if (!r.fd) {
                                this.storeValue({ 'fd': [] })
                            }
                        });
                },
                updateFilter: (c, a) => {
                    let key = Object.keys(c)[0];
                    switch (key) {
                        case 'fa':
                            if (c.fa.newValue) {
                                this.filter.filterObj.fa = c.fa.newValue;
                            }
                            else {
                                this.filter.filterObj.fa = [];
                            }
                            break;
                        case 'fd':
                            if (c.fd.newValue) {
                                this.filter.filterObj.fd = c.fd.newValue;
                            }
                            else {
                                this.filter.filterObj.fd = [];
                            }
                            break;
                        case 'ss':
                            if (c.ss.newValue) {
                                this.filter.filterObj.ss = c.ss.newValue;
                            }
                            else {
                                this.filter.filterObj.ss = 'disabled';
                            }
                            break;
                    }
                    this.getAll({}, this.filter.applyFilter);
                }
            }
            this.runtime = r.runtime;
            this.storage = r.storage;
        }
        else {
            console.log('cookiesAPI properties already set.');
            return;
        }

        switch (b) {

            case 'firefox':
                this.remove = (stack_cookie) => {
                    let details = {
                        name: stack_cookie.cookie.name,
                        url: stack_cookie.url(),
                        storeId: stack_cookie.cookie.storeId,
                        firstPartyDomain: stack_cookie.cookie.firstPartyDomain,
                    }
                    this.cookies.remove(details);
                }
                this.getAll = (o, fn) => {
                    this.cookies.getAll(o)
                        .then((c) => {
                            fn(c);
                        });
                }
                this.storeValue = (v) => {
                    return this.storage.local.set(v);
                }
                this.getValue = (v) => {
                    return this.storage.local.get(v);
                }
                this.storage.onChanged.addListener(this.filter.updateFilter);
                this.filter.initStorage();
                this.filter.updateFilter();
                break;

            case 'chromium':
                this.remove = (stack_cookie) => {
                    let details = {
                        name: stack_cookie.cookie.name,
                        url: stack_cookie.url(),
                        storeId: stack_cookie.cookie.storeId,
                    }
                    this.cookies.remove(details);
                }
                this.getAll = r.cookies.getAll;
                this.browserAction.setBadgeTextColor = () => { };
                this.storeValue = (v) => {
                    return new Promise((res, rej) => {
                        this.storage.local.set(v, (r) => {
                            res(r);
                        });
                    });
                }
                this.getValue = (v) => {
                    return new Promise((res, rej) => {
                        this.storage.local.get(v, (r) => {
                            res(r);
                        });
                    });
                }
                this.storage.onChanged.addListener(this.filter.updateFilter);
                this.filter.initStorage();
                this.filter.updateFilter();
                break;
        }
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
    static check_or_x(b) {
        let str = b ? '&check;' : '&cross;';
        return str;
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