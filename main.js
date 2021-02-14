const fs = require('fs');
const {Menu, Notification, app, shell, BrowserWindow} = require('electron');
const Store = require('electron-store');
const prompt = require('native-prompt')
const contextMenu = require('electron-context-menu');
const defaultMenu = require('electron-default-menu');

const store = new Store();
const urlRegex = new RegExp("((([A-Za-z]{3,9}:(?:\\/\\/)?)(?:[-;:&=\\+\\$,\\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\\+\\$,\\w]+@)[A-Za-z0-9.-]+)((?:\\/[\\+~%[\\]\\/.\\w-_]*)?\\??(?:[-\\+=&;%@.\\w_]*)#?(?:[\\w]*))?)");

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
    showInspectElement: false
});

function createWindow() {
    let error = false;
    let browserOptions = {
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            webviewTag: true,
            allowRunningInsecureContent: true,
        }
    }

    if (process.platform === "linux") {
        browserOptions = Object.assign({}, browserOptions, {
            icon: "../build/icon.png"
        });
    }

    const mainWindow = new BrowserWindow(browserOptions);

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
                click: () => {
                    prompt("Set Portainer Endpoint", "Enter the Portainer Endpoint.\t\t\t\t\t").then(endpoint => {
                        if (endpoint) {
                            if (urlRegex.test(endpoint)) {
                                store.set("endpoint", endpoint);
                                new Notification({title: "Portainer Endpoint Set!", body: `Endpoint has been set to: "${endpoint}"`}).show()
                            } else {
                                new Notification({title: "Endpoint is not a valid url!", body: "Please specify a valid endpoint url."}).show()
                            }
                        }
                    });
                },
            },
            {
                type: "separator"
            },
            {
                label: 'Set Credentials',
                click: () => {
                    prompt("Username", "Enter the Portainer Username.\t\t\t\t\t").then(username => {
                        if (username) {
                            prompt("Password", `Enter ${username}'s password?\t\t\t\t\t`, {mask: true}).then(password => {
                                if (password) {
                                    store.set("username", username);
                                    store.set("password", password);

                                    new Notification({title: "Username and Password Updated!", body: !store.get("autoLogin") ? "You can enable autologin in the config menu" : ""}).show()
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
        if (store.get("darkMode") && !error) {
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
    }).catch(() => {
        error = true;
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
