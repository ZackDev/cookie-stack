import { getCookiesAPI, StackCookie } from '/zackdev/modules.mjs';

const cookiesAPI = getCookiesAPI();

/*
  Listener for cooke change events
  - fetches all cookies from the browser's store
  - then calls the update_action_text() function
*/
const cookie_event_listener = (change_event) => {
    cookiesAPI.cookies.getAll({}, cookies_callback);
}

/** */
const cookies_callback = (cookies) => {
    update_action_text(cookies);
    applyFilter(cookies);
}

/*
  updates the toolbar icon's badge text with the current number of cookies passed
*/
const update_action_text = (cookies) => {
    var num_cookies = String(cookies.length);
    cookiesAPI.browserAction.setBadgeText(
        {
            "text": num_cookies
        }
    );
}

/*
  adds the Listener 'cookie_event_listener' to the cookies.onChanged event
*/
if (!cookiesAPI.cookies.onChanged.hasListener(cookie_event_listener)) {
    cookiesAPI.cookies.onChanged.addListener(cookie_event_listener);
}


/*
  sets the toolbar icon's badge text color
*/
cookiesAPI.browserAction.setBadgeTextColor(
    {
        color: "#000000"
    }
);


/*
  sets the toolbar icon's badge text background color
*/
cookiesAPI.browserAction.setBadgeBackgroundColor(
    {
        color: "#FFFFFF"
    }
);


/** */
const applyFilter = (cookies) => {
    switch (filter.ss) {
        case 'disabled':
            break;

        case 'allowlist':
            var cookiesToDelete = cookies.filter((c) => {
                return !filter.fa.includes(c.domain);
            });
            cookiesToDelete.forEach((c) => {
                cookiesAPI.remove(new StackCookie(c));
            });
            break;

        case 'denylist':
            var cookiesToDelete = cookies.filter((c) => {
                return filter.fa.includes(c.domain);
            });
            cookiesToDelete.forEach((c) => {
                cookiesAPI.remove(new StackCookie(c));
            });
            break;
    }
}


/** */
const filter = {
    ss: '',
    fa: [],
    fd: [],
}


/** */
const setupFilter = () => {
    cookiesAPI.getValue('ss')
        .then((r) => {
            if (r.ss) {
                filter.ss = r.ss;
            }
            else {
                filter.ss = 'disabled';
            }
        })

    cookiesAPI.getValue('fa')
        .then((r) => {
            if (r.fa) {
                filter.fa = r.fa;
            }
        });

    cookiesAPI.getValue('fd')
        .then((r) => {
            if (r.fd) {
                filter.fd = r.fd;
            }
        });
}


/** */
const onStorageUpdated = (c, a) => {
    let key = Object.keys(c)[0];
    switch (key) {
        case 'fa':
            if (c.fa.newValue) {
                filter.fa = c.fa.newValue;
            }
            else {
                filter.fa = [];
            }
            break;
        case 'fd':
            if (c.fd.newValue) {
                filter.fd = c.fd.newValue;
            }
            else {
                filter.fd = [];
            }
            break;
        case 'ss':
            if (c.ss.newValue) {
                filter.ss = c.ss.newValue;
            }
            else {
                filter.ss = 'disabled';
            }
            break;
    }
    cookiesAPI.getAll({}, cookies_callback);
}

setupFilter();

cookiesAPI.storage.onChanged.addListener(onStorageUpdated);

/*
  initial call to the Listener 'cookie_event_listener', so we don't need to wait
  for the event from cookies.onChanged
*/
cookie_event_listener({});
