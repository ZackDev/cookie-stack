import { Helper } from "./helper.mjs";
export { StackCookie }

/*
  StackCookie class
  - wrapper class for cookies provided by the cookies.onChanged event
  - adds functionality that is used by the extension
*/
class StackCookie {
    constructor(cookie) {
        this.cookie = cookie;
    }

    uniqueCookieString() {
        let uStr = '';
        uStr += this.cookie.domain;
        uStr += this.cookie.path;
        uStr += this.cookie.name;
        return Helper.uniqueString(uStr);
    }

    uniqueDomainString() {
        let uStr = '';
        //this.cookie.secure ? u_str = "https://" : u_str = "http://";
        uStr += this.cookie.domain;
        return Helper.uniqueString(uStr);
    }

    url() {
        let urlStr = ''
        urlStr += this.protocol();
        urlStr += this.domain();
        urlStr += this.cookie.path;
        return urlStr;
    }

    protocol() {
        let pStr = this.cookie.secure ? 'https://' : 'http://';
        return pStr;
    }

    domain() {
        let domainStr = ''
        domainStr += this.cookie.domain;
        return domainStr;
    }
}