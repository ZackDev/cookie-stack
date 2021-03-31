/*
  Listener for cooke change events
  - fetches all cookies from the browser's store
  - then calls the update_action_text() function
*/
const cookie_event_listener = ( change_event ) => {
  var get_all_cookies = browser.cookies.getAll( {} );
  get_all_cookies.then( update_action_text );
};


/*
  updates the toolbar icon's badge text with the current number of cookies passed
*/
const update_action_text = ( cookies ) => {
  var num_cookies = String( cookies.length );
  browser.browserAction.setBadgeText(
    {
      "text": num_cookies
    }
  );
}


/*
  adds the Listener 'cookie_event_listener' to the cookies.onChanged event
*/
if ( !browser.cookies.onChanged.hasListener( cookie_event_listener ) ) {
  browser.cookies.onChanged.addListener( cookie_event_listener );
}


/*
  sets the toolbar icon's badge text color
*/
browser.browserAction.setBadgeTextColor(
  {
    color: "#ffffff"
  }
);


/*
  sets the toolbar icon's badge text background color
*/
browser.browserAction.setBadgeBackgroundColor(
  {
    color: "#000000"
  }
);


/*
  initial call to the Listener 'cookie_event_listener', so we don't need to wait
  for the event from cookies.onChanged
*/
cookie_event_listener( {} );
