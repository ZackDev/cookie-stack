/*
  Helper class
  - static unique_string( str )
  -- returns the concatenated ascii-number representation of the passed string
  -- solely for generating valid jquery selectors from strings that contain special
  -- characters like '.' and '#'
*/
class Helper {
  static unique_string( str ) {
    let u_str = '';
    for ( let i = 0; i < str.length; i++ ) {
      u_str += str.charCodeAt( i );
    }
    return u_str;
  }
}

/*
  Stack class
  manages the cookies indicated by the cookies.onChanged events and informs the
  StackCookieDisplay
*/
class Stack {
  constructor( display ) {
    this.cookies = new Map();
    this.display = display;
  }

  add_cookie( cookie ) {
    var stack_cookie = new StackCookie( cookie );
    this.cookies.set( stack_cookie.unique_cookie_string() , stack_cookie );
    this.display.on_cookie_added( stack_cookie );
  }

  remove_cookie( cookie ) {
    var new_stack_cookie = new StackCookie( cookie );
    var stack_cookie = this.get_cookie( new_stack_cookie.unique_cookie_string() );
    if ( stack_cookie === undefined ) {
      stack_cookie = new StackCookie( cookie );
    }
    this.cookies.delete( stack_cookie );
    this.display.on_cookie_removed( stack_cookie );
  }

  get_cookie( key ) {
    return this.cookies.get( key );
  }
}

/*
  StackCookie class
  - wrapper class for cookies provided by the cookies.onChanged event
  - adds functionality that is used by StackCookieDisplay
*/
class StackCookie {
  constructor( cookie ) {
    this.cookie = cookie;
  }

  unique_cookie_string() {
    let u_str = '';
    this.cookie.secure ? u_str = "https://" : u_str = "http://";
    u_str += this.cookie.domain;
    u_str += this.cookie.path;
    u_str += this.cookie.name;
    return Helper.unique_string( u_str );
  }

  unique_domain_string() {
    let u_str = '';
    this.cookie.secure ? u_str = "https://" : u_str = "http://";
    u_str += this.cookie.domain;
    return Helper.unique_string( u_str );
  }

  url() {
    let url_str = ''
    this.cookie.secure ? url_str = 'https://' : url_str = 'http://';
    url_str += `${this.cookie.domain}${this.cookie.path}`;
    return url_str;
  }
}


/*
  StackCookieDisplay class
  - responsible for DOM manipulation
  -- adding and removing cookies
  -- displaying cookie values
  -- displaying messages
*/
class StackCookieDisplay {
  static check_or_x( true_false ) {
    if ( true_false === true ) {
      return 'bi bi-check';
    }
    else if (true_false === false ) {
      return 'bi bi-x';
    }
  }

  constructor( content_root ) {
    this.content_root = content_root;
    this.messages = [];
    this.displaying_message = false;
  }

  set_stack( stack ) {
    this.stack = stack;
  }

  // creates and adds 'cookie-domain' div to the DOM if it is the first cookie for this domain
  // creates and adds 'cookie-wrap' and appends it to an already existing or previously created domain
  on_cookie_added( stack_cookie ) {
    var cookie_domain = $( `.cookie-domain.${stack_cookie.unique_domain_string()}` );
    if ( cookie_domain.length === 0 ) {
      this.content_root.append( this.create_cookie_domain_html( stack_cookie ) );
      var details_button = $( `#details-button-${stack_cookie.unique_domain_string()}` );
      details_button.click( function() {
        if ( $( this ).hasClass( 'bi-arrow-up' ) ) {
          $( this ).removeClass( 'bi-arrow-up' );
          $( this ).addClass( 'bi-arrow-down' );
        }
        else if ( $( this ).hasClass( 'bi-arrow-down' ) ) {
          $( this ).removeClass( 'bi-arrow-down' );
          $( this ).addClass( 'bi-arrow-up' );
        }
      });
    }
    var cookie_wrap = $( `#cookie-wrap-${stack_cookie.unique_domain_string()}` );
    cookie_wrap.append( this.create_cookie_html( stack_cookie ) );
    var trash_button = $( `#trash-button-${stack_cookie.unique_cookie_string()}` );
    trash_button.click( this , function( event ) {
      var u_cookie_id = this.id.replace( 'trash-button-' , '' );
      var stack_cookie = event.data.stack.get_cookie(u_cookie_id);
      browser.cookies.remove(
        {
          url: stack_cookie.url(),
          name: stack_cookie.cookie.name
        }
      );
    });
    this.add_message( `cookie "${stack_cookie.cookie.domain}${stack_cookie.cookie.path}${stack_cookie.cookie.name}" added.` );
  }

  // removes a single cookie from the DOM
  // removes 'cookie-domain' from DOM if there are no more cookies in it
  on_cookie_removed( stack_cookie ) {
    $( `#cookie-${stack_cookie.unique_cookie_string()}` ).remove();
    let cookies = $( `.cookie.${stack_cookie.unique_domain_string()}` );
    if ( cookies.length === 0 ) {
      $( `.cookie-domain.${stack_cookie.unique_domain_string()}` ).remove();
    }
    this.add_message( `cookie "${stack_cookie.cookie.domain}${stack_cookie.cookie.path}${stack_cookie.cookie.name}" removed.` );
  }

  // creates HTML string for a specific cookie, including the cookie values provided
  create_cookie_html( stack_cookie ) {
    var u_domain_str = stack_cookie.unique_domain_string();
    var u_cookie_str = stack_cookie.unique_cookie_string();
    var cookie_html = "";
    cookie_html += `<div id="cookie-${u_cookie_str}" class="cookie ${u_domain_str}">`;
    cookie_html += `<div class="cookie-action"><button type="button" id="trash-button-${u_cookie_str}" class="btn btn-secondary btn-sm bi bi-trash"></button></div>`;
    cookie_html += `<div class="attribute-row border-bottom"><span class="attribute-name">path &amp; name</span><span class="attribute-value">${stack_cookie.cookie.path}${stack_cookie.cookie.name}</span></div>`;
    cookie_html += `<div class="attribute-row border-bottom"><span class="attribute-name">secure</span><span class="attribute-value ${StackCookieDisplay.check_or_x(stack_cookie.cookie.secure)}"></span></div>`;
    cookie_html += `<div class="attribute-row border-bottom"><span class="attribute-name">session</span><span class="attribute-value ${StackCookieDisplay.check_or_x(stack_cookie.cookie.session)}"></span></div>`;
    cookie_html += `<div class="attribute-row border-bottom"><span class="attribute-name">host only</span><span class="attribute-value ${StackCookieDisplay.check_or_x(stack_cookie.cookie.hostOnly)}"></span></div>`;
    cookie_html += `<div class="attribute-row border-bottom"><span class="attribute-name">http only</span><span class="attribute-value ${StackCookieDisplay.check_or_x(stack_cookie.cookie.httpOnly)}"></span></div>`;
    cookie_html += `<div class="attribute-row border-bottom"><span class="attribute-name">same site</span><span class="attribute-value">${stack_cookie.cookie.sameSite}</span></div>`;
    cookie_html += `<div class="attribute-row border-bottom"><span class="attribute-name">expiration date</span><span class="attribute-value">${stack_cookie.cookie.expirationDate}</span></div>`;
    cookie_html += `<div class="attribute-row border-bottom"><span class="attribute-name">first party domain</span><span class="attribute-value">${stack_cookie.cookie.firstPartyDomain}</span></div>`;
    cookie_html += `<div class="attribute-row border-bottom"><span class="attribute-name">store id</span><span class="attribute-value">${stack_cookie.cookie.storeId}</span></div>`;
    cookie_html += `<div class="attribute-row border-bottom"><span class="attribute-value">${stack_cookie.cookie.value}</span></div>`;
    cookie_html += `</div>`;
    return cookie_html;
  }

  // creates HTML string for a specific domain with the corresponding collapse button
  create_cookie_domain_html( stack_cookie ) {
    var u_domain_str = stack_cookie.unique_domain_string();
    var cookie_domain_html = "";
    cookie_domain_html += `<div class="cookie-domain border-top ${u_domain_str}"><span class="attribute-value">${stack_cookie.cookie.domain}</span><button type="button" id="details-button-${u_domain_str}" class="details btn btn-secondary btn-sm bi bi-arrow-down" data-toggle="collapse" data-target="#cookie-wrap-${u_domain_str}"></button></div>`;
    cookie_domain_html += `<div id="cookie-wrap-${u_domain_str}" class="cookie-wrap collapse"></div>`;
    return cookie_domain_html;
  }

  add_message( msg ) {
    this.messages.push( msg );
    this.display_message();
  }

  /*
  sequentially displaying messages like 'cookie ... added' and 'cookie ... removed'
  - pseudo recursion of display_message() by setTimeout(...) if 'this.messages' contains elements
  - 'this.displaying_message' is true as long as the animation fadeIn() + fadeOut() is active
  - removes displayed messages from 'this.messages'
  */
  display_message() {
    if ( this.displaying_message === false ) {
      if ( this.messages.length > 0 ) {
        var message = this.messages[0];
        this.displaying_message = true;
        var message_div = $( '#message' );
        message_div.html( message );
        message_div.fadeIn( 500, function() {
          $( this ).fadeOut( 2500 );
        });
        setTimeout( function() {
          this.messages.shift();
          this.displaying_message = false;
          if ( this.messages.length > 0 ) {
            this.display_message();
          }
        }.bind( this ) , 4000);
      }
    }
  }
}

function on_cookie_changed_listener( cookie_event ) {
  if ( cookie_event.removed === true && cookie_event.cause === 'overwrite' ) {
    this.stack.remove_cookie( cookie_event.cookie );
  }
  else if (cookie_event.removed === false && cookie_event.cause === 'explicit' ) {
    this.stack.add_cookie( cookie_event.cookie );
  }
  else if (cookie_event.removed === true && cookie_event.cause === 'explicit' ) {
    this.stack.remove_cookie( cookie_event.cookie );
  }
}

function set_version() {
  var version_str = browser.runtime.getManifest().version;
  $( '#version' ).html( [ 'version' , version_str ].join( ' ' ) );
}

function init() {
  set_version();

  // creates StackCookieDisplay object with jquery DOM reference
  var display = new StackCookieDisplay( $( '#content') );

  // initializes Stack with a reference to the StackCookieDisplay created above
  this.stack = new Stack( display );

  display.set_stack( this.stack );

  // adds cookies.onChange listener
  if ( ! browser.cookies.onChanged.hasListener( on_cookie_changed_listener ) ) {
    browser.cookies.onChanged.addListener( on_cookie_changed_listener );
  }

  // gets all cookies from browser.cookies API and adds them to the Stack
  var get_all_cookies = browser.cookies.getAll( {} );
  get_all_cookies.then( add_all_cookies );
}

/*
  sorts and adds cookies to the stack
*/
function add_all_cookies( cookies ) {
  cookies.sort( compare_cookies );
  for (let i = 0; i < cookies.length; i++) {
    this.stack.add_cookie( cookies[i] );
  }
}

/*
  custom cookie sort function
*/
function compare_cookies( a , b ) {
  let comparison = 0;
  if ( a.domain > b.domain ) {
    comparison = 1;
  }
  else if ( a.domain < b.domain ) {
    comparison = -1;
  }
  return comparison;
}

/*
stub: handling is done by cookies.onChanged(...)
*/
function on_cookie_removed( cookie ) { }

function on_cookie_remove_error( error ) {
  console.log( error );
}

$( document ).ready( function() {
  init();
});
