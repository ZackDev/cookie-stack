import { CookiesAPI } from '/zackdev/modules.mjs';


const cookiesAPI = new CookiesAPI();


document.onreadystatechange = function () {
    if (document.readyState === "complete") {
        getFilter('allow')
            .then((r) => {
                onFilterRead(r);
            });

        getFilter('deny')
            .then((r) => {
                onFilterRead(r);
            });

        getFilterState()
            .then((r) => {
                let s = r.ss;
                switch (s) {
                    case 'allowlist':
                        document.getElementById('allow-list-radio').setAttribute('checked', 'checked');
                        break;
                    case 'denylist':
                        document.getElementById('deny-list-radio').setAttribute('checked', 'checked');
                        break;
                    case 'disabled':
                        document.getElementById('disable-radio').setAttribute('checked', 'checked');
                        break;
                }
            });


        cookiesAPI.storage.onChanged.addListener(onStorageUpdated);

        document.getElementById('allow-domain-form').addEventListener("submit", (event) => {
            event.preventDefault();
            let ta = document.getElementById('allow-input');
            updateFilter('allow', ta.value, 'add');
            ta.value = '';
        });

        document.getElementById('deny-domain-form').addEventListener("submit", (event) => {
            event.preventDefault();
            let td = document.getElementById('deny-input');
            updateFilter('deny', td.value, 'add');
            td.value = '';
        });

        document.getElementById('disable-radio').addEventListener("click", () => {
            setFilterState('disabled');
        });

        document.getElementById('allow-list-radio').addEventListener("click", () => {
            setFilterState('allowlist');
        });

        document.getElementById('deny-list-radio').addEventListener("click", () => {
            setFilterState('denylist');
        });

        document.getElementById('export-btn').addEventListener("click", () => {
            cookiesAPI.getValue(null)
                .then((r) => {
                    let settingsJson = JSON.stringify(r, undefined, 4);
                    let settingsFile = new File(
                        [settingsJson],
                        'cookie-stack-settings.json',
                        { type: 'application/json' }
                    );
                    let url = URL.createObjectURL(settingsFile);

                    let downloadProcess = cookiesAPI.downloads.download({
                        url: url,
                        filename: 'cookie-stack-settings.json',
                        saveAs: true
                    });
                    /*
                    downloadProcess.then(
                        (resolve) => {
                            URL.revokeObjectURL(url)
                        },
                        (reject) => {
                            URL.revokeObjectURL(url)
                        });
                    */
                })
        });

        document.getElementById('import-file-picker').addEventListener("change", (event) => {
            let files = event.target.files;
            if (files.length == 1) {
                let file = files[0];
                let content = file.text();
                content.then(
                    (resolve) => {
                        let jsonObject = JSON.parse(resolve);
                        if (jsonObject.ss && jsonObject.fa && jsonObject.fd) {
                            if (typeof jsonObject.ss === 'string' && Array.isArray(jsonObject.fa) && Array.isArray(jsonObject.fd)) {
                                console.log('import-file-picker:', 'writing settings from json file to localStorage');
                                cookiesAPI.storeValue({ ss: jsonObject.ss });
                                cookiesAPI.storeValue({ fa: jsonObject.fa });
                                cookiesAPI.storeValue({ fd: jsonObject.fd });
                            }
                            else {
                                console.info('import-file-picker:', 'selected json file has wrong property types');
                            }
                        }
                        else {
                            console.info('import-file-picker:', 'selected json file has missing keys');
                        }
                        event.target.value = '';
                    },
                    (reject) => {
                        console.error('import-file-picker:', 'error at calling text() on selected file:', reject);
                        event.target.value = '';
                    }
                );
            }
            else {
                if (files.length == 0) {
                    console.info('import-file-picker:', 'no file selected');
                }
                else if (files.length > 1) {
                    console.info('import-file-picker:', 'multiple files selected');
                }
            }

        });
    }
};


const switchCheckedRadio = (radio) => {
    let disableR = document.getElementById('disable-radio');
    let allowListR = document.getElementById('allow-list-radio');
    let denyListR = document.getElementById('deny-list-radio');

    disableR.removeAttribute('checked');
    allowListR.removeAttribute('checked');
    denyListR.removeAttribute('checked');

    switch (radio) {
        case 'disable-radio':
            disableR.setAttribute('checked', 'checked');
            // some dirty workaround for
            // - chromium not updating visuals
            // - firefox radio click logic
            if (cookiesAPI.browser === 'chromium') {
                disableR.click();
            }
            break;
        case 'allow-list-radio':
            allowListR.setAttribute('checked', 'checked');
            // some dirty workaround, see above
            if (cookiesAPI.browser === 'chromium') {
                allowListR.click();
            }
            break;
        case 'deny-list-radio':
            denyListR.setAttribute('checked', 'checked');
            // workaround, see above
            if (cookiesAPI.browser === 'chromium') {
                denyListR.click();
            }
            break;
    }
}


const getFilterState = () => {
    return cookiesAPI.getValue('ss');
}


const setFilterState = (s) => {
    if (['disabled', 'allowlist', 'denylist'].includes(s)) {
        return cookiesAPI.storeValue({ ss: s });
    }
    else {
        return Promise.reject();
    }
}


/**
 * 
 * @param {String} t - type of the filter: 'allow' or 'deny'
 * @param {String} d - data
 * @param {String} a - action: 'add' or 'remove'
 */
const updateFilter = (t, d, a) => {
    if (['allow', 'deny'].includes(t)) {
        getFilter(t)
            .then((r) => {
                let filter = r[Object.keys(r)[0]];
                if (a === 'add') {
                    if (!filter.includes(d)) {
                        filter.push(d);
                        filter.sort();
                    }
                }
                else if (a === 'remove') {
                    let i = filter.indexOf(d);
                    if (i > -1) {
                        filter.splice(i, 1);
                    }
                }
                switch (t) {
                    case 'allow':
                        cookiesAPI.storeValue({ fa: filter });
                        break;
                    case 'deny':
                        cookiesAPI.storeValue({ fd: filter });
                        break;
                }
            });
    }
}


const getFilter = (t) => {
    switch (t) {
        case 'allow':
            return cookiesAPI.getValue('fa');
        case 'deny':
            return cookiesAPI.getValue('fd');
    }
}


const onFilterRead = (f) => {
    let key = Object.keys(f)[0];
    switch (key) {
        case 'fa':
            for (let fi of f.fa) {
                updateList('allow-list', fi);
            }
            break;
        case 'fd':
            for (let fi of f.fd) {
                updateList('deny-list', fi);
            }
            break;
    }
}


const onStorageUpdated = (c, a) => {
    console.log('onStorageUpdated()');
    let key = Object.keys(c)[0];
    switch (key) {
        case 'fa': {
            console.log('allowlist updated')
            if (c.fa.newValue) {
                console.log('allowlist new value', c.fa.newValue);
                emptyList('allow-list')
                for (let fi of c.fa.newValue) {
                    updateList('allow-list', fi);
                }
            }
            else {
                emptyList('allow-list');
            }
            break;
        }
        case 'fd': {
            console.log('denylist updated')
            if (c.fd.newValue) {
                console.log('denylist new value', c.fd.newValue);
                emptyList('deny-list')
                for (let fi of c.fd.newValue) {
                    updateList('deny-list', fi);
                }
            }
            else {
                emptyList('deny-list');
            }
            break;
        }
        case 'ss': {
            console.log('selected list updated')
            let state = c.ss.newValue;
            console.log('selected list new value', state);
            switch (state) {
                case 'disabled':
                    switchCheckedRadio('disable-radio');
                    break;
                case 'allowlist':
                    switchCheckedRadio('allow-list-radio');
                    break;
                case 'denylist':
                    switchCheckedRadio('deny-list-radio');
                    break;
            }
        }
    }
}


const updateList = (list_id, domain) => {
    let list = document.getElementById(list_id);

    let list_item_container = document.createElement('div');
    list_item_container.classList.add('align-items-center', 'border', 'flex', 'flex-gap-5', 'flex-row', 'p-5', 'rounded');

    let list_item_text = document.createElement('div');
    list_item_text.classList.add('fs-14');
    list_item_text.innerText = domain;
    
    let x_icon = document.createElement('div');
    x_icon.classList.add('border', 'clickable', 'circle', 'quadratic-15', 'x-icon');
    x_icon.title = 'delete';
    x_icon.value = domain;


    list_item_container.append(list_item_text)
    list_item_container.append(x_icon);

    switch (list_id) {
        case 'allow-list':
            x_icon.addEventListener("click", (event) => {
                // event.stopImmediatePropagation();
                updateFilter('allow', event.target.value, 'remove');
            });
            break;
        case 'deny-list':
            x_icon.addEventListener("click", (event) => {
                // event.stopImmediatePropagation();
                updateFilter('deny', event.target.value, 'remove');
            });
            break;
    }
    list.append(list_item_container);
}


const emptyList = (l) => {
    document.getElementById(l).innerHTML = '';
}