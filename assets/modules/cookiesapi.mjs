import { keyNamePairs } from "./static.mjs";
import { StackCookie } from "./stackcookie.mjs";
export { CookiesAPI }

/*
  CookiesAPI class
  - bundles the browser's functions used by the extension in a single object
  - how it is used:
  -- background.js creates an instance by calling the constructor and attaches it to 'window'
  -- popup.js and options.js call the static getAPI() to retrieve the previously attached object
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
     * @returns CookiesAPI instance
     */
    constructor() {
        this.browserName = '';
        try {
            if (typeof browser !== 'undefined') {
                this.setupAPI('firefox', browser)
            }
            if (typeof chrome !== 'undefined') {
                this.setupAPI('chrome', chrome)
            }
            if (this.browserName !== '') {
                this.initAPI();
            }
            else {
                throw new Error('browser not supported');
            }
            console.log('browser deteced:', this.browserName)
            return this;
        }
        catch(error) {
            console.log(error);
        }
    }

    /**
     * determines the used browser and builds the cookiesAPI facade to partially uniform the usage of chrome's and firefox's WebAPI
     * @param {String} b shorthand name of the browser 'firefox' or 'chrom' 
     * @param {Object} r the browser's top level access to the WebAPI 
     */
    setupAPI = (b, r) => {
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
                this.download = (c) => {
                    return this.downloads.download(c);
                }
                break;

            case 'chrome':
                this.remove = (stack_cookie) => {
                    let details = {
                        name: stack_cookie.cookie.name,
                        url: stack_cookie.url(),
                        storeId: stack_cookie.cookie.storeId,
                    }
                    this.cookies.remove(details);
                }
                this.getAll = this.cookies.getAll;
                this.browserAction.setBadgeTextColor = () => {};
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
                this.download = (c) => {
                    return new Promise((res) => {
                        this.downloads.download(c, (r) => {
                            res(r);
                        })
                    });
                }
                break;
        }
        this.browserName = b;
    }

    /**
     * 
     */
    initAPI() {
        this.storage.onChanged.addListener(this.filter.updateFilter);
        this.filter.initStorage();
        this.filter.initFilter();
        this.getAll({}, this.filter.applyFilter);
    }
}