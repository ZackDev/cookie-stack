# Cookie Stack

A Firefox/Chromium extension for viewing and deleting cookies.

**NOTE**: cookies may contain sensitive information

# How to enable the extension:

## Firefox
* point the browser to `about:debugging#/runtime/this-firefox`
* tap the `Load Temporary Add-On` button
* select `manifest.json` file from `cookie-stack`'s root directory

* if firefox is in private mode, go to `about:addons`, and allow `Cookie Stack` to run in private windows

## Chromium
* point the browser to `chrome://extensions/`
* tap the `Load Unpacked` button
* select `cookie-stack`'s root directory

* if chromium is in Incognito Mode, go to the extensions settings, and switch on `allow in incognito`

# How to use the extension:

The extension adds two funtionalities to the browser:

## View and remove cookies

Access it by clicking the icon at the toolbar of your browser, displaying the number of cookies currently set.

![Screenshot](./extension-screenshot.png)

* click the toolbar icon to get an overview of domains they belong to
* expand or contract those domains by clicking the down or up facing arrow to view specific cookies
* delete a cookie by clicking the trash icon

## Automatically filter incoming cookies by domain

* go to the preferences (firefox), options (chromium) to view, edit and set the active filter
* *disabled*: no filter gets applied
* *allowlist*: allow every cookie on the list, remove the rest
* *denylist*: deny every cookie specified, allow the rest

**NOTE**: This doesn't prevent cookies from getting initially stored. The filter gets applied *afterwards*. Some websites continuosly try to store cookies on your machine, even after the first pageload. This might cause the filter also to continuosly remove said cookies.

# Issues:

**firefox**:
* cookies, whose url (domain + path) isn't fully recontructible by the cookies returned by `browser.coolies.getAll({})` API call, can't be removed by this extension.
