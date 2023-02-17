import { keyNamePairs } from "./static.mjs";
import { StackCookie } from "./stackcookie.mjs";
export { CookiesAPI }

/**
 * 
 * @returns a cookiesAPI object
 */
class CookiesAPI {
    static getAPI = () => {
        return new Promise((resolve, reject) => {
            if (typeof browser !== 'undefined') {
                browser.runtime.getBackgroundPage()
                    .then((page) => {
                        resolve(page.cookiesAPI);
                    });
            }
            if (typeof chrome !== 'undefined') {
                chrome.runtime.getBackgroundPage((page) => {
                    if (typeof page.cookiesAPI !== 'undefined') {
                        resolve(page.cookiesAPI);
                    }
                    else {
                        reject('cookiesAPI not found')
                    }
                })
            }
            else {
                reject('cookiesAPI not found');
            }
        });
    }

    /**
     * detects browser and sets up functions used by the extension
     * NOTE: only to be called directly by the background script for initialization
     * 
     * background.js    ->      new CookiesAPI()
     * other.js         ->      CookiesAPI.getAPI()
     * 
     * @returns CookiesAPI instance
     */
    constructor() {
        this.browser = '';
        try {
            this.setAPI('firefox', browser);
            return this;
        }
        catch (error) {}
        try {
            this.setAPI('chromium', chrome);
            return this;
        }
        catch (error) {}
    }

    /**
     * determines the used browser and builds the cookiesAPI facade to partially uniform the usage of chromium's and firefox's WebAPI
     * @param {String} b shorthand name of the browser 'firefox' or 'chromium' 
     * @param {Object} r the browser's top level access to the WebAPI 
     * @returns {cookiesAPI}
     */
    setAPI = (b, r) => {
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
                    var cookiesToDelete = [];
                    switch (this.filter.filterObj.ss) {
                        case 'allowlist': {
                            cookiesToDelete = cookies.filter((c) => {
                                return !this.filter.filterObj.fa.includes(c.domain);
                            });
                            break;
                        }
                        case 'denylist': {
                            cookiesToDelete = cookies.filter((c) => {
                                return this.filter.filterObj.fd.includes(c.domain);
                            });
                            break;
                        }
                    }
                    cookiesToDelete.forEach((c) => {
                        this.remove(new StackCookie(c));
                    });
                },
                initStorage: () => {
                    this.getValue(null)
                        .then((storageObject) => {
                            if (!storageObject.ss) {
                                storageObject.ss = 'disabled';
                            }
                            if (!storageObject.fa) {
                                storageObject.fa = [];
                            }
                            if (!storageObject.fd) {
                                storageObject.fd = [];
                            }
                            this.storeValue(storageObject);
                        });
                },
                initFilter: () => {
                    this.getValue(null)
                        .then((storageObject) => {
                            this.filter.filterObj = storageObject;
                        });
                },
                updateFilter: (storageObject) => {
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
            this.keyNamePairs = keyNamePairs;
            this.runtime = r.runtime;
            this.storage = r.storage;
        }
        else {
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