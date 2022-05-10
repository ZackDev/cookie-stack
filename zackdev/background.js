/*
  Listener for cooke change events
  - fetches all cookies from the browser's store
  - then calls the update_action_text() function
*/
const cookie_event_listener = ( change_event ) => {
  var get_all_cookies = cookiesAPI.cookies.getAll( {} );
  get_all_cookies.then( update_action_text );
};


/*
  updates the toolbar icon's badge text with the current number of cookies passed
*/
const update_action_text = ( cookies ) => {
  var num_cookies = String( cookies.length );
  cookiesAPI.browserAction.setBadgeText(
    {
      "text": num_cookies
    }
  );
}

const cookiesAPI = {
  browserAction: '',
  cookies: '',
}

const setAPI = (r) => {
  if (cookiesAPI.cookies === '' && cookiesAPI.browserAction === '') {
    cookiesAPI.browserAction = r.browserAction;
    cookiesAPI.cookies = r.cookies;
  } else {
    console.log('cookiesAPI properties already set.');
  }
}

try {
  setAPI(browser);
}
catch (error) {
  console.log(error)
}

try {
  setAPI(chrome);
  cookiesAPI.browserAction.setBadgeTextColor = () => {
    
  }
}
catch (error) {
  console.log(error)
}


/*
  adds the Listener 'cookie_event_listener' to the cookies.onChanged event
*/
if ( !cookiesAPI.cookies.onChanged.hasListener( cookie_event_listener ) ) {
  cookiesAPI.cookies.onChanged.addListener( cookie_event_listener );
}


/*
  sets the toolbar icon's badge text color
*/
cookiesAPI.browserAction.setBadgeTextColor(
  {
    color: "#ffffff"
  }
);


/*
  sets the toolbar icon's badge text background color
*/
cookiesAPI.browserAction.setBadgeBackgroundColor(
  {
    color: "#000000"
  }
);


/*
  initial call to the Listener 'cookie_event_listener', so we don't need to wait
  for the event from cookies.onChanged
*/
cookie_event_listener( {} );

browser.runtime.onMessage.addListener((request) => {
  if (request.msg === 'get_api') {
    return Promise.resolve(
      {
        api: cookiesAPI,
      }
    );
  }
});