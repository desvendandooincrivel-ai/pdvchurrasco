const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// Prevent multiple instances
const additionalData = { key: 'churrasco-control' };
const gotTheLock = app.requestSingleInstanceLock(additionalData);

if (!gotTheLock) {
    app.quit();
} else {
    let mainWindow;

    const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';

    function createWindow() {
        mainWindow = new BrowserWindow({
            width: 1280,
            height: 720,
            minWidth: 800,
            minHeight: 600,
            title: 'Churrasco Control',
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.cjs'),
            },
        });

        if (isDev) {
            mainWindow.loadURL('http://localhost:3000');
            // Open DevTools in development
            // mainWindow.webContents.openDevTools();
        } else {
            mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
        }

        mainWindow.on('closed', () => {
            mainWindow = null;
        });
    }

    app.whenReady().then(() => {
        createWindow();

        // Configure AutoUpdater
        autoUpdater.autoDownload = false;
        autoUpdater.allowPrerelease = false;

        // Check for updates
        if (!isDev) {
            // Check for updates after app launch
            setTimeout(() => {
                autoUpdater.checkForUpdates().catch(err => console.log('Update check error:', err));
            }, 3000);
        }
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    // IPC Handlers
    ipcMain.on('start_download_update', () => {
        if (!isDev) {
            autoUpdater.downloadUpdate();
        }
    });

    // AutoUpdater Events
    autoUpdater.on('update-available', (_info) => {
        if (mainWindow) {
            mainWindow.webContents.send('update_available');
        }
    });

    autoUpdater.on('update-downloaded', (_info) => {
        // Automatically restart after download as requested
        autoUpdater.quitAndInstall();
    });

    autoUpdater.on('error', (err) => {
        console.error('AutoUpdater error:', err);
    });
}
