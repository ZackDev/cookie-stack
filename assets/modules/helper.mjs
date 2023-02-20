export { Helper }

/*
  Helper
  - uniquString( str )
  -- returns the concatenated ascii-number representation of the passed string
  -- solely for generating valid HTML-Element selectors from strings that contain special
  -- characters like '.' and '#'
  -- negative example 'github.com' as selector would select tags named 'github' with class 'com'
  
  - checkOrX( b )
  -- returns HTML-glyph '&check;' or '&cross;', based on the parameter b
*/

const Helper = {
    uniqueString(str) {
        let u_str = '';
        for (let c of str) {
            u_str += c.charCodeAt(0);
        }
        return u_str;
    },
    checkOrX(bool) {
        return bool ? '&check;' : '&cross;';
    }
}
