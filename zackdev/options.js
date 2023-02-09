import { getCookiesAPI } from '/zackdev/modules.mjs';

const cookiesAPI = getCookiesAPI();

document.onreadystatechange = function () {
    if (document.readyState === "complete") {

        setupStorage();

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

        document.getElementById('allow-add-btn').addEventListener("click", () => {
            let ta = document.getElementById('allow-input');
            updateFilter('allow', ta.value, 'add');
            ta.value = '';
        });

        document.getElementById('deny-add-btn').addEventListener("click", () => {
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
                    downloadProcess.then((res, rej) => {
                        res => URL.revokeObjectURL(url),
                        rej => URL.revokeObjectURL(url)
                    });
                })
        });

        document.getElementById('import-file-picker').addEventListener("change", (event) => {
            let files = event.target.files;
            let file = files[0];
            let content = file.text();
            content.then((c) => {
                let jsonObject = JSON.parse(c);
                if (jsonObject.ss && jsonObject.fa && jsonObject.fd) {
                    if (typeof jsonObject.ss === 'string' && Array.isArray(jsonObject.fa) && Array.isArray(jsonObject.fd)) {
                        cookiesAPI.storeValue({ ss: jsonObject.ss });
                        cookiesAPI.storeValue({ fa: jsonObject.fa });
                        cookiesAPI.storeValue({ fd: jsonObject.fd });
                    }
                    else {
                        console.log('json wrong property types');
                    }
                }
                else {
                    console.log('json missing keys');
                }
            });
            event.target.value = 'No file chosen';
        });
    }
};

async function getFileHandle() {
    let filehandle;
    [filehandle] = await window.showOpenFilePicker();
    return filehandle;
}

async function getFile(filehandle) {
    let file = await filehandle.getFile();
    return file;
}

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
            // some dirty workaround for radio not updating visuals
            disableR.click();
            break;
        case 'allow-list-radio':
            allowListR.setAttribute('checked', 'checked');
            // some dirty workaround for radio not updating visuals
            allowListR.click();
            break;
        case 'deny-list-radio':
            denyListR.setAttribute('checked', 'checked');
            // some dirty workaround for radio not updating visuals
            denyListR.click();
            break;
    }
}


/**
 * initial setup for the extension's local storage
 * adds the following key-value pairs if not already present
 * - ss, 'disabled'
 * - fa, []
 * - fd, []
 */
const setupStorage = () => {
    cookiesAPI.getValue('ss')
        .then((r) => {
            if (Object.keys(r).length === 0) {
                cookiesAPI.storeValue({ ss: 'disabled' });
            }
        })

    cookiesAPI.getValue('fa')
        .then((r) => {
            if (Object.keys(r).length === 0) {
                cookiesAPI.storeValue({ fa: [] });
            }
        })

    cookiesAPI.getValue('fd')
        .then((r) => {
            if (Object.keys(r).length === 0) {
                cookiesAPI.storeValue({ fd: [] });
            }
        })
}


/**
 * 
 * @returns Promise
 */
const getFilterState = () => {
    return cookiesAPI.getValue('ss');
}


/**
 * 
 * @param {string} s 
 */
const setFilterState = (s) => {
    if (['disabled', 'allowlist', 'denylist'].contains(s)) {
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
            break;
        case 'deny':
            return cookiesAPI.getValue('fd');
            break;
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
        case 'fa':
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
        case 'fd':
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
        case 'ss':
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

const updateList = (l, v) => {
    let list = document.getElementById(l);
    let d = document.createElement('div');
    d.classList.add('filter-item', 'border', 'rounded', 'clickable');
    d.innerText = v;
    switch (l) {
        case 'allow-list':
            d.addEventListener("click", (e) => {
                e.stopImmediatePropagation();
                updateFilter('allow', e.target.innerText, 'remove');
            });
            break;
        case 'deny-list':
            d.addEventListener("click", (e) => {
                e.stopImmediatePropagation();
                updateFilter('deny', e.target.innerText, 'remove');
            });
            break;
    }
    list.append(d);
}

const emptyList = (l) => {
    document.getElementById(l).innerHTML = '';
}