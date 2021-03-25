function got_scramble_domains( scramble_domains ) {
  console.log( 'got_scramble_domains():' );
  console.log( scramble_domains );
  console.log( Object.entries( scramble_domains ).length );
}

function on_storage_error( error ) {
  console.log( 'on_storage_error():' );
  console.log( error );
}

function init() {
  browser.storage.local.get( "scramble_domains" ).then( got_scramble_domains , on_storage_error );
}

$( document ).ready( function() {
  init();
});
