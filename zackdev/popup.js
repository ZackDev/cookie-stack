class Helper {
  static unique_string( str ) {
    let u_str = '';
    for ( let i = 0; i < str.length; i++ ) {
      u_str += str.charCodeAt( i );
    }
    return u_str;
  }
}


class Stack {
  constructor( display ) {
    this.cookies = [];
    this.display = display;
  }

  add_cookie( cookie ) {
    var stack_cookie = new StackCookie( cookie );
    this.cookies.push( stack_cookie );
    this.display.on_cookie_added( stack_cookie );
  }

  remove_cookie( cookie ) {
    var cookie_index = this.get_cookie_index( cookie );
    var stack_cookie = '';
    if ( cookie_index >= 0 ) {
      stack_cookie = this.cookies[ cookie_index ];
    }
    else if ( cookie_index === -1 ) {
      stack_cookie = new StackCookie( cookie );
    }
    this.remove_cookie_from_cookies( cookie );
    this.display.on_cookie_removed( stack_cookie );
  }

  remove_cookie_from_cookies( cookie ) {
    var cookie_index = this.get_cookie_index( cookie );
    this.cookies.splice( cookie_index , 1 );
  }

  get_cookie_index( cookie ) {
    var cookie_index = -1;
    for ( let i = 0; i < this.cookies.length; i++ ) {
      var stack_cookie = this.cookies[i];
      if ( cookie.secure === stack_cookie.cookie.secure && cookie.domain === stack_cookie.cookie.domain && cookie.path === stack_cookie.cookie.path && cookie.name === stack_cookie.cookie.name ) {
        cookie_index = i;
        break
      }
    }
    return cookie_index;
  }

  get_cookie_index_by_u_cookie_str( u_cookie_str ){
    var index = -1;
    for ( let i = 0; i < this.cookies.length; i++ ) {
      if ( this.cookies[i].unique_cookie_string() === u_cookie_str) {
        index = i;
        break;
      }
    }
    return index;
  }

  get_cookie_by_index( index ) {
    return this.cookies[index];
  }
}


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
    this.display_version();
  }

  on_cookie_added( stack_cookie ) {
    var cookie_domain = $( `.cookie-domain.${stack_cookie.unique_domain_string()}` );
    if ( cookie_domain.length === 0 ) {
      this.content_root.append( this.create_cookie_domain_html( stack_cookie ) );
    }
    var cookie_wrap = $( `#cookie-wrap-${stack_cookie.unique_domain_string()}` );
    cookie_wrap.append( this.create_cookie_html( stack_cookie ) );
    this.add_message( `cookie "${stack_cookie.cookie.domain}${stack_cookie.cookie.path}${stack_cookie.cookie.name}" added.` );
  }

  on_cookie_removed( stack_cookie ) {
    $( `#${stack_cookie.unique_cookie_string()}` ).remove();
    let cookies = $( `.cookie.${stack_cookie.unique_domain_string()}` );
    if ( cookies.length === 0 ) {
      $( `.cookie-domain.${stack_cookie.unique_domain_string()}` ).remove();
    }
    this.add_message( `cookie "${stack_cookie.cookie.domain}${stack_cookie.cookie.path}${stack_cookie.cookie.name}" removed.` );
  }

  create_cookie_html( stack_cookie ) {
    var u_domain_str = stack_cookie.unique_domain_string();
    var u_cookie_str = stack_cookie.unique_cookie_string();
    var cookie_html = "";
    cookie_html += `<div id="${u_cookie_str}" class="cookie ${u_domain_str}">`;
    cookie_html += `<div class="cookie-action"><button type="button" id="${u_cookie_str}" class="trash btn btn-secondary btn-sm bi bi-trash"></button></div>`;
    cookie_html += `<div class="attribute-row border-bottom"><span class="attribute-name">path &amp; name</span><span class="attribute">${stack_cookie.cookie.path}${stack_cookie.cookie.name}</span></div>`;
    cookie_html += `<div class="attribute-row border-bottom"><span class="attribute-name">secure</span><span class="attribute ${StackCookieDisplay.check_or_x(stack_cookie.cookie.secure)}"></span></div>`;
    cookie_html += `<div class="attribute-row border-bottom"><span class="attribute-name">session</span><span class="attribute ${StackCookieDisplay.check_or_x(stack_cookie.cookie.session)}"></span></div>`;
    cookie_html += `<div class="attribute-row border-bottom"><span class="attribute-name">host only</span><span class="attribute ${StackCookieDisplay.check_or_x(stack_cookie.cookie.hostOnly)}"></span></div>`;
    cookie_html += `<div class="attribute-row border-bottom"><span class="attribute-name">http only</span><span class="attribute ${StackCookieDisplay.check_or_x(stack_cookie.cookie.httpOnly)}"></span></div>`;
    cookie_html += `<div class="attribute-row border-bottom"><span class="attribute-name">same site</span><span class="attribute">${stack_cookie.cookie.sameSite}</span></div>`;
    cookie_html += `<div class="attribute-row border-bottom"><span class="attribute-name">expiration date</span><span class="attribute">${stack_cookie.cookie.expirationDate}</span></div>`;
    cookie_html += `<div class="attribute-row border-bottom"><span class="attribute-name">first party domain</span><span class="attribute">${stack_cookie.cookie.firstPartyDomain}</span></div>`;
    cookie_html += `<div class="attribute-row border-bottom"><span class="attribute-name">store id</span><span class="attribute">${stack_cookie.cookie.storeId}</span></div>`;
    cookie_html += `<div class="attribute-row border-bottom"><span class="attribute">${stack_cookie.cookie.value}</span></div>`;
    cookie_html += `</div>`;
    return cookie_html;
  }

  create_cookie_domain_html( stack_cookie ) {
    var u_domain_str = stack_cookie.unique_domain_string();
    var cookie_domain_html = "";
    cookie_domain_html += `<div class="cookie-domain border-top ${u_domain_str}"><span class="attribute">${stack_cookie.cookie.domain}</span><button type="button" id="${u_domain_str}" class="details btn btn-secondary btn-sm bi bi-arrow-down" data-toggle="collapse" data-target="#cookie-wrap-${u_domain_str}"></button></div>`;
    cookie_domain_html += `<div id="cookie-wrap-${u_domain_str}" class="cookie-wrap collapse"></div>`;
    return cookie_domain_html;
  }

  add_message( msg ) {
    this.messages.push( msg );
    this.display_message();
  }

  display_message() {
    if ( this.displaying_message === false) {
      if ( this.messages.length > 0 ) {
        var message = this.messages[0];
        this.displaying_message = true;
        var message_div = $( '#message' );
        message_div.html( message );
        message_div.fadeIn( 500, function() {
          $( this ).fadeOut( 2500 );
        });
        setTimeout(function() {
          this.messages.shift();
          this.displaying_message = false;
          if ( this.messages.length > 0) {
            this.display_message();
          }
        }.bind( this ) , 4000);
      }
    }
  }

  display_version() {
    var version_str = browser.runtime.getManifest().version;
    $( '#version' ).html( [ 'version' , version_str ].join( ' ' ) );
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

function init() {
  var display = new StackCookieDisplay( $( '#content') );
  this.stack = new Stack( display );
  browser.cookies.onChanged.removeListener( on_cookie_changed_listener );
  browser.cookies.onChanged.addListener( on_cookie_changed_listener );

  var get_all_cookies = browser.cookies.getAll( {} );
  get_all_cookies.then( add_all_cookies );
  $( window ).click( function( e ) {
    if ( e.target.type === "button" ) {
      if ( e.target.classList ) {
        for ( var i = 0; i < e.target.classList.length; i++ ) {
          var class_name = e.target.classList[i];
          if ( class_name === "trash" ) {
            var u_cookie_str = e.target.id;
            var cookie_index = this.stack.get_cookie_index_by_u_cookie_str( u_cookie_str );
            var stack_cookie = this.stack.get_cookie_by_index( cookie_index );
            var remove_cookie = browser.cookies.remove(
              {
                url: stack_cookie.url(),
                name: stack_cookie.cookie.name
              }
            );
            remove_cookie.then( on_cookie_removed , on_cookie_remove_error );
            break;
          }
          else if ( class_name === "bi-arrow-down" ) {
            var button = $( `.btn#${e.target.id}` );
            button.removeClass( 'bi-arrow-down' );
            button.addClass( 'bi-arrow-up' );
            break;
          }
          else if ( class_name === "bi-arrow-up" ) {
            var button = $( `.btn#${e.target.id}` );
            button.removeClass( 'bi-arrow-up' );
            button.addClass( 'bi-arrow-down' );
            break;
          }
        }
      }
    }
  });
}

function add_all_cookies( cookies ) {
  cookies.sort( compare_cookies );
  for (let i = 0; i < cookies.length; i++) {
    this.stack.add_cookie( cookies[i] );
  }
}

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

function on_cookie_removed( cookie ) {
  //stub: handling is done by cookies.onChanged(...)
}

function on_cookie_remove_error( error ) {
  console.log( error );
}

$( document ).ready( function() {
  init();
});
