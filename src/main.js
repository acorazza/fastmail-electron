const { app, BrowserWindow, Menu, Tray, nativeImage, shell, ipcMain, Notification, globalShortcut } = require('electron');
const path = require('path');
const windowStateKeeper = require('electron-window-state');

let mainWindow;
let tray;

function createWindow() {
    // Load or set window state
    let mainWindowState = windowStateKeeper({
        defaultWidth: 1200,
            defaultHeight: 800
    });

    // Create the browser window
    mainWindow = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, '../assets/icon.png'),
                                   show: false,
                                   titleBarStyle: 'default',
                                   autoHideMenuBar: true
    });

    // Let windowStateKeeper manage the window
    mainWindowState.manage(mainWindow);

    // Load Fastmail
    mainWindow.loadURL('https://www.fastmail.com/mail/');

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Handle window closed - minimize to tray instead of quitting
    mainWindow.on('close', (event) => {
        if (!app.isQuiting) {
            event.preventDefault();
            mainWindow.hide();

            // Show tray notification on first minimize
            if (!mainWindow.hasBeenHidden) {
                if (Notification.isSupported()) {
                    new Notification({
                        title: 'Fastmail',
                        body: 'Application was minimized to tray',
                        icon: path.join(__dirname, '../assets/icon.png')
                    }).show();
                }
                mainWindow.hasBeenHidden = true;
            }
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Open external links in default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
}

// Handle notification requests from renderer
ipcMain.handle('show-notification', async (event, title, body, icon) => {
    if (Notification.isSupported()) {
        const notification = new Notification({
            title: title,
            body: body,
            icon: icon || path.join(__dirname, '../assets/icon.png'),
                                              urgency: 'normal'
        });

        notification.on('click', () => {
            // Bring window to front when notification is clicked
            if (mainWindow) {
                if (mainWindow.isMinimized()) mainWindow.restore();
                mainWindow.focus();
                mainWindow.show();
            }
        });

        notification.show();
    }
});

function createTray() {
    // Create tray icon
    const trayIcon = nativeImage.createFromPath(path.join(__dirname, '../assets/icon.png'));
    tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));

    // Create context menu
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show Fastmail',
            type: 'normal',
            click: () => {
                if (mainWindow) {
                    if (mainWindow.isMinimized()) mainWindow.restore();
                    mainWindow.focus();
                    mainWindow.show();
                }
            }
        },
        {
            label: 'New Message',
            type: 'normal',
            click: () => {
                if (mainWindow) {
                    mainWindow.webContents.executeJavaScript(`
                    // Try to click the compose button in Fastmail
                    const composeBtn = document.querySelector('[data-testid="compose-button"], .v-Button--compose, button[title*="Compose"]');
                    if (composeBtn) composeBtn.click();
                    `);
                    if (mainWindow.isMinimized()) mainWindow.restore();
                    mainWindow.focus();
                    mainWindow.show();
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Toggle Menu Bar',
            type: 'normal',
            click: () => {
                if (mainWindow) {
                    const isVisible = !mainWindow.isMenuBarAutoHide();
                    mainWindow.setAutoHideMenuBar(isVisible);
                    mainWindow.setMenuBarVisibility(!isVisible);
                }
            }
        },
        {
            label: 'Preferences',
            type: 'normal',
            click: () => {
                console.log('Preferences clicked');
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            type: 'normal',
            click: () => {
                app.isQuiting = true;
                app.quit();
            }
        }
    ]);

    tray.setContextMenu(contextMenu);
    tray.setToolTip('Fastmail');

    // Handle tray click
    tray.on('click', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                if (mainWindow.isMinimized()) mainWindow.restore();
                mainWindow.focus();
                mainWindow.show();
            }
        }
    });

    // Handle double-click
    tray.on('double-click', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
            mainWindow.show();
        }
    });
}

function registerShortcuts() {
    // Register global shortcuts
    globalShortcut.register('CommandOrControl+Shift+M', () => {
        // Toggle main window
        if (mainWindow) {
            if (mainWindow.isVisible() && mainWindow.isFocused()) {
                mainWindow.hide();
            } else {
                if (mainWindow.isMinimized()) mainWindow.restore();
                mainWindow.focus();
                mainWindow.show();
            }
        }
    });

    globalShortcut.register('CommandOrControl+Shift+N', () => {
        // Compose new email
        if (mainWindow) {
            mainWindow.webContents.executeJavaScript(`
            const composeBtn = document.querySelector('[data-testid="compose-button"], .v-Button--compose, button[title*="Compose"], .s-compose-button');
            if (composeBtn) composeBtn.click();
            `);
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
            mainWindow.show();
        }
    });
}

function unregisterShortcuts() {
    globalShortcut.unregisterAll();
}

function createApplicationMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Message',
                    accelerator: 'CommandOrControl+N',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.executeJavaScript(`
                            const composeBtn = document.querySelector('[data-testid="compose-button"], .v-Button--compose, button[title*="Compose"], .s-compose-button');
                            if (composeBtn) composeBtn.click();
                            `);
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Hide Window',
                    accelerator: 'CommandOrControl+H',
                    click: () => {
                        if (mainWindow) mainWindow.hide();
                    }
                },
                {
                    label: 'Quit',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.isQuiting = true;
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectall' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' },
                { type: 'separator' },
                {
                    label: 'Toggle Menu Bar',
                    accelerator: 'Alt',
                    click: () => {
                        if (mainWindow) {
                            const isVisible = !mainWindow.isMenuBarAutoHide();
                            mainWindow.setAutoHideMenuBar(isVisible);
                            mainWindow.setMenuBarVisibility(!isVisible);
                        }
                    }
                }
            ]
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'close' },
                {
                    label: 'Toggle Window',
                    accelerator: 'CommandOrControl+Shift+M',
                    click: () => {
                        if (mainWindow) {
                            if (mainWindow.isVisible()) {
                                mainWindow.hide();
                            } else {
                                mainWindow.show();
                            }
                        }
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// App event listeners
app.whenReady().then(() => {
    createWindow();
    createTray();
    createApplicationMenu();
    registerShortcuts();

    // Create desktop integration
    const { createDesktopEntry, installIcon } = require('./desktop-integration');
    createDesktopEntry(process.execPath);
    installIcon(path.join(__dirname, '../assets/icon.png'));
});

app.on('window-all-closed', () => {
    // On KDE/Linux, keep running in tray even when all windows are closed
    if (process.platform === 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on('before-quit', () => {
    app.isQuiting = true;
});

app.on('will-quit', () => {
    unregisterShortcuts();
    if (tray) {
        tray.destroy();
    }
});
