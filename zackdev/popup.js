import { CookiesAPI, StackCookie, Helper } from '/zackdev/modules.mjs';


const keyNamePairs = [
    {
        key: 'path',
        name: 'path'
    },
    {
        key: 'name',
        name: 'name'
    },
    {
        key: 'secure',
        name: 'secure'
    },
    {
        key: 'session',
        name: 'session'
    },
    {
        key: 'hostOnly',
        name: 'host only'
    },
    {
        key: 'httpOnly',
        name: 'http only'
    },
    {
        key: 'sameSite',
        name: 'same site'
    },
    {
        key: 'expirationDate',
        name: 'expiration date'
    },
    {
        key: 'firstPartyDomain',
        name: 'first party domain'
    },
    {
        key: 'storeId',
        name: 'store id'
    },
    {
        key: 'value',
        name: 'value'
    },
    {
        key: 'partitionKey',
        name: 'partition key'
    }
];

/*
  StackCookieDisplay class
  - responsible for DOM manipulation of the popup.html page
  -- adding and removing cookies
  -- displaying cookie values
  -- handling trash and details button clicks
  -- display version string
*/
class StackCookieDisplay {

    constructor(contentRoot, api) {
        this.contentRoot = contentRoot;
        this.cookiesAPI = api;
        // keeps track of the collapsed state of domains
        this.domainState = new Map();
        this.setVersion();
        this.setOptionsLink();
    }

    createCookieAttributeRow(keyNamePair, value) {
        let valueType = typeof (value);

        var attributeRow = document.createElement('div');
        attributeRow.classList.add('align-items-center', 'border-bottom', 'flex', 'flex-spacebetween');
        attributeRow.style.color = '#5f5f5f';

        var attributeName = document.createElement('span');
        attributeName.classList.add('fs-16');
        attributeName.innerText = keyNamePair.name;
        attributeName.style.marginRight = '20px';

        var attributeValue = document.createElement('span');
        attributeValue.classList.add('fs-16');
        attributeValue.style.overflowWrap = 'anywhere';

        if (valueType === 'string') {
            attributeValue.innerText = value;
        }
        else if (valueType === 'boolean') {
            attributeValue.innerHTML = Helper.checkOrX(value);
        }
        else if (valueType === 'number') {
            if (keyNamePair.key === 'expirationDate') {
                try {
                    let v = new Date(value * 1000);
                    attributeValue.innerText = v.toISOString();
                }
                catch {
                    attributeValue.innerText = String(value);
                }
            }
            else {
                attributeValue.innerText = String(value);
            }
        }
        else if (keyNamePair.key === 'partitionKey') {
            if (value && Object.getOwnPropertyNames(value).includes('topLevelSite')) {
                attributeValue.innerText = String(value.topLevelSite);
            }
        }
        else if (valueType === 'undefined') {
            attributeValue.innerText = 'undefined';
        }
        else {
            console.log('StackCookieDisplay.createCookieAttributeRow(): unexpected type of value:', valueType);
        }

        attributeRow.append(attributeName);
        attributeRow.append(attributeValue);

        return attributeRow;
    }

    createCookieAttributes(cookie) {
        var attributeRows = [];
        keyNamePairs.forEach((p) => {
            if (Object.getOwnPropertyNames(cookie).includes(p.key)) {
                attributeRows.push(this.createCookieAttributeRow(p, cookie[p.key]));
            }
        });
        return attributeRows;
    }

    setVersion() {
        var versionStr = this.cookiesAPI.runtime.getManifest().version;
        document.getElementById('version').innerText = ['version', versionStr].join(' ');
    }

    setOptionsLink() {
        var optionsIcon = document.getElementById('options-icon');
        optionsIcon.addEventListener("click", () => {
            this.cookiesAPI.runtime.openOptionsPage();
        });
    }

    // creates and adds 'cookie-domain' div to the DOM if it is the first cookie for this domain
    // creates and adds 'cookie-wrap' and appends it to an already existing or previously created domain
    onCookieAdded(stackCookie) {
        console.log('StackCookieDisplay.onCookieAdded()');

        var domainWrap = document.getElementById(`domain-wrap-${stackCookie.uniqueDomainString()}`);
        // domain-wrap doesn't exist
        if (domainWrap === null) {
            // set the domain state to it's default, 'not collapsed'
            console.log('StackCookieDisplay.onCookieAdded(): setting domain state');
            this.domainState.set(stackCookie.uniqueDomainString(),
                {
                    collapsed: true
                }
            );
            console.log('StackCookieDisplay.onCookieAdded(): domainWrap doesnt exist, going through which to insert to.');
            var domainAdded = false;
            var allDomainWraps = document.getElementsByClassName('domain-wrap');
            for (let i = 0; i < allDomainWraps.length; i++) {
                var compareWrap = allDomainWraps[i];
                var compareWrapDomain = compareWrap.getAttribute('domain');
                console.log('StackCookieDisplay.onCookieAdded(): comparing cookie domain to existing domain:');
                // lexical domain comparison ('a' < 'b' ) = true, ('a' > 'b') = false
                if (stackCookie.domain() < compareWrapDomain) {
                    console.log('StackCookieDisplay.onCookieAdded(): prepending domain-wrap');
                    // add domain-wrap for stackCookie before the compared element, set domainAdded flag to true, leave the for loop
                    document.getElementById('content').insertBefore(this.createDomainWrapHTML(stackCookie), allDomainWraps[i]);
                    domainAdded = true;
                    break;
                }
            }
            // append domain-wrap to contentRoot if comparison didn't trigger
            // e.g. existing domains: 'a', 'b', adding cookie with 'c' domain
            if (domainAdded === false) {
                console.log('StackCookieDisplay.onCookieAdded(): appending domain-wrap to contentRoot ');
                this.contentRoot.append(this.createDomainWrapHTML(stackCookie));
            }
        }
        // at this point, a cookie-domain with cookie wrap exists
        var cookieWrap = document.getElementById(`cookie-wrap-${stackCookie.uniqueDomainString()}`);
        console.log('StackCookieDisplay.onCookieAdded(): adding cookie to cookieWrap:');
        cookieWrap.append(this.createCookieHTML(stackCookie));
    }

    // removes a single cookie from the DOM
    // removes 'cookie-domain' from DOM if there are no more cookies in it
    onCookieRemoved(stackCookie) {
        console.log('StackCookieDisplay.onCookieRemoved(): removing cookie.');
        document.getElementById(`cookie-${stackCookie.uniqueCookieString()}`).remove();
        let cookies = document.getElementsByClassName(`cookie ${stackCookie.uniqueDomainString()}`);
        if (cookies.length === 0) {
            console.log('StackCookieDisplay.onCookieRemoved(): removing domain-wrap');
            document.getElementById(`domain-wrap-${stackCookie.uniqueDomainString()}`).remove();
            this.domainState.delete(stackCookie.uniqueDomainString());
        }
    }

    // creates nested HTML-Element for a specific cookie, including the cookie values provided
    createCookieHTML(stackCookie) {
        var uDomainStr = stackCookie.uniqueDomainString();
        var uCookieStr = stackCookie.uniqueCookieString();
        var cookieDiv = document.createElement('div');
        cookieDiv.setAttribute('id', `cookie-${uCookieStr}`);
        cookieDiv.classList.add('align-items-center', 'cookie', 'p10', `${uDomainStr}`);

        let attributeRows = this.createCookieAttributes(stackCookie.cookie, keyNamePairs);

        let attributeRowsContainer = document.createElement('div');
        attributeRowsContainer.style.fontFamily = 'monospace';
        
        attributeRowsContainer.append(...attributeRows);

        cookieDiv.append(attributeRowsContainer);

        // cookie action container
        var cookieActionDiv = document.createElement('div');
        cookieActionDiv.classList.add('align-items-center', 'flex', 'flex-end', 'minh-40');

        // trash button
        var trashButton = document.createElement('button');
        trashButton.title = 'delete cookie';
        trashButton.setAttribute('id', `trash-button-${uCookieStr}`);
        trashButton.setAttribute('type', 'button');
        trashButton.classList.add('clickable', 'border', 'interactive', 'rounded', 'quadratic-30', 'trash-icon');
        trashButton.addEventListener("click", () => {
            console.log('StackCookieDisplay: trash button clicked.');
            this.cookiesAPI.remove(stackCookie);
        });

        cookieActionDiv.append(trashButton);
        cookieDiv.append(cookieActionDiv);

        return cookieDiv;
    }

    // creates a nested HTML-Element for a specific domain with the corresponding collapse button
    createDomainWrapHTML(stackCookie) {
        console.log('StackCookieDisplay.createDomainWrapHTML()');

        var uDomainStr = stackCookie.uniqueDomainString();
        console.log('StackCookieDisplay.createDomainWrapHTML(): domainState:', domainState);

        console.log('StackCookieDisplay.createDomainWrapHTML(): creating html elements');
        var cookieDomainDiv = document.createElement('div');
        cookieDomainDiv.setAttribute('id', `cookie-domain-${uDomainStr}`);
        cookieDomainDiv.classList.add('align-items-center', 'flex', 'flex-spacebetween', 'fs-20', 'p-5');

        var domainInfoDiv = document.createElement('div');

        var domainName = document.createElement('span');
        domainName.innerText = `${stackCookie.cookie.domain}`;

        var detailsBtn = document.createElement('button');
        detailsBtn.title = 'show cookies';
        detailsBtn.setAttribute('type', 'button');
        detailsBtn.setAttribute('id', `details-button-${uDomainStr}`);
        detailsBtn.setAttribute('data-target', `cookie-wrap-${uDomainStr}`);
        detailsBtn.classList.add('clickable', 'border', 'interactive', 'rounded', 'quadratic-30', 'plus-icon');
        detailsBtn.addEventListener("click", (event) => {
            console.log('StackCookieDisplay: details button clicked.');
            var btn = event.target;
            var collapsed = false;
            var elementToCollapse = document.getElementById(btn.getAttribute('data-target'));
            if (btn.classList.contains('plus-icon')) {
                detailsBtn.title = 'hide cookies';
                collapsed = false;
                elementToCollapse.classList.remove('collapsed');
                btn.classList.remove('plus-icon');
                btn.classList.add('minus-icon');

            }
            else if (btn.classList.contains('minus-icon')) {
                detailsBtn.title = 'show cookies';
                collapsed = true;
                elementToCollapse.classList.add('collapsed');
                btn.classList.remove('minus-icon');
                btn.classList.add('plus-icon');
            }

            this.domainState.set(uDomainStr, { collapsed: collapsed });
        });

        domainInfoDiv.append(domainName);

        cookieDomainDiv.append(domainInfoDiv);
        cookieDomainDiv.append(detailsBtn);

        var cookieWrapDiv = document.createElement('div');
        cookieWrapDiv.setAttribute('id', `cookie-wrap-${uDomainStr}`);

        var domainState = this.domainState.get(uDomainStr);
        if (domainState) {
            if (domainState.collapsed === true) {
                cookieWrapDiv.classList.add('collapsed');
            }
        }
        else {
            cookieWrapDiv.classList.add('collapsed');
            this.domainState.set(uDomainStr, { collapsed: true })
        }
        
        var domainWrapDiv = document.createElement('div');
        domainWrapDiv.classList.add('domain-wrap');
        domainWrapDiv.setAttribute('id', `domain-wrap-${uDomainStr}`);
        domainWrapDiv.setAttribute('domain', `${stackCookie.domain()}`);
        domainWrapDiv.append(cookieDomainDiv);
        domainWrapDiv.append(cookieWrapDiv);

        return domainWrapDiv;
    }
}


function init(cookiesAPI) {
    const addAllCookies = (cookies) => {
        cookies.forEach(cookie => {
            display.onCookieAdded(new StackCookie(cookie));
        });
    }

    const onCookieChangedListener = (cookieEvent) => {
        console.log('onCookieChangedListener(): cookie event caught.');
        var stackCookie = new StackCookie(cookieEvent.cookie);

        switch (cookieEvent.cause) {

            case 'evicted':
                // cookie got collected by the GC
                console.log('handling cookie event "evicted". removing cookie.');
                display.onCookieRemoved(stackCookie);
                break;

            case 'explicit':
                // cookie got explicitly added or removed
                if (cookieEvent.removed === true) {
                    console.log('handling cookie event "explicit". removing cookie.');
                    display.onCookieRemoved(stackCookie);
                }
                else if (cookieEvent.removed === false) {
                    console.log('handling cookie event "explicit". adding cookie.');
                    display.onCookieAdded(stackCookie);
                }
                break;

            case 'expired_overwrite':
                console.log('handling cookie event "expired_overwrite". removing cookie.');
                display.onCookieRemoved(stackCookie);
                break;

            case 'overwrite':
                console.log('handling cookie event "overwrite". removing cookie.');
                display.onCookieRemoved(stackCookie);
                break;
        }
    }

    // creates StackCookieDisplay object, with the HTML-Element where it attaches to as parameter
    const display = new StackCookieDisplay(document.getElementById('content'), cookiesAPI);

    // adds cookies.onChange listener
    if (!cookiesAPI.cookies.onChanged.hasListener(onCookieChangedListener)) {
        cookiesAPI.cookies.onChanged.addListener(onCookieChangedListener);
    }

    // gets all cookies from browser.cookies API and adds them to the CookieDisplay
    cookiesAPI.getAll({}, addAllCookies);
}


document.onreadystatechange = () => {
    if (document.readyState === 'complete') {
        var cookiesAPI;

        CookiesAPI.getAPI()
            .then(
                (apiObj) => {
                    cookiesAPI = apiObj;
                    init(cookiesAPI);
                },
                (error) => {
                    console.log(error);
                });
    }
};
