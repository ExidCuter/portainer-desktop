const {Menu, app, dialog, shell, BrowserWindow} = require('electron');
const contextMenu = require('electron-context-menu');
const Store = require('electron-store');
const fs = require('fs');
const defaultMenu = require('electron-default-menu');

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
    showInspectElement: false
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

    menu[2].submenu.push({type:"separator"})
    menu[2].submenu.push({
        label: 'Dark Mode',
        type: "checkbox",
        checked: store.get("darkMode"),
        click: (item, focusedWindow) => {
            store.set("darkMode", !store.get("darkMode"));
            mainWindow.webContents.reload();
        },
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

    mainWindow.loadURL('http://localhost:9000').then(() => {
        setTimeout(() => {
            let loginScript = `
                var elName = angular.element(document.getElementById("username"));
                var $scope = elName.scope();
                $scope.$parent.ctrl.formValues = {Username: "admin", Password: "password"};
                document.getElementsByClassName("btn")[0].click();
            `;

            mainWindow.webContents.executeJavaScript(loginScript).then(() => console.log("Login successful"));
        }, 100);
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
