import { CookiesAPI } from '/zackdev/modules.mjs';


const cookiesAPI = new CookiesAPI();


document.onreadystatechange = function () {
    if (document.readyState === "complete") {

        cookiesAPI.getValue('fa')
            .then((storageObj) => {
                if (storageObj.fa) {
                    storageObj.fa.forEach((item) => addToList('allow-list', item));
                }
            });

        cookiesAPI.getValue('fd')
            .then((storageObj) => {
                if (storageObj.fd) {
                    storageObj.fd.forEach((item) => addToList('deny-list', item));
                }
            });

        cookiesAPI.getValue('ss')
            .then((storageObj) => {
                let selectedFilter = storageObj.ss;
                switch (selectedFilter) {
                    case 'allowlist': {
                        document.getElementById('allow-list-radio').setAttribute('checked', 'checked');
                        break;
                    }
                    case 'denylist': {
                        document.getElementById('deny-list-radio').setAttribute('checked', 'checked');
                        break;
                    }
                    case 'disabled': {
                        document.getElementById('disable-radio').setAttribute('checked', 'checked');
                        break;
                    }
                }
            });

        cookiesAPI.storage.onChanged.addListener(onStorageUpdated);

        document.getElementById('allow-domain-form').addEventListener("submit", (event) => {
            event.preventDefault();
            let ta = document.getElementById('allow-input');
            updateFilter('fa', ta.value, 'add');
            ta.value = '';
        });

        document.getElementById('deny-domain-form').addEventListener("submit", (event) => {
            event.preventDefault();
            let td = document.getElementById('deny-input');
            updateFilter('fd', td.value, 'add');
            td.value = '';
        });

        document.getElementById('disable-radio').addEventListener("click", () => {
            cookiesAPI.storeValue({ ss: 'disabled' });
        });

        document.getElementById('allow-list-radio').addEventListener("click", () => {
            cookiesAPI.storeValue({ ss: 'allowlist' });
        });

        document.getElementById('deny-list-radio').addEventListener("click", () => {
            cookiesAPI.storeValue({ ss: 'denylist' });
        });

        document.getElementById('export-btn').addEventListener("click", () => {
            cookiesAPI.getValue(null)
                .then((resolve) => {
                    let settingsJson = JSON.stringify(resolve, undefined, 4);
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
                    (text) => {
                        let jsonObject = JSON.parse(text);
                        if (jsonObject.ss && jsonObject.fa && jsonObject.fd) {
                            if (typeof jsonObject.ss === 'string' && Array.isArray(jsonObject.fa) && Array.isArray(jsonObject.fd)) {
                                console.log('import-file-picker:', 'writing settings from json file to localStorage');
                                cookiesAPI.storeValue(jsonObject);
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
    let disableRadioBtn = document.getElementById('disable-radio');
    let allowListRadioBtn = document.getElementById('allow-list-radio');
    let denyListRadioBtn = document.getElementById('deny-list-radio');

    disableRadioBtn.removeAttribute('checked');
    allowListRadioBtn.removeAttribute('checked');
    denyListRadioBtn.removeAttribute('checked');

    switch (radio) {
        case 'disable-radio': {
            disableRadioBtn.setAttribute('checked', 'checked');
            // some dirty workaround for
            // - chromium not updating visuals
            // - firefox radio click logic
            if (cookiesAPI.browser === 'chromium') {
                disableRadioBtn.click();
            }
            break;
        }
        case 'allow-list-radio': {
            allowListRadioBtn.setAttribute('checked', 'checked');
            // some dirty workaround, see above
            if (cookiesAPI.browser === 'chromium') {
                allowListRadioBtn.click();
            }
            break;
        }
        case 'deny-list-radio': {
            denyListRadioBtn.setAttribute('checked', 'checked');
            // workaround, see above
            if (cookiesAPI.browser === 'chromium') {
                denyListRadioBtn.click();
            }
            break;
        }
    }
}


/**
 * 
 * @param {String} name - name of the filter: 'fa' or 'fd'
 * @param {String} domain - domain
 * @param {String} action - action: 'add' or 'remove'
 */
const updateFilter = (name, domain, action) => {
    if (name === 'fa' || name === 'fd') {
        cookiesAPI.getValue(name)
            .then((storageObj) => {
                let filter = storageObj[name];
                if (action === 'add') {
                    if (!filter.includes(domain)) {
                        filter.push(domain);
                        filter.sort();
                    }
                }
                else if (action === 'remove') {
                    let i = filter.indexOf(domain);
                    if (i > -1) {
                        filter.splice(i, 1);
                    }
                }
                let objectToStore = {};
                objectToStore[name] = filter;
                cookiesAPI.storeValue(objectToStore);
            });
    }
}


const onStorageUpdated = (storageObj) => {
    console.log('onStorageUpdated()');
    let key = Object.keys(storageObj)[0];
    
    if (key === 'fa' || key === 'fd') {
        var itemsToAdd = []
        var itemsToRemove = [];
        var listName = '';
        if (storageObj[key].newValue && storageObj[key].oldValue) {
            if (storageObj[key].newValue.length > storageObj[key].oldValue.length) {
                itemsToAdd = storageObj[key].newValue.filter((item) => !storageObj[key].oldValue.includes(item));
            }
            else if (storageObj[key].newValue.length < storageObj[key].oldValue.length) {
                itemsToRemove = storageObj[key].oldValue.filter((item) => !storageObj[key].newValue.includes(item));
            }
        }
        key === 'fa' ? listName = 'allow-list' : listName = 'deny-list';

        itemsToAdd.forEach((item) => addToList(listName, item));
        itemsToRemove.forEach((item) => removeFromList(listName, item));
    }
    else if (key === 'ss') {
        console.log('selected filter updated')
        let selectedFilter = storageObj.ss.newValue;
        switch (selectedFilter) {
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


const addToList = (list_id, domain) => {
    let list = document.getElementById(list_id);
    let listItems = Array.from(list.childNodes);
    let newListItem = createListItem(list_id, domain);
    var listItemAdded = false;
    for (let i = 0; i < listItems.length; i++) {
        if (listItems[i].name > newListItem.name) {
            list.insertBefore(newListItem, listItems[i]);
            listItemAdded = true;
            break;
        }
    }
    if (listItemAdded === false) {
        list.append(newListItem);
    }
} 


const removeFromList = (list_id, domain) => {
    let list = document.getElementById(list_id);
    let itemsToRemove = Array.from(list.childNodes).filter((child) => child.name === domain);
    itemsToRemove.pop().remove();
}


const createListItem = (list_id, domain) => {
    let list_item_container = document.createElement('div');
    list_item_container.classList.add('align-items-center', 'border', 'flex', 'flex-gap-5', 'flex-row', 'p-5', 'rounded');
    list_item_container.name = domain;

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
        case 'allow-list': {
            x_icon.addEventListener("click", (event) => {
                updateFilter('fa', domain, 'remove');
            });
            break;
        }
        case 'deny-list': {
            x_icon.addEventListener("click", (event) => {
                updateFilter('fd', domain, 'remove');
            });
            break;
        }
    }

    return list_item_container;
}
