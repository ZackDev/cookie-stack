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
    }
};

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

const updateFilter = (t, d, a) => {
    switch (t) {
        case 'allow':
            getFilter(t)
                .then((r) => {
                    let fia = r.fa;
                    if (a === 'add') {
                        if (!fia.includes(d)) {
                            fia.push(d);
                            cookiesAPI.storeValue({ fa: fia });
                        }
                    }
                    else if (a === 'remove') {
                        let i = fia.indexOf(d);
                        if (i > -1) {
                            fia.splice(i, 1);
                            cookiesAPI.storeValue({ fa: fia });
                        }
                    };
                });
            break;
        case 'deny':
            getFilter(t)
                .then((r) => {
                    let fid = r.fd;
                    if (a === 'add') {
                        if (!fid.includes(d)) {
                            fid.push(d);
                            cookiesAPI.storeValue({ fd: fid });
                        }
                    }
                    else if (a === 'remove') {
                        let i = fid.indexOf(d);
                        if (i > -1) {
                            fid.splice(i, 1);
                            cookiesAPI.storeValue({ fd: fid });
                        }
                    }
                });
            break;
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
    d.classList.add('flex-item', 'clickable');
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