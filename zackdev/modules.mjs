export { CookiesAPI, StackCookie, Helper }


/**
 * 
 * @returns a cookiesAPI object
 */
class CookiesAPI {
    constructor() {
        console.info('CookiesAPI constructor called');
        this.browser = '';
        try {
            this.setAPI('firefox', browser);
            console.info('firefox found');
            return this;
        }
        catch (error) {
            console.info('firefox not found', error);
        }
        try {
            this.setAPI('chromium', chrome);
            return this;
        }
        catch (error) {
            console.info('chromium not found', error);
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
            if (!r) {
                throw new Error('API: entrypoint not found');
            }
            if (!r.browserAction) {
                throw new Error('API: browserAction not found');
            }
            if (!r.cookies) {
                throw new Error('API: cookies not found');
            }
            if (!r.downloads) {
                throw new Error('API: downloads not found');
            }
            if (!r.runtime) {
                throw new Error('API: runtime not found');
            }
            if (!r.storage) {
                throw new Error('API: storage not found');
            }
            this.browserAction = r.browserAction;
            this.cookies = r.cookies;
            this.downloads = r.downloads;
            this.filter = {
                filterObj: {},
                applyFilter: (cookies) => {
                    console.log('modules.msj', 'filter.applyFilter()', cookies, this.filter.filterObj);
                    var cookiesToDelete = [];
                    switch (this.filter.filterObj.ss) {
                        case 'disabled': {
                            console.log('filter: disabled');
                            break;
                        }
                        case 'allowlist': {
                            console.log('filter: allowlist');
                            cookiesToDelete = cookies.filter((c) => {
                                return !this.filter.filterObj.fa.includes(c.domain);
                            });
                            break;
                        }
                        case 'denylist': {
                            console.log('filter: denylist');
                            cookiesToDelete = cookies.filter((c) => {
                                return this.filter.filterObj.fa.includes(c.domain);
                            });
                            break;
                        }
                    }
                    cookiesToDelete.forEach((c) => {
                        console.log('removing cookie', c);
                        this.remove(new StackCookie(c));
                    });
                },
                initStorage: () => {
                    console.info('initStorage()');
                    this.getValue(null)
                        .then((r) => {
                            if (!r.ss) {
                                this.storeValue({ 'ss': 'disabled' });
                            }
                            if (!r.fa) {
                                this.storeValue({ 'fa': [] });
                            }
                            if (!r.fd) {
                                this.storeValue({ 'fd': [] });
                            }
                        });
                },
                initFilter: () => {
                    console.info('initFilter()');
                    this.getValue(null)
                        .then((r) => {
                            this.filter.filterObj = r;
                        });
                },
                updateFilter: (storageObject) => {
                    console.log('updating filter', storageObject);
                    let keys = Object.keys(storageObject);
                    for (let key of keys) {
                        switch (key) {
                            case 'fa':
                                if (storageObject.fa.newValue) {
                                    this.filter.filterObj.fa = storageObject.fa.newValue;
                                }
                                break;
                            case 'fd':
                                if (storageObject.fd.newValue) {
                                    this.filter.filterObj.fd = storageObject.fd.newValue;
                                }
                                break;
                            case 'ss':
                                if (storageObject.ss.newValue) {
                                    this.filter.filterObj.ss = storageObject.ss.newValue;
                                }
                                break;
                        }
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
                this.filter.initFilter();
                this.getAll({}, this.filter.applyFilter);
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
                this.getAll = this.cookies.getAll;
                this.browserAction.setBadgeTextColor = () => { };
                this.storeValue = (v) => {
                    return new Promise((res) => {
                        this.storage.local.set(v, (r) => {
                            res(r);
                        });
                    });
                }
                this.getValue = (v) => {
                    return new Promise((res) => {
                        this.storage.local.get(v, (r) => {
                            res(r);
                        });
                    });
                }
                this.storage.onChanged.addListener(this.filter.updateFilter);
                this.filter.initStorage();
                this.filter.initFilter();
                this.getAll({}, this.filter.applyFilter);
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
  -- negative example 'github.com' as selector would select tags named 'github' with class 'com'
  
  - static check_or_x( b )
  -- returns HTML-glyph '&check;' or '&cross;', based on the parameter b
*/
class Helper {
    static unique_string(str) {
        let u_str = '';
        for (let c of str) {
            u_str += c.charCodeAt(0);
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