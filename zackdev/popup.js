import { CookiesAPI, StackCookie, Helper } from '/zackdev/modules.mjs';


const key_name_pairs = [
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

    constructor(content_root, api) {
        this.content_root = content_root;
        this.cookiesAPI = api;
        // keeps track of the collapsed state of domains
        this.domain_state = new Map();
        this.set_version();
        this.set_options_link();
    }

    create_cookie_attribute_row(key_name_pair, value) {
        let value_type = typeof (value);

        var attribute_row = document.createElement('div');
        attribute_row.classList.add('align-items-center', 'border-bottom', 'flex', 'flex-spacebetween');
        attribute_row.style.color = '#5f5f5f';

        var attribute_name = document.createElement('span');
        attribute_name.classList.add('fs-16');
        attribute_name.innerText = key_name_pair.name;
        attribute_name.style.marginRight = '20px';

        var attribute_value = document.createElement('span');
        attribute_value.classList.add('fs-16');
        attribute_value.style.overflowWrap = 'anywhere';

        if (value_type === 'string') {
            attribute_value.innerText = value;
        }
        else if (value_type === 'boolean') {
            attribute_value.innerHTML = Helper.check_or_x(value);
        }
        else if (value_type === 'number') {
            if (key_name_pair.key === 'expirationDate') {
                try {
                    let v = new Date(value * 1000);
                    attribute_value.innerText = v.toISOString();
                }
                catch {
                    attribute_value.innerText = String(value);
                }
            }
            else {
                attribute_value.innerText = String(value);
            }
        }
        else if (key_name_pair.key === 'partitionKey') {
            if (value && Object.getOwnPropertyNames(value).includes('topLevelSite')) {
                attribute_value.innerText = String(value.topLevelSite);
            }
        }
        else if (value_type === 'undefined') {
            attribute_value.innerText = 'undefined';
        }
        else {
            console.log('StackCookieDisplay.create_cookie_attribute_row(): unexpected type of value:', value_type);
        }

        attribute_row.append(attribute_name);
        attribute_row.append(attribute_value);

        return attribute_row;
    }

    create_cookie_attributes(cookie) {
        var attribute_rows = [];
        key_name_pairs.forEach((p) => {
            if (Object.getOwnPropertyNames(cookie).includes(p.key)) {
                attribute_rows.push(this.create_cookie_attribute_row(p, cookie[p.key]));
            }
        });
        return attribute_rows;
    }

    set_version() {
        var version_str = this.cookiesAPI.runtime.getManifest().version;
        document.getElementById('version').innerText = ['version', version_str].join(' ');
    }

    set_options_link() {
        var options_icon = document.getElementById('options-icon');
        options_icon.addEventListener("click", () => {
            this.cookiesAPI.runtime.openOptionsPage();
        });
    }

    // creates and adds 'cookie-domain' div to the DOM if it is the first cookie for this domain
    // creates and adds 'cookie-wrap' and appends it to an already existing or previously created domain
    on_cookie_added(stack_cookie) {
        console.log('StackCookieDisplay.on_cookie_added()');

        var domain_wrap = document.getElementById(`domain-wrap-${stack_cookie.unique_domain_string()}`);
        // domain-wrap doesn't exist
        if (domain_wrap === null) {
            // set the domain state to it's default, 'not collapsed'
            console.log('StackCookieDisplay.on_cookie_added(): setting domain state');
            this.domain_state.set(stack_cookie.unique_domain_string(),
                {
                    collapsed: true
                }
            );
            console.log('StackCookieDisplay.on_cookie_added(): domain_wrap doesnt exist, going through which to insert to.');
            var domain_added = false;
            var all_domain_wraps = document.getElementsByClassName('domain-wrap');
            for (let i = 0; i < all_domain_wraps.length; i++) {
                var compare_wrap = all_domain_wraps[i];
                var compare_wrap_domain = compare_wrap.getAttribute('domain');
                console.log('StackCookieDisplay.on_cookie_added(): comparing cookie domain to existing domain:');
                // lexical domain comparison ('a' < 'b' ) = true, ('a' > 'b') = false
                if (stack_cookie.domain() < compare_wrap_domain) {
                    console.log('StackCookieDisplay.on_cookie_added(): prepending domain-wrap');
                    // add domain-wrap for stack_cookie before the compared element, set domain_added flag to true, leave the for loop
                    document.getElementById('content').insertBefore(this.create_domain_wrap_html(stack_cookie), all_domain_wraps[i]);
                    domain_added = true;
                    break;
                }
            }
            // append domain-wrap to content_root if comparison didn't trigger
            // e.g. existing domains: 'a', 'b', adding cookie with 'c' domain
            if (domain_added === false) {
                console.log('StackCookieDisplay.on_cookie_added(): appending domain-wrap to content_root ');
                this.content_root.append(this.create_domain_wrap_html(stack_cookie));
            }
        }
        // at this point, a cookie-domain with cookie wrap exists
        var cookie_wrap = document.getElementById(`cookie-wrap-${stack_cookie.unique_domain_string()}`);
        console.log('StackCookieDisplay.on_cookie_added(): adding cookie to cookie_wrap:');
        cookie_wrap.append(this.create_cookie_html(stack_cookie));
    }

    // removes a single cookie from the DOM
    // removes 'cookie-domain' from DOM if there are no more cookies in it
    on_cookie_removed(stack_cookie) {
        console.log('StackCookieDisplay.on_cookie_removed(): removing cookie.');
        document.getElementById(`cookie-${stack_cookie.unique_cookie_string()}`).remove();
        let cookies = document.getElementsByClassName(`cookie ${stack_cookie.unique_domain_string()}`);
        if (cookies.length === 0) {
            console.log('StackCookieDisplay.on_cookie_removed(): removing domain-wrap');
            document.getElementById(`domain-wrap-${stack_cookie.unique_domain_string()}`).remove();
            this.domain_state.delete(stack_cookie.unique_domain_string());
        }
    }

    // creates nested HTML-Element for a specific cookie, including the cookie values provided
    create_cookie_html(stack_cookie) {
        var u_domain_str = stack_cookie.unique_domain_string();
        var u_cookie_str = stack_cookie.unique_cookie_string();
        var cookie_div = document.createElement('div');
        cookie_div.setAttribute('id', `cookie-${u_cookie_str}`);
        cookie_div.classList.add('align-items-center', 'cookie', 'p10', `${u_domain_str}`);

        let attribute_rows = this.create_cookie_attributes(stack_cookie.cookie, key_name_pairs);

        let attribute_rows_container = document.createElement('div');
        attribute_rows_container.style.fontFamily = 'monospace';
        
        attribute_rows_container.append(...attribute_rows);

        cookie_div.append(attribute_rows_container);

        // cookie action container
        var cookie_action_div = document.createElement('div');
        cookie_action_div.classList.add('align-items-center', 'flex', 'flex-end', 'minh-40');

        // trash button
        var trash_button = document.createElement('button');
        trash_button.title = 'delete cookie';
        trash_button.setAttribute('id', `trash-button-${u_cookie_str}`);
        trash_button.setAttribute('type', 'button');
        trash_button.classList.add('clickable', 'border', 'rounded', 'quadratic-30', 'trash-icon');
        trash_button.addEventListener("click", () => {
            console.log('StackCookieDisplay: trash button clicked.');
            this.cookiesAPI.remove(stack_cookie);
        });

        cookie_action_div.append(trash_button);
        cookie_div.append(cookie_action_div);

        return cookie_div;
    }

    // creates a nested HTML-Element for a specific domain with the corresponding collapse button
    create_domain_wrap_html(stack_cookie) {
        console.log('StackCookieDisplay.create_domain_wrap_html()');

        var u_domain_str = stack_cookie.unique_domain_string();
        console.log('StackCookieDisplay.create_domain_wrap_html(): domain_state:', domain_state);

        console.log('StackCookieDisplay.create_domain_wrap_html(): creating html elements');
        var cookie_domain_div = document.createElement('div');
        cookie_domain_div.setAttribute('id', `cookie-domain-${u_domain_str}`);
        cookie_domain_div.classList.add('align-items-center', 'flex', 'flex-spacebetween', 'fs-20', 'p-5');

        var domain_info_div = document.createElement('div');

        var domain_name = document.createElement('span');
        domain_name.innerText = `${stack_cookie.cookie.domain}`;

        var details_button = document.createElement('button');
        details_button.title = 'show cookies';
        details_button.setAttribute('type', 'button');
        details_button.setAttribute('id', `details-button-${u_domain_str}`);
        details_button.setAttribute('data-target', `cookie-wrap-${u_domain_str}`);
        details_button.classList.add('clickable', 'border', 'rounded', 'quadratic-30', 'plus-icon');
        details_button.addEventListener("click", (event) => {
            console.log('StackCookieDisplay: details button clicked.');
            var btn = event.target;
            var collapsed = false;
            var elementToCollapse = document.getElementById(btn.getAttribute('data-target'));
            if (btn.classList.contains('plus-icon')) {
                details_button.title = 'hide cookies';
                collapsed = false;
                elementToCollapse.classList.remove('collapsed');
                btn.classList.remove('plus-icon');
                btn.classList.add('minus-icon');

            }
            else if (btn.classList.contains('minus-icon')) {
                details_button.title = 'show cookies';
                collapsed = true;
                elementToCollapse.classList.add('collapsed');
                btn.classList.remove('minus-icon');
                btn.classList.add('plus-icon');
            }

            this.domain_state.set(u_domain_str, { collapsed: collapsed });
        });

        domain_info_div.append(domain_name);

        cookie_domain_div.append(domain_info_div);
        cookie_domain_div.append(details_button);

        var cookie_wrap_div = document.createElement('div');
        cookie_wrap_div.setAttribute('id', `cookie-wrap-${u_domain_str}`);

        var domain_state = this.domain_state.get(u_domain_str);
        if (domain_state) {
            if (domain_state.collapsed === true) {
                cookie_wrap_div.classList.add('collapsed');
            }
        }
        else {
            cookie_wrap_div.classList.add('collapsed');
            this.domain_state.set(u_domain_str, { collapsed: true })
        }
        
        var domain_wrap_div = document.createElement('div');
        domain_wrap_div.classList.add('domain-wrap');
        domain_wrap_div.setAttribute('id', `domain-wrap-${u_domain_str}`);
        domain_wrap_div.setAttribute('domain', `${stack_cookie.domain()}`);
        domain_wrap_div.append(cookie_domain_div);
        domain_wrap_div.append(cookie_wrap_div);

        return domain_wrap_div;
    }
}


function init(cookiesAPI) {
    const add_all_cookies = (cookies) => {
        cookies.forEach(cookie => {
            display.on_cookie_added(new StackCookie(cookie));
        });
    }

    const on_cookie_changed_listener = (cookie_event) => {
        console.log('on_cookie_changed_listener(): cookie event caught.');
        var stack_cookie = new StackCookie(cookie_event.cookie);

        switch (cookie_event.cause) {

            case 'evicted':
                // cookie got collected by the GC
                console.log('handling cookie event "evicted". removing cookie.');
                display.on_cookie_removed(stack_cookie);
                break;

            case 'explicit':
                // cookie got explicitly added or removed
                if (cookie_event.removed === true) {
                    console.log('handling cookie event "explicit". removing cookie.');
                    display.on_cookie_removed(stack_cookie);
                }
                else if (cookie_event.removed === false) {
                    console.log('handling cookie event "explicit". adding cookie.');
                    display.on_cookie_added(stack_cookie);
                }
                break;

            case 'expired_overwrite':
                console.log('handling cookie event "expired_overwrite". removing cookie.');
                display.on_cookie_removed(stack_cookie);
                break;

            case 'overwrite':
                console.log('handling cookie event "overwrite". removing cookie.');
                display.on_cookie_removed(stack_cookie);
                break;
        }
    }

    // creates StackCookieDisplay object, with the HTML-Element where it attaches to as parameter
    const display = new StackCookieDisplay(document.getElementById('content'), cookiesAPI);

    // adds cookies.onChange listener
    if (!cookiesAPI.cookies.onChanged.hasListener(on_cookie_changed_listener)) {
        cookiesAPI.cookies.onChanged.addListener(on_cookie_changed_listener);
    }

    // gets all cookies from browser.cookies API and adds them to the CookieDisplay
    cookiesAPI.getAll({}, add_all_cookies);
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
