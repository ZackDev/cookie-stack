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
                        document.getElementById('allow-list-radio').setAttribute('checked', true);
                        break;
                    case 'denylist':
                        document.getElementById('deny-list-radio').setAttribute('checked', true);
                        break;
                    case 'disabled':
                        document.getElementById('disable-radio').setAttribute('checked', true);
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
                        {type: 'application/json'}
                    );
                    let url = URL.createObjectURL(settingsFile);
                    let downloadProcess = chrome.downloads.download({
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

        document.getElementById('import-btn').addEventListener("click", () => {
            let filehandle = getFileHandle();
            filehandle.then((fh) => {
                let file = getFile(fh);
                file.then((settingsFile) => {
                    let content = settingsFile.text();
                    content.then((c) => {
                        let jsonObject = JSON.parse(c);
                        console.log(jsonObject);
                        if (jsonObject.ss && jsonObject.fa && jsonObject.fd) {
                            if (typeof jsonObject.ss === 'string' && Array.isArray(jsonObject.fa) && Array.isArray(jsonObject.fd)) {
                                cookiesAPI.storeValue({ss: jsonObject.ss});
                                cookiesAPI.storeValue({fa: jsonObject.fa});
                                cookiesAPI.storeValue({fd: jsonObject.fd});
                            }
                            else {
                                console.log('json wrong property types');
                            }
                        }
                        else {
                            console.log('json missing keys');
                        }
                    });
                });
            })
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

const getFilterState = () => {
    return cookiesAPI.getValue('ss');
}

const setFilterState = (s) => {
    cookiesAPI.storeValue({ ss: s });
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
    let key = Object.keys(c)[0];
    switch (key) {
        case 'fa':
            if (c.fa.newValue) {
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
            if (c.fd.newValue) {
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
            let state = c.ss.newValue;
            switch (state) {
                case 'disabled':
                    document.getElementById('disable-radio').setAttribute('checked', 'checked');
                    break;
                case 'allowlist':
                    document.getElementById('allow-list-radio').setAttribute('checked', 'checked');
                    break;
                case 'denylist':
                    document.getElementById('deny-list-radio').setAttribute('checked', 'checked');
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