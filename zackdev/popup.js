/*
  Helper class
  - static unique_string( str )
  -- returns the concatenated ascii-number representation of the passed string
  -- solely for generating valid jquery selectors from strings that contain special
  -- characters like '.' and '#'
  - negative example 'github.com' as selector would select tags named 'github' with class 'com'
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
      stack_cookie = new_stack_cookie;
    }
    this.cookies.delete( stack_cookie.unique_cookie_string() );
    this.display.on_cookie_removed( stack_cookie );
  }

  get_cookie( key ) {
    return this.cookies.get( key );
  }
}

/*
  StackCookie class
  - wrapper class for cookies provided by the cookies.onChanged event
  - adds functionality that is used by Stack and StackCookieDisplay
*/
class StackCookie {
  constructor( cookie ) {
    this.cookie = cookie;
  }

  unique_cookie_string() {
    let u_str = '';
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

  domain() {
    let domain_str = ''
    domain_str += `${this.cookie.domain}`;
    return domain_str;
  }
}


/*
  StackCookieDisplay class
  - responsible for DOM manipulation
  -- adding and removing cookies
  -- displaying cookie values
  -- handling trash and details button clicks
  -- displaying messages, version and a link to the homepage
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
    this.domain_state = new Map();
    this.set_version();
    this.set_homepage_link();
  }

  set_stack( stack ) {
    this.stack = stack;
  }

  set_version() {
    var version_str = browser.runtime.getManifest().version;
    $( '#version' ).html( [ 'version' , version_str ].join( ' ' ) );
  }

  set_homepage_link() {
    var homepage_url = browser.runtime.getManifest().homepage_url;
    $( '#homepage-link' ).attr( 'href' , homepage_url );
  }

  // creates and adds 'cookie-domain' div to the DOM if it is the first cookie for this domain
  // creates and adds 'cookie-wrap' and appends it to an already existing or previously created domain
  on_cookie_added( stack_cookie ) {
    console.log( 'StackCookieDisplay.on_cookie_added()');
    console.log( stack_cookie );

    var domain_wrap = $( `#domain-wrap-${stack_cookie.unique_domain_string()}` );
    // domain-wrap doesn't exist
    if ( domain_wrap.length === 0 ) {
      // set the domain state to it's default, 'not collapsed'
      console.log( 'StackCookieDisplay.on_cookie_added(): setting domain state');
      this.domain_state.set( stack_cookie.unique_domain_string() ,
        {
          collapsed: false
        }
      );
      console.log( 'StackCookieDisplay.on_cookie_added(): domain_wrap doesnt exist, going through which to insert to.');
      var domain_added = false;
      var all_domain_wraps = $( '.domain-wrap' );
      for (let i = 0; i < all_domain_wraps.length; i++) {
        var compare_wrap = $( all_domain_wraps[ i ]);
        var compare_wrap_domain = $( compare_wrap ).attr( 'domain' );
        console.log( 'StackCookieDisplay.on_cookie_added(): comparing cookie domain to existing domain:');
        console.log( stack_cookie.domain() );
        console.log( compare_wrap_domain );
        if (stack_cookie.domain() < compare_wrap_domain ) {

          console.log( 'StackCookieDisplay.on_cookie_added(): prepending domain-wrap');
          $( all_domain_wraps[ i ] ).before( this.create_domain_wrap_html( stack_cookie ) );
          domain_added = true;
          break;
        }
      }
      if ( domain_added === false ) {
        console.log( 'StackCookieDisplay.on_cookie_added(): appending domain-wrap to content_root ');
        this.content_root.append( this.create_domain_wrap_html( stack_cookie ) );
      }
      //this.content_root.append( this.create_domain_wrap_html( stack_cookie ) );
    }
    var cookie_wrap = $( `#cookie-wrap-${stack_cookie.unique_domain_string()}` );
    console.log( 'StackCookieDisplay.on_cookie_added(): adding cookie to cookie_wrap:');
    console.log( cookie_wrap );
    cookie_wrap.append( this.create_cookie_html( stack_cookie ) );

    this.add_message( `cookie "${stack_cookie.cookie.domain}${stack_cookie.cookie.path}${stack_cookie.cookie.name}" added.` );
  }

  // removes a single cookie from the DOM
  // removes 'cookie-domain' from DOM if there are no more cookies in it
  on_cookie_removed( stack_cookie ) {
    console.log( 'StackCookieDisplay.on_cookie_removed(): removing cookie.' );
    console.log( stack_cookie );
    $( `#cookie-${stack_cookie.unique_cookie_string()}` ).remove();
    let cookies = $( `.cookie.${stack_cookie.unique_domain_string()}` );
    if ( cookies.length === 0 ) {
      console.log( 'StackCookieDisplay.on_cookie_removed(): removing domain-wrap' );
      $( `#domain-wrap-${stack_cookie.unique_domain_string()}` ).remove();
      this.domain_state.delete( stack_cookie.unique_domain_string() );
    }
    this.add_message( `cookie "${stack_cookie.cookie.domain}${stack_cookie.cookie.path}${stack_cookie.cookie.name}" removed.` );
  }

  // creates HTML string for a specific cookie, including the cookie values provided
  create_cookie_html( stack_cookie ) {
    var u_domain_str = stack_cookie.unique_domain_string();
    var u_cookie_str = stack_cookie.unique_cookie_string();
    var cookie_div = $( '<div></div>');
    cookie_div.attr( 'id' , `cookie-${u_cookie_str}`);
    cookie_div.addClass( [ 'cookie' , `${u_domain_str}` ] );

    var cookie_action_div = $( '<div></div>' );
    cookie_action_div.addClass( 'cookie-action' );

    var trash_button = $( '<button></button>' );
    trash_button.attr( 'id' , `trash-button-${u_cookie_str}` );
    trash_button.attr( 'type' , 'button' );
    trash_button.addClass( [ 'btn' , 'btn-secondary' , 'btn-sm' , 'bi' , 'bi-trash' ] );
    trash_button.click( this , function( event ) {
      console.log( 'StackCookieDisplay: trash button clicked.' );
      var u_cookie_id = this.id.replace( 'trash-button-' , '' );
      var stack_cookie = event.data.stack.get_cookie( u_cookie_id );
      console.log( stack_cookie );
      console.log( stack_cookie.url() );
      var remove = browser.cookies.remove(
        {
          url: stack_cookie.url(),
          name: stack_cookie.cookie.name
        }
      );
    });
    cookie_action_div.append( trash_button );
    cookie_div.append( cookie_action_div );

    // path/name
    var attribute_row = $( '<div></div>' );
    attribute_row.addClass( [ 'attribute-row' , 'border-bottom' ] );
    var attribute_name = $( '<span></span>' );
    attribute_name.addClass( 'attribute-name' );
    attribute_name.text( 'path & name' );
    var attribute_value = $( '<span></span>');
    attribute_value.addClass( 'attribute-value' );
    attribute_value.text( `${stack_cookie.cookie.path}${stack_cookie.cookie.name}` );

    attribute_row.append( attribute_name );
    attribute_row.append( attribute_value );

    cookie_div.append( attribute_row );


    // secure
    var attribute_row = $( '<div></div>' );
    attribute_row.addClass( [ 'attribute-row' , 'border-bottom' ] );
    var attribute_name = $( '<span></span>' );
    attribute_name.addClass( 'attribute-name' );
    attribute_name.text( 'secure' );
    var attribute_value = $( '<span></span>');
    attribute_value.addClass( 'attribute-value' );
    attribute_value.addClass( `${StackCookieDisplay.check_or_x(stack_cookie.cookie.secure)}` );

    attribute_row.append( attribute_name );
    attribute_row.append( attribute_value );

    cookie_div.append( attribute_row );


    //session
    var attribute_row = $( '<div></div>' );
    attribute_row.addClass( [ 'attribute-row' , 'border-bottom' ] );
    var attribute_name = $( '<span></span>' );
    attribute_name.addClass( 'attribute-name' );
    attribute_name.text( 'session' );
    var attribute_value = $( '<span></span>');
    attribute_value.addClass( 'attribute-value' );
    attribute_value.addClass( `${StackCookieDisplay.check_or_x(stack_cookie.cookie.session)}` );

    attribute_row.append( attribute_name );
    attribute_row.append( attribute_value );

    cookie_div.append( attribute_row );


    //host host only
    var attribute_row = $( '<div></div>' );
    attribute_row.addClass( [ 'attribute-row' , 'border-bottom' ] );
    var attribute_name = $( '<span></span>' );
    attribute_name.addClass( 'attribute-name' );
    attribute_name.text( 'host only' );
    var attribute_value = $( '<span></span>');
    attribute_value.addClass( 'attribute-value' );
    attribute_value.addClass( `${StackCookieDisplay.check_or_x(stack_cookie.cookie.hostOnly)}` );

    attribute_row.append( attribute_name );
    attribute_row.append( attribute_value );

    cookie_div.append( attribute_row );


    //http only
    var attribute_row = $( '<div></div>' );
    attribute_row.addClass( [ 'attribute-row' , 'border-bottom' ] );
    var attribute_name = $( '<span></span>' );
    attribute_name.addClass( 'attribute-name' );
    attribute_name.text( 'http only' );
    var attribute_value = $( '<span></span>');
    attribute_value.addClass( 'attribute-value' );
    attribute_value.addClass( `${StackCookieDisplay.check_or_x(stack_cookie.cookie.httpOnly)}` );

    attribute_row.append( attribute_name );
    attribute_row.append( attribute_value );

    cookie_div.append( attribute_row );


    //same site
    var attribute_row = $( '<div></div>' );
    attribute_row.addClass( [ 'attribute-row' , 'border-bottom' ]);
    var attribute_name = $( '<span></span>' );
    attribute_name.addClass( 'attribute-name' );
    attribute_name.text( 'same site' );
    var attribute_value = $( '<span></span>');
    attribute_value.addClass( 'attribute-value' );
    attribute_value.text( `${stack_cookie.cookie.sameSite}` );

    attribute_row.append( attribute_name );
    attribute_row.append( attribute_value );

    cookie_div.append( attribute_row );


    //expiration date
    var attribute_row = $( '<div></div>' );
    attribute_row.addClass( [ 'attribute-row' , 'border-bottom' ] );
    var attribute_name = $( '<span></span>' );
    attribute_name.addClass( 'attribute-name' );
    attribute_name.text( 'expiration date' );
    var attribute_value = $( '<span></span>');
    attribute_value.addClass( 'attribute-value' );
    attribute_value.text( `${stack_cookie.cookie.expirationDate}` );

    attribute_row.append( attribute_name );
    attribute_row.append( attribute_value );

    cookie_div.append( attribute_row );


    //first party domain
    var attribute_row = $( '<div></div>' );
    attribute_row.addClass( [ 'attribute-row' , 'border-bottom' ] );
    var attribute_name = $( '<span></span>' );
    attribute_name.addClass( 'attribute-name' );
    attribute_name.text( 'first party domain' );
    var attribute_value = $( '<span></span>');
    attribute_value.addClass( 'attribute-value' );
    attribute_value.text( `${stack_cookie.cookie.firstPartyDomain}` );

    attribute_row.append( attribute_name );
    attribute_row.append( attribute_value );

    cookie_div.append( attribute_row );


    //store id
    var attribute_row = $( '<div></div>' );
    attribute_row.addClass( [ 'attribute-row' , 'border-bottom' ] );
    var attribute_name = $( '<span></span>' );
    attribute_name.addClass( 'attribute-name' );
    attribute_name.text( 'store id' );
    var attribute_value = $( '<span></span>');
    attribute_value.addClass( 'attribute-value' );
    attribute_value.text( `${stack_cookie.cookie.storeId}` );

    attribute_row.append( attribute_name );
    attribute_row.append( attribute_value );

    cookie_div.append( attribute_row );


    //value
    var attribute_row = $( '<div></div>' );
    attribute_row.addClass( [ 'attribute-row' , 'border-bottom' ] );
    var attribute_value = $( '<span></span>');
    attribute_value.addClass( 'attribute-value' );
    attribute_value.text( `${stack_cookie.cookie.value}` );

    attribute_row.append( attribute_value );

    cookie_div.append( attribute_row );

    return cookie_div;
  }

  // creates HTML string for a specific domain with the corresponding collapse button
  create_domain_wrap_html( stack_cookie ) {
    console.log( 'StackCookieDisplay.create_domain_wrap_html()');

    var u_domain_str = stack_cookie.unique_domain_string();
    var domain_state = this.domain_state.get( u_domain_str );
    console.log( 'StackCookieDisplay.create_domain_wrap_html(): domain_state');
    console.log( domain_state );
    var collapse_class = '';
    if ( domain_state.collapsed === true ) {
      collapse_class = 'show' ;
    }
    console.log( 'StackCookieDisplay.create_domain_wrap_html(): creating html elements');
    var cookie_domain_div = $( '<div></div>' );
    cookie_domain_div.attr( 'id' , `cookie-domain-${u_domain_str}` );
    cookie_domain_div.addClass( [ 'cookie-domain' , 'border-top' ] );

    var domain_info_div = $( '<div></div>');

    var secure_badge = $( '<span></span>' );
    secure_badge.addClass( [ 'badge' , 'badge-light' ] );
    secure_badge.addClass( `${StackCookieDisplay.check_or_x(stack_cookie.cookie.secure)}` );
    secure_badge.text( 'secure' );

    var domain_name = $( '<span></span>' );
    domain_name.addClass( 'attribute-value' );
    domain_name.text( `${stack_cookie.cookie.domain}` );

    var details_button = $( '<button></button>' );
    details_button.attr( 'type' , 'button' );
    details_button.attr( 'id' , `details-button-${u_domain_str}`);
    details_button.attr( 'data-toogle' , 'collapse' );
    details_button.attr( 'data-target' , `#cookie-wrap-${u_domain_str}` );
    details_button.addClass( [ 'details' , 'btn' , 'btn-secondary' , 'btn-sm' , 'bi' , 'bi-arrow-down' ] );
    details_button.click( this, function( event ) {
      var collapsed = false;
      if ( $( this ).hasClass( 'bi-arrow-up' ) ) {
        collapsed = false;
        $( this ).removeClass( 'bi-arrow-up' );
        $( this ).addClass( 'bi-arrow-down' );
      }
      else if ( $( this ).hasClass( 'bi-arrow-down' ) ) {
        collapsed = true;
        $( this ).removeClass( 'bi-arrow-down' );
        $( this ).addClass( 'bi-arrow-up' );
      }

      var collapse_target_id = $( this ).attr( 'data-target' );
      $( collapse_target_id ).collapse( 'toggle' );
      console.log( 'StackCookieDisplay: details button clicked.' );
      event.data.domain_state.set( stack_cookie.unique_domain_string() ,
        {
          collapsed: collapsed
        }
      );
    });

    domain_info_div.append( secure_badge );
    domain_info_div.append( domain_name );

    cookie_domain_div.append( domain_info_div);
    cookie_domain_div.append( details_button );

    var cookie_wrap_div = $( '<div></div>' );
    cookie_wrap_div.attr( 'id' , `cookie-wrap-${u_domain_str}` );
    cookie_wrap_div.addClass( [ 'cookie-wrap' , 'collapse' ] );
    cookie_wrap_div.addClass( `${collapse_class}` );



    var ret = $( '<div></div>' );
    ret.addClass( 'domain-wrap' );
    ret.attr( 'id' , `domain-wrap-${u_domain_str}` );
    ret.attr( 'domain' , `${stack_cookie.domain()}` )
    ret.append( cookie_domain_div );
    ret.append( cookie_wrap_div );

    console.log( 'StackCookieDisplay.create_cookie_domain_html():' );
    console.log( ret );

    return ret;

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
  console.log( 'cookie event caught.' );
  console.log( cookie_event );

  if ( cookie_event.removed === true ) {
    this.stack.remove_cookie( cookie_event.cookie );
  }
  else if ( cookie_event.removed === false ) {
    this.stack.add_cookie( cookie_event.cookie );
  }
  /*
  // cookie got overwritten by a new one
  if ( cookie_event.cause === 'overwrite' ) {
    console.log( 'handling cookie event "overwrite". adding cookie.' );
    this.stack.overwrite_cookie( cookie_event.cookie );
  }

  // cookie got explicitly added or removed
  else if ( cookie_event.cause === 'explicit' ) {
    if ( cookie_event.removed === true ) {
      console.log( 'handling cookie event "explicit". removing cookie.' );
      this.stack.remove_cookie( cookie_event.cookie );

    }
    else if ( cookie_event.removed === false ) {
      console.log( 'handling cookie event "explicit". adding cookie.' );
      this.stack.add_cookie( cookie_event.cookie );
    }
  }

  // cookie got collected by the GC
  else if ( cookie_event.cause === 'evicted' ) {
    console.log( 'handling cookie event "evicted". removing cookie.' );
    this.stack.remove_cookie( cookie_event.cookie );
  }

  // cookie expired
  else if ( cookie_event.cause === 'expired' ) {
    console.log( 'handling cookie event "expired". removing cookie.');
    this.stack.remove_cookie( cookie_event.cookie);
  }

  */
}



function init() {
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
  for (let i = 0; i < cookies.length; i++) {
    this.stack.add_cookie( cookies[i] );
  }
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
