import { CookiesAPI } from '/assets/modules.mjs';

document.onreadystatechange = function () {
    if (document.readyState === "complete") {
        CookiesAPI.getAPI()
            .then(
                (apiObj) => {
                    OptionsUI(apiObj);
                },
                (error) => { }
            );
    }
};

const OptionsUI = (cookiesAPI) => {
    var disableRadio = document.getElementById('disable-radio');
    var allowListRadio = document.getElementById('allow-list-radio');
    var denyListRadio = document.getElementById('deny-list-radio');

    var allowDomainForm = document.getElementById('allow-domain-form');
    var allowDomainTextInput = document.getElementById('allow-input');
    var allowList = document.getElementById('allow-list');

    var denyDomainForm = document.getElementById('deny-domain-form');
    var denyDomainTextInput = document.getElementById('deny-input');
    var denyList = document.getElementById('deny-list');

    var exportBtn = document.getElementById('export-btn');
    var importFilePicker = document.getElementById('import-file-picker');

    const onStorageUpdated = (storageObj) => {
        let keys = Object.keys(storageObj);
        for (let key of keys) {
            if (key === 'fa' || key === 'fd') {
                var itemsToAdd = []
                var itemsToRemove = [];
                var listToUpdate = null;
                if (storageObj[key].newValue && storageObj[key].oldValue) {
                    itemsToAdd = storageObj[key].newValue.filter((item) => !storageObj[key].oldValue.includes(item));
                    itemsToRemove = storageObj[key].oldValue.filter((item) => !storageObj[key].newValue.includes(item));
                }
                if (key === 'fa') listToUpdate = allowList;
                if (key === 'fd') listToUpdate = denyList;
                itemsToAdd.forEach((item) => addToList(listToUpdate, item));
                itemsToRemove.forEach((item) => removeFromList(listToUpdate, item));
            }
            if (key === 'ss') {
                let selectedFilter = storageObj.ss.newValue;
                let radio = null;
                switch (selectedFilter) {
                    case 'disabled': {
                        radio = disableRadio;
                        break;
                    }
                    case 'allowlist': {
                        radio = allowListRadio;
                        break;
                    }
                    case 'denylist': {
                        radio = denyListRadio;
                        break;
                    }
                }
                if (radio !== null) {
                    radio.setAttribute('checked', 'checked');
                    if (cookiesAPI.browserName === 'chrome') {
                        radio.click();
                    }
                }
            }
        }

    }

    const addToList = (list, domain) => {
        let listItems = Array.from(list.childNodes);
        let newListItem = createListItem(list, domain);
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

    const removeFromList = (list, domain) => {
        let itemsToRemove = Array.from(list.childNodes).filter((child) => child.name === domain);
        itemsToRemove.pop().remove();
    }

    const createListItem = (list, domain) => {
        let listItemContainer = document.createElement('div');
        listItemContainer.classList.add('align-items-center', 'border', 'flex', 'flex-gap-5', 'flex-row', 'interactive', 'p-5', 'rounded');
        listItemContainer.name = domain;

        let listItemText = document.createElement('div');
        listItemText.classList.add('fs-14');
        listItemText.innerText = domain;

        let xIcon = document.createElement('div');
        xIcon.classList.add('border', 'clickable', 'circle', 'quadratic-15', 'x-icon');
        xIcon.title = 'delete';
        xIcon.value = domain;

        listItemContainer.append(listItemText)
        listItemContainer.append(xIcon);

        switch (list.id) {
            case 'allow-list': {
                xIcon.addEventListener("click", (event) => {
                    updateFilter('fa', domain, 'remove');
                });
                break;
            }
            case 'deny-list': {
                xIcon.addEventListener("click", (event) => {
                    updateFilter('fd', domain, 'remove');
                });
                break;
            }
        }

        return listItemContainer;
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

    cookiesAPI.getValue(null)
        .then((storageObj) => {
            storageObj.fa.forEach((item) => addToList(allowList, item));
            storageObj.fd.forEach((item) => addToList(denyList, item));
            switch (storageObj.ss) {
                case 'disabled': {
                    disableRadio.setAttribute('checked', 'checked');
                    break;
                }
                case 'allowlist': {
                    allowListRadio.setAttribute('checked', 'checked');
                    break;
                }
                case 'denylist': {
                    denyListRadio.setAttribute('checked', 'checked');
                    break;
                }

            }
        });

    cookiesAPI.storage.onChanged.addListener(onStorageUpdated);

    allowDomainForm.addEventListener("submit", (event) => {
        event.preventDefault();
        updateFilter('fa', allowDomainTextInput.value, 'add');
        allowDomainTextInput.value = '';
    });

    denyDomainForm.addEventListener("submit", (event) => {
        event.preventDefault();
        updateFilter('fd', denyDomainTextInput.value, 'add');
        denyDomainTextInput.value = '';
    });

    disableRadio.addEventListener("click", () => {
        cookiesAPI.storeValue({ ss: 'disabled' });
    });

    allowListRadio.addEventListener("click", () => {
        cookiesAPI.storeValue({ ss: 'allowlist' });
    });

    denyListRadio.addEventListener("click", () => {
        cookiesAPI.storeValue({ ss: 'denylist' });
    });

    exportBtn.addEventListener("click", () => {
        cookiesAPI.getValue(null)
            .then((resolve) => {
                let settingsJson = JSON.stringify(resolve, undefined, 4);
                let settingsFile = new File(
                    [settingsJson],
                    'cookie-stack-settings.json',
                    { type: 'application/json' }
                );
                let url = URL.createObjectURL(settingsFile);

                let downloadProcess = cookiesAPI.download({
                    url: url,
                    filename: 'cookie-stack-settings.json',
                    saveAs: true
                });

                downloadProcess.then(
                    (resolve) => {
                        URL.revokeObjectURL(url)
                    },
                    (reject) => {
                        URL.revokeObjectURL(url)
                    });

            });
    });

    importFilePicker.addEventListener("change", (event) => {
        let files = importFilePicker.files;
        if (files.length == 1) {
            let file = files[0];
            let content = file.text();
            content.then(
                (text) => {
                    let jsonObject = JSON.parse(text);
                    if (jsonObject.ss && jsonObject.fa && jsonObject.fd) {
                        if (typeof jsonObject.ss === 'string' && Array.isArray(jsonObject.fa) && Array.isArray(jsonObject.fd)) {
                            cookiesAPI.storeValue(jsonObject);
                        }
                    }
                    importFilePicker.value = '';
                },
                (reject) => {
                    importFilePicker.value = '';
                }
            );
        }
    });
}
