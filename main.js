const fs = require('fs');
const {Menu, app, dialog, shell, BrowserWindow} = require('electron');
const contextMenu = require('electron-context-menu');
const Store = require('electron-store');
const defaultMenu = require('electron-default-menu');
const Alert = require('electron-alert')

const store = new Store();

contextMenu({
    prepend: (defaultActions, params, browserWindow) => [
        {
            label: 'Search Google for “{selection}”',
            visible: params.selectionText.trim().length > 0,
            click: () => {
                shell.openExternal(`https://google.com/search?q=${encodeURIComponent(params.selectionText)}`);
            }
        }
    ],
    showInspectElement: true
});

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            webviewTag: true,
            allowRunningInsecureContent: true,
        }
    });

    const menu = defaultMenu(app, shell);

    menu.splice(2, 0, {
        label: "Config",
        submenu: [
            {
                type: "separator"
            },
            {
                label: 'Dark Mode',
                type: "checkbox",
                checked: store.get("darkMode"),
                click: (item, focusedWindow) => {
                    store.set("darkMode", !store.get("darkMode"));
                    mainWindow.webContents.reload();
                }
            },
            {
                label: 'Auto Login',
                type: "checkbox",
                checked: store.get("autoLogin"),
                click: (item, focusedWindow) => {
                    store.set("autoLogin", !store.get("autoLogin"));
                    mainWindow.webContents.reload();
                },
            },
            {
                type: "separator"
            },
            {
                label: 'Set Endpoint',
                click: (item, focusedWindow) => {
                    let options = {
                        title: "Enter the Portainer Endpoint",
                        input: "text",
                        inputAttributes: {
                            autocapitalize: 'off'
                        },
                        showCancelButton: true,
                    };

                    new Alert(null, true).fireWithFrame(options, null, mainWindow, false).then((endpoint) => {
                        if (endpoint.value) {
                            store.set("endpoint", endpoint.value);
                        }
                    });
                },
            },
            {
                type: "separator"
            },
            {
                label: 'Set Credentials',
                click: (item, focusedWindow) => {
                    let options = {
                        title: "Enter the Portainer Username",
                        input: "text",
                        inputAttributes: {
                            autocapitalize: 'off'
                        },
                        showCancelButton: true,
                    };

                    new Alert(null, true).fireWithFrame(options, null, mainWindow, false).then((usernameRes) => {
                        if (usernameRes.value) {
                            options.title = `Enter ${usernameRes.value}'s password?`
                            options.input = "password";

                            new Alert().fireWithFrame(options, null, null, true).then((passwordRes) => {
                                if (passwordRes.value) {
                                    store.set("username", usernameRes.value);
                                    store.set("password", passwordRes.value);
                                }
                            });
                        }
                    });
                },
            },
        ]
    });

    Menu.setApplicationMenu(Menu.buildFromTemplate(menu));

    mainWindow.webContents.on('did-finish-load', function () {
        if (store.get("darkMode")) {
            fs.readFile(__dirname + '/dark-theme.css', "utf-8", function (error, data) {
                if (!error) {
                    let formattedData = data.replace(/\s{2,10}/g, ' ').trim();
                    mainWindow.webContents.insertCSS(formattedData);
                }
            });
        }
    });

    mainWindow.loadURL(`${store.get("endpoint") ? store.get("endpoint") : "http://localhost:9000/"}`).then(() => {
        if (store.get("autoLogin")) {
            setTimeout(() => {
                let loginScript = `
                    var elName = angular.element(document.getElementById("username"));
                    var $scope = elName.scope();
                    $scope.$parent.ctrl.formValues = {Username: "${store.get("username") ? store.get("username") : "admin"}", 
                    Password: "${store.get("password") ? store.get("password") : "password"}"};
                    document.getElementsByClassName("btn")[0].click();
                `;

                mainWindow.webContents.executeJavaScript(loginScript).then(() => console.log("Login successful"));
            }, 100);
        }
    }).catch((err) => {
        mainWindow.loadFile("instructions.html")
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
})
