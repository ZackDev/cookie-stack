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
  - adds functionality that is used by StackCookieDisplay
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


/*
  StackCookieDisplay class
  - responsible for DOM manipulation
  -- adding and removing cookies
  -- displaying cookie values
  -- handling trash and details button clicks
  -- version and a link to the homepage
*/
class StackCookieDisplay {
  static check_or_x(true_false) {
    if (true_false === true) {
      return '&check;';
    }
    else if (true_false === false) {
      return '&cross;';
    }
  }

  constructor(content_root, api) {
    this.content_root = content_root;
    this.cookiesAPI = api;
    this.domain_state = new Map();
    this.set_version();
    this.set_homepage_link();
  }

  set_version() {
    var version_str = this.cookiesAPI.runtime.getManifest().version_name;
    document.getElementById('version').innerText = ['version', version_str].join(' ');
  }

  set_homepage_link() {
    var homepage_url = this.cookiesAPI.runtime.getManifest().homepage_url;
    var homepage_link = document.getElementById('homepage-link');
    homepage_link.setAttribute('href', homepage_url);
    homepage_link.innerText = homepage_url;
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
          collapsed: false
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
    cookie_div.classList.add('cookie', `${u_domain_str}`);

    var cookie_action_div = document.createElement('div');
    cookie_action_div.classList.add('cookie-action');

    var trash_button = document.createElement('button');
    trash_button.setAttribute('id', `trash-button-${u_cookie_str}`);
    trash_button.setAttribute('type', 'button');
    trash_button.classList.add('btn', 'border', 'rounded', 'quadratic-30', 'trash');
    trash_button.addEventListener("click", () => {
      console.log('StackCookieDisplay: trash button clicked.');
      let details;
      switch (this.cookiesAPI.browser) {
        case 'ff':
          details = {
            url: stack_cookie.url(),
            name: stack_cookie.cookie.name,
            storeId: stack_cookie.cookie.storeId,
            firstPartyDomain: stack_cookie.cookie.firstPartyDomain
          }
          break;
        case 'chrome':
          details = {
            url: stack_cookie.url(),
            name: stack_cookie.cookie.name,
            storeId: stack_cookie.cookie.storeId,
          }
          break;
      }
      this.cookiesAPI.cookies.remove(details)
        .then(
          function resolve(r) {
            console.log(`browser.cookies.remove: resolved with: ${r}`);
            if (r === null) {
              console.log(`browser.cookies.remove lastError: ${browser.runtime.lastError}`);
            }
          },
          rej => console.log(`browser.cookies.remove resolved with: ${rej}`)
        );
    });

    cookie_action_div.append(trash_button);
    cookie_div.append(cookie_action_div);

    // path/name
    var attribute_row = document.createElement('div');
    attribute_row.classList.add('attribute-row', 'border-bottom');
    var attribute_name = document.createElement('span');
    attribute_name.classList.add('attribute-name');
    attribute_name.innerText = 'path & name';
    var attribute_value_wrap = document.createElement('div');
    attribute_value_wrap.classList.add('attribute-value');
    var attribute_value_path = document.createElement('span');
    attribute_value_path.classList.add('badge', 'badge-dark');
    attribute_value_path.innerText = `${stack_cookie.cookie.path}`;
    var attribute_value_name = document.createElement('span');
    attribute_value_name.innerText = `${stack_cookie.cookie.name}`;

    attribute_value_wrap.append(attribute_value_path);
    attribute_value_wrap.append(attribute_value_name);

    attribute_row.append(attribute_name);
    attribute_row.append(attribute_value_wrap);

    cookie_div.append(attribute_row);


    // secure
    var attribute_row = document.createElement('div');
    attribute_row.classList.add('attribute-row', 'border-bottom');
    var attribute_name = document.createElement('span');
    attribute_name.classList.add('attribute-name');
    attribute_name.innerText = 'secure';
    var attribute_value = document.createElement('span');
    attribute_value.classList.add('attribute-value');
    attribute_value.innerHTML = StackCookieDisplay.check_or_x(stack_cookie.cookie.secure);

    attribute_row.append(attribute_name);
    attribute_row.append(attribute_value);

    cookie_div.append(attribute_row);


    // session
    var attribute_row = document.createElement('div');
    attribute_row.classList.add('attribute-row', 'border-bottom');
    var attribute_name = document.createElement('span');
    attribute_name.classList.add('attribute-name');
    attribute_name.innerText = 'session';
    var attribute_value = document.createElement('span');
    attribute_value.classList.add('attribute-value');
    attribute_value.innerHTML = StackCookieDisplay.check_or_x(stack_cookie.cookie.session);

    attribute_row.append(attribute_name);
    attribute_row.append(attribute_value);

    cookie_div.append(attribute_row);


    // host host only
    var attribute_row = document.createElement('div');
    attribute_row.classList.add('attribute-row', 'border-bottom');
    var attribute_name = document.createElement('span');
    attribute_name.classList.add('attribute-name');
    attribute_name.innerText = 'host only';
    var attribute_value = document.createElement('span');
    attribute_value.classList.add('attribute-value');
    attribute_value.innerHTML = StackCookieDisplay.check_or_x(stack_cookie.cookie.hostOnly);

    attribute_row.append(attribute_name);
    attribute_row.append(attribute_value);

    cookie_div.append(attribute_row);


    // http only
    var attribute_row = document.createElement('div');
    attribute_row.classList.add('attribute-row', 'border-bottom');
    var attribute_name = document.createElement('span');
    attribute_name.classList.add('attribute-name');
    attribute_name.innerText = 'http only';
    var attribute_value = document.createElement('span');
    attribute_value.classList.add('attribute-value');
    attribute_value.innerHTML = StackCookieDisplay.check_or_x(stack_cookie.cookie.httpOnly);

    attribute_row.append(attribute_name);
    attribute_row.append(attribute_value);

    cookie_div.append(attribute_row);


    // same site
    var attribute_row = document.createElement('div');
    attribute_row.classList.add('attribute-row', 'border-bottom');
    var attribute_name = document.createElement('span');
    attribute_name.classList.add('attribute-name');
    attribute_name.innerText = 'same site';
    var attribute_value = document.createElement('span');
    attribute_value.classList.add('attribute-value');
    attribute_value.innerText = `${stack_cookie.cookie.sameSite}`;

    attribute_row.append(attribute_name);
    attribute_row.append(attribute_value);

    cookie_div.append(attribute_row);


    // expiration date
    var attribute_row = document.createElement('div');
    attribute_row.classList.add('attribute-row', 'border-bottom');
    var attribute_name = document.createElement('span');
    attribute_name.classList.add('attribute-name');
    attribute_name.innerText = 'expiration date';
    var attribute_value = document.createElement('span');
    attribute_value.classList.add('attribute-value');
    attribute_value.innerText = `${stack_cookie.cookie.expirationDate}`;

    attribute_row.append(attribute_name);
    attribute_row.append(attribute_value);

    cookie_div.append(attribute_row);


    // first party domain
    var attribute_row = document.createElement('div');
    attribute_row.classList.add('attribute-row', 'border-bottom');
    var attribute_name = document.createElement('span');
    attribute_name.classList.add('attribute-name');
    attribute_name.innerText = 'first party domain';
    var attribute_value = document.createElement('span');
    attribute_value.classList.add('attribute-value');
    attribute_value.innerText = `${stack_cookie.cookie.firstPartyDomain}`;

    attribute_row.append(attribute_name);
    attribute_row.append(attribute_value);

    cookie_div.append(attribute_row);


    // store id
    var attribute_row = document.createElement('div');
    attribute_row.classList.add('attribute-row', 'border-bottom');
    var attribute_name = document.createElement('span');
    attribute_name.classList.add('attribute-name');
    attribute_name.innerText = 'store id';
    var attribute_value = document.createElement('span');
    attribute_value.classList.add('attribute-value');
    attribute_value.innerText = `${stack_cookie.cookie.storeId}`;

    attribute_row.append(attribute_name);
    attribute_row.append(attribute_value);

    cookie_div.append(attribute_row);


    // value
    var attribute_row = document.createElement('div');
    attribute_row.classList.add('attribute-row', 'border-bottom');
    var attribute_value = document.createElement('span');
    attribute_value.classList.add('attribute-value');
    attribute_value.innerText = `${stack_cookie.cookie.value}`;

    attribute_row.append(attribute_value);

    cookie_div.append(attribute_row);

    return cookie_div;
  }

  // creates a nested HTML-Element for a specific domain with the corresponding collapse button
  create_domain_wrap_html(stack_cookie) {
    console.log('StackCookieDisplay.create_domain_wrap_html()');

    var u_domain_str = stack_cookie.unique_domain_string();
    var domain_state = this.domain_state.get(u_domain_str);
    console.log('StackCookieDisplay.create_domain_wrap_html(): domain_state');
    var collapse_class = '';
    if (domain_state.collapsed === true) {
      collapse_class = 'collapsed';
    }
    console.log('StackCookieDisplay.create_domain_wrap_html(): creating html elements');
    var cookie_domain_div = document.createElement('div');
    cookie_domain_div.setAttribute('id', `cookie-domain-${u_domain_str}`);
    cookie_domain_div.classList.add('cookie-domain', 'border-top');

    var domain_info_div = document.createElement('div');

    var domain_name = document.createElement('span');
    domain_name.classList.add('attribute-value');
    domain_name.innerText = `${stack_cookie.cookie.domain}`;

    var details_button = document.createElement('button');
    details_button.setAttribute('type', 'button');
    details_button.setAttribute('id', `details-button-${u_domain_str}`);
    details_button.setAttribute('data-target', `cookie-wrap-${u_domain_str}`);
    details_button.classList.add('details', 'btn', 'border', 'rounded', 'quadratic-30', 'arrow-south');
    details_button.addEventListener("click", (event) => {
      console.log('StackCookieDisplay: details button clicked.');
      var btn = event.target;
      var collapsed = false;
      var elementToCollapse = document.getElementById(btn.getAttribute('data-target'));
      if (btn.classList.contains('arrow-south')) {
        collapsed = false;
        elementToCollapse.classList.add('collapsed');
        elementToCollapse.classList.remove('not-collapsed');
        btn.classList.remove('arrow-south');
        btn.classList.add('arrow-north');
      }
      else if (btn.classList.contains('arrow-north')) {
        collapsed = true;
        elementToCollapse.classList.remove('collapsed');
        elementToCollapse.classList.add('not-collapsed');
        btn.classList.remove('arrow-north');
        btn.classList.add('arrow-south');
      }

      // keeps track of domain's collapsed state
      this.domain_state.set(stack_cookie.unique_domain_string(),
        {
          collapsed: collapsed
        }
      );
    });

    domain_info_div.append(domain_name);

    cookie_domain_div.append(domain_info_div);
    cookie_domain_div.append(details_button);

    var cookie_wrap_div = document.createElement('div');
    cookie_wrap_div.setAttribute('id', `cookie-wrap-${u_domain_str}`);
    cookie_wrap_div.classList.add('cookie-wrap', 'not-collapsed');
    if (collapse_class !== '') {
      cookie_wrap_div.classList.add(`${collapse_class}`);
      cookie_wrap_div.classList.remove('not-collapsed');
    }

    var ret = document.createElement('div');
    ret.classList.add('domain-wrap');
    ret.setAttribute('id', `domain-wrap-${u_domain_str}`);
    ret.setAttribute('domain', `${stack_cookie.domain()}`);
    ret.append(cookie_domain_div);
    ret.append(cookie_wrap_div);

    console.log('StackCookieDisplay.create_cookie_domain_html():');

    return ret;
  }
}

function on_cookie_changed_listener(cookie_event) {
  console.log('on_cookie_changed_listener(): cookie event caught.');
  var stack_cookie = new StackCookie(cookie_event.cookie);

  switch (cookie_event.cause) {

    case 'evicted':
      // cookie got collected by the GC
      console.log('handling cookie event "evicted". removing cookie.');
      this.display.on_cookie_removed(stack_cookie);
      break;

    case 'explicit':
      // cookie got explicitly added or removed
      if (cookie_event.removed === true) {
        console.log('handling cookie event "explicit". removing cookie.');
        this.display.on_cookie_removed(stack_cookie);
      }
      else if (cookie_event.removed === false) {
        console.log('handling cookie event "explicit". adding cookie.');
        this.display.on_cookie_added(stack_cookie);
      }
      break;

    case 'expired_overwrite':
      console.log('handling cookie event "expired_overwrite". removing cookie.');
      this.display.on_cookie_removed(stack_cookie);
      break;

    case 'overwrite':
      console.log('handling cookie event "overwrite". removing cookie.');
      this.display.on_cookie_removed(stack_cookie);
      break;
  }
}

function init() {
  const cookiesAPI = {
    browser: '',
    cookies: '',
    runtime: '',
  }

  const setAPI = (b, r) => {
    if (cookiesAPI.browser === '') {
      cookiesAPI.browser = b;
      cookiesAPI.cookies = r.cookies;
      cookiesAPI.runtime = r.runtime;
    } else {
      console.log('cookiesAPI properties already set.');
    }
  }

  try {
    setAPI('ff', browser);
  }
  catch (error) {
    console.log(error)
  }

  try {
    setAPI('chrome', chrome);
  }
  catch (error) {
    console.log(error)
  }


  // creates StackCookieDisplay object, with the HTML-Element where it attaches to as parameter
  this.display = new StackCookieDisplay(document.getElementById('content'), cookiesAPI);

  // adds cookies.onChange listener
  if (!cookiesAPI.cookies.onChanged.hasListener(on_cookie_changed_listener)) {
    cookiesAPI.cookies.onChanged.addListener(on_cookie_changed_listener);
  }

  // gets all cookies from browser.cookies API and adds them to the Stack
  switch (cookiesAPI.browser) {
    case 'ff':
      var get_all_cookies = cookiesAPI.cookies.getAll({});
      get_all_cookies.then(add_all_cookies);
      break;
    case 'chrome':
      cookiesAPI.cookies.getAll({}, add_all_cookies);
      break;
  }
}

/*
  adds cookies to the display
*/
function add_all_cookies(cookies) {
  for (let i = 0; i < cookies.length; i++) {
    this.display.on_cookie_added(new StackCookie(cookies[i]));
  }
}

/*
stub: handling is done by cookies.onChanged(...)
*/
function on_cookie_removed(cookie) { }

function on_cookie_remove_error(error) {
  console.log(error);
}

document.onreadystatechange = () => {
  if (document.readyState === 'complete') {
    init();
  }
};
