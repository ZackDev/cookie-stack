export { AttributeValuePair, Filter, FilterSet, getCookiesAPI, StackCookie, Helper }

/**
 * 
 * @returns a cookiesAPI object
 */
const getCookiesAPI = () => {
    try {
        setAPI('firefox', browser);
    }
    catch (error) {
        console.log(error)
    }

    try {
        setAPI('chromium', chrome);
    }
    catch (error) {
        console.log(error)
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

class FilterSet {
    constructor() {
        this.type = '';
        this.filters = [];
    }

    addFilter(filter) {
        this.filters.push(filter);
    }

    toString(){
        let res = '';
        res += ['default_action', this.type].join(' ') + ';\n';
        for(let filter of this.filters) {
            res += filter.toString();
        }
        return res;
    }

    static fromString(str){
        let filterSet = new FilterSet();
        str = str.replace('\n', '');
        let lines = str.split(';');
        let defaultAction = lines.shift();
        let defaultActionArray = defaultAction.split(' ');
        if (defaultActionArray.length === 2) {
            if (defaultActionArray[0] === 'default_action') {
                if (['allow', 'deny'].includes(defaultActionArray[1])) {
                    filterSet.type = defaultActionArray[1];
                }
                else {
                    throw new Error('expected value for default_action is <allow|deny>');
                }
            }
            else {
                throw new Error('filter definition must start with "default_action"');
            }
        }
        else {
            throw new Error('expected value: "default_action <allow|deny>;"');
        }
        for (let line of lines) {
            try {
                let elements = line.split(' ');
                if (elements.length % 2 === 0) {
                    let filter = new Filter();
                    for (let i = 0; i+=2; i < elements.length) {
                        try {
                            let attribute = elements[i];
                            let value = elements[i+1];
                            if (attribute !== undefined && value !== undefined) {
                                let avpair = new AttributeValuePair(attribute, value);
                                filter.addAttributeValuePair(avpair);
                            }
                        }
                        catch(e) {
                            console.log(e);
                            throw new Error(e);
                        }
                    }
                    filterSet.addFilter(filter);
                }
            }
            catch(e) {
                console.log(e);
                throw new Error(e);
            }
        }
        return filterSet;
    }
}

class Filter {
    constructor(){
        this.attributeValuePairs = [];
    }
    addAttributeValuePair(avpair) {
        this.attributeValuePairs.push(avpair);
    }
    toString() {
        let ret = '';
        if (this.attributeValuePairs.length > 0) {
            let index = 0;
            for( let avpair of this.attributeValuePairs) {
                if (index > 0 && index <= this.attributeValuePairs.length -1) {
                    ret += ' ';
                }
                ret += [avpair.getAttribute(), avpair.getValue()].join(' ');
                index += 1;
            }
            ret += ';\n';
        }
        return ret;
    }
}

class AttributeValuePair {
    static attributeTypeMap = new Map();
    static {
        this.attributeTypeMap.set("domain", "string");
        this.attributeTypeMap.set("name", "string");
        this.attributeTypeMap.set("path", "string");
        this.attributeTypeMap.set("same_site", "string");
        this.attributeTypeMap.set("expiration_date", "string");
        this.attributeTypeMap.set("first_party_domain", "string");
        this.attributeTypeMap.set("store_id", "string");
        this.attributeTypeMap.set("value", "string");
        this.attributeTypeMap.set("secure", "boolean");
        this.attributeTypeMap.set("http_only", "boolean");
        this.attributeTypeMap.set("session", "boolean");
    }
    constructor(attribute, value) {
        this.attribute = '';
        this.value = '';
        if (AttributeValuePair.attributeTypeMap.has(attribute)) {
            let expectedType = AttributeValuePair.attributeTypeMap.get(attribute);
            if (expectedType === "boolean" && (value === 'true' || value === 'false')) {
                if (value === 'true') {
                    value = true;
                }
                else if (value === 'false') {
                    value = false;
                }
            }
            if (typeof value === AttributeValuePair.attributeTypeMap.get(attribute)) {
                this.attribute = attribute;
                this.value = value;
            }
            else {
                throw new TypeError(`value: ${value} expected type: ${AttributeValuePair.attributeTypeMap.get(attribute)}`);
            }
        }
        else {
            throw new Error(`attribute: ${attribute} not found.`);
        }
    }
    getAttribute() {
        return this.attribute;
    }
    getValue() {
        return this.value;
    }
}