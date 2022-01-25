# Cookie Stack

A Firefox browser extension for viewing and deleting cookies.

# How to enable the extension:

* point the browser to `about:debugging#/runtime/this-firefox`
* click `Load Temporary Add-On`
* select `manifest.json` file from `cookie-stack`'s root directory

* if your browser is in private mode, go to `about:addons`, and allow `Cookie Stack` to run in private windows

# How to use the extension:

The add-on adds an icon to the toolbar of your browser, displaying the number of cookies currently set.

![Screenshot](./zackdev/extension-screenshot.png)

* Click the toolbar icon to get an overview of domains they belong to
* Expand or contract those domains by clicking the down or up facing arrow to view specific cookies
* Delete a cookie by clicking the trash icon

## Issues:

Cookies, whose url (domain + path) isn't fully recontructible by the cookies returned by `browser.coolies.getAll({})` API call, can't be removed by this extension.