const {app, BrowserWindow} = require('electron');
const contextMenu = require('electron-context-menu');

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
