const cookie_event_listener = function cookie_event_listener( change_event ) {
  var get_all_cookies = browser.cookies.getAll( {} );
  get_all_cookies.then( update_action_text );
};

const update_action_text = function update_action_text( cookies ) {
  var num_cookies = String( cookies.length );
  browser.browserAction.setBadgeText(
    {
      "text": num_cookies
    }
  );
}

if ( !browser.cookies.onChanged.hasListener( cookie_event_listener ) ) {
  browser.cookies.onChanged.addListener( cookie_event_listener );
}

browser.browserAction.setBadgeTextColor(
  {
    color: "#ffffff"
  }
);

browser.browserAction.setBadgeBackgroundColor(
  {
    color: "#000000"
  }
);

cookie_event_listener( {} );
