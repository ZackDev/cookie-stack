import { CookiesAPI, StackCookie, Helper } from '/assets/modules.mjs';

document.onreadystatechange = function () {
    if (document.readyState === "complete") {
        CookiesAPI.getAPI()
            .then(
                (apiObj) => {
                    PopupUI(apiObj);
                },
                (error) => { }
            );
    }
};

/*
  PopupUI
  - responsible for DOM manipulation of the popup.html page
  -- adding and removing cookies
  -- collapse, expand domains
*/
const PopupUI = (cookiesAPI) => {

    var contentRoot = document.getElementById('content');
    var domainStates = new Map();

    const createCookieAttributeRow = (keyNamePair, value) => {
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

        attributeRow.append(attributeName);
        attributeRow.append(attributeValue);

        return attributeRow;
    }

    const createCookieAttributes = (cookie) => {
        var attributeRows = [];
        cookiesAPI.keyNamePairs.forEach((p) => {
            if (Object.getOwnPropertyNames(cookie).includes(p.key)) {
                attributeRows.push(createCookieAttributeRow(p, cookie[p.key]));
            }
        });
        return attributeRows;
    }

    const bindOptionsBtn = () => {
        var optionsBtn = document.getElementById('options-btn');
        optionsBtn.addEventListener("click", () => {
            cookiesAPI.runtime.openOptionsPage();
        });
    }

    const bindDeleteAllBtn = () => {
        var deleteAllBtn = document.getElementById('delete-all-btn');
        deleteAllBtn.addEventListener("click", () => {
            cookiesAPI.getAll({}, (cookies) => {
                cookies.forEach(cookie => {
                    cookiesAPI.remove(new StackCookie(cookie));
                });
            });
        });
    }

    const addAllCookies = (cookies) => {
        cookies.forEach(cookie => {
            onCookieAdded(new StackCookie(cookie));
        });
    }

    const onCookieChangedListener = (cookieEvent) => {
        var stackCookie = new StackCookie(cookieEvent.cookie);
        switch (cookieEvent.cause) {
            case 'evicted':
                // cookie got collected by the GC
                onCookieRemoved(stackCookie);
                break;

            case 'explicit':
                // cookie got explicitly added or removed
                if (cookieEvent.removed === true) {
                    onCookieRemoved(stackCookie);
                }
                else if (cookieEvent.removed === false) {
                    onCookieAdded(stackCookie);
                }
                break;

            case 'expired_overwrite':
                onCookieRemoved(stackCookie);
                break;

            case 'overwrite':
                onCookieRemoved(stackCookie);
                break;
        }
    }

    const onCookieAdded = (stackCookie) => {
        var domainWrap = document.getElementById(`domain-wrap-${stackCookie.uniqueDomainString()}`);
        if (domainWrap === null) {
            domainStates.set(stackCookie.uniqueDomainString(),
                {
                    collapsed: true
                }
            );
            var domainAdded = false;
            var allDomainWraps = document.getElementsByClassName('domain-wrap');
            var stackCookieDomain = stackCookie.domain();
            for (let i = 0; i < allDomainWraps.length; i++) {
                var compareWrap = allDomainWraps[i];
                var compareWrapDomain = compareWrap.getAttribute('domain');
                // lexical domain comparison ('a' < 'b' ) = true, ('a' > 'b') = false
                if (stackCookieDomain < compareWrapDomain) {
                    document.getElementById('content').insertBefore(createDomainWrapHTML(stackCookie), allDomainWraps[i]);
                    domainAdded = true;
                    break;
                }
            }
            if (domainAdded === false) {
                contentRoot.append(createDomainWrapHTML(stackCookie));
            }
        }
        // at this point, a cookie-domain with cookie wrap exists
        var cookieWrap = document.getElementById(`cookie-wrap-${stackCookie.uniqueDomainString()}`);
        cookieWrap.append(createCookieHTML(stackCookie));
    }

    const onCookieRemoved = (stackCookie) => {
        document.getElementById(`cookie-${stackCookie.uniqueCookieString()}`).remove();
        let cookies = document.getElementsByClassName(`cookie ${stackCookie.uniqueDomainString()}`);
        if (cookies.length === 0) {
            document.getElementById(`domain-wrap-${stackCookie.uniqueDomainString()}`).remove();
            domainStates.delete(stackCookie.uniqueDomainString());
        }
    }

    const createCookieHTML = (stackCookie) => {
        var uDomainStr = stackCookie.uniqueDomainString();
        var uCookieStr = stackCookie.uniqueCookieString();
        var cookieDiv = document.createElement('div');
        cookieDiv.setAttribute('id', `cookie-${uCookieStr}`);
        cookieDiv.classList.add('align-items-center', 'cookie', `${uDomainStr}`);
        cookieDiv.style.padding = '15px 5px 15px 10px';

        let attributeRows = createCookieAttributes(stackCookie.cookie, cookiesAPI.keyNamePairs);

        let attributeRowsContainer = document.createElement('div');
        attributeRowsContainer.style.fontFamily = 'monospace';
        attributeRowsContainer.append(...attributeRows);

        cookieDiv.append(attributeRowsContainer);

        var cookieActionDiv = document.createElement('div');
        cookieActionDiv.classList.add('align-items-center', 'flex', 'flex-end', 'minh-40');

        var trashButton = document.createElement('button');
        trashButton.title = 'delete cookie';
        trashButton.setAttribute('id', `trash-button-${uCookieStr}`);
        trashButton.setAttribute('type', 'button');
        trashButton.classList.add('clickable', 'border', 'interactive', 'rounded', 'quadratic-30', 'trash-icon');
        trashButton.addEventListener("click", () => {
            cookiesAPI.remove(stackCookie);
        });

        cookieActionDiv.append(trashButton);
        cookieDiv.append(cookieActionDiv);

        return cookieDiv;
    }

    const createDomainWrapHTML = (stackCookie) => {
        var uDomainStr = stackCookie.uniqueDomainString();

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
            var collapsed = false;
            var elementToCollapse = document.getElementById(detailsBtn.getAttribute('data-target'));
            if (detailsBtn.classList.contains('plus-icon')) {
                detailsBtn.title = 'hide cookies';
                collapsed = false;
                elementToCollapse.classList.remove('collapsed');
                detailsBtn.classList.remove('plus-icon');
                detailsBtn.classList.add('minus-icon');
            }
            else if (detailsBtn.classList.contains('minus-icon')) {
                detailsBtn.title = 'show cookies';
                collapsed = true;
                elementToCollapse.classList.add('collapsed');
                detailsBtn.classList.remove('minus-icon');
                detailsBtn.classList.add('plus-icon');
            }
            domainStates.set(uDomainStr, { collapsed: collapsed });
        });

        domainInfoDiv.append(domainName);
        cookieDomainDiv.append(domainInfoDiv);
        cookieDomainDiv.append(detailsBtn);

        var cookieWrapDiv = document.createElement('div');
        cookieWrapDiv.setAttribute('id', `cookie-wrap-${uDomainStr}`);

        var domainState = domainStates.get(uDomainStr);
        if (domainState) {
            if (domainState.collapsed === true) {
                cookieWrapDiv.classList.add('collapsed');
            }
        }
        else {
            cookieWrapDiv.classList.add('collapsed');
            domainState.set(uDomainStr, { collapsed: true })
        }

        var domainWrapDiv = document.createElement('div');
        domainWrapDiv.classList.add('domain-wrap');
        domainWrapDiv.setAttribute('id', `domain-wrap-${uDomainStr}`);
        domainWrapDiv.setAttribute('domain', `${stackCookie.domain()}`);
        domainWrapDiv.append(cookieDomainDiv);
        domainWrapDiv.append(cookieWrapDiv);

        return domainWrapDiv;
    }
    if (!cookiesAPI.cookies.onChanged.hasListener(onCookieChangedListener)) {
        cookiesAPI.cookies.onChanged.addListener(onCookieChangedListener);
    }

    bindDeleteAllBtn();
    bindOptionsBtn();

    cookiesAPI.getAll({}, addAllCookies);
}
