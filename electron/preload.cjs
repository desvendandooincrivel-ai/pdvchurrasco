const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        send: (channel, data) => ipcRenderer.send(channel, data),
        on: (channel, func) => {
            // Intentionally filtering channels for security
            const validChannels = ['update_available', 'update_downloaded', 'download_progress'];
            if (validChannels.includes(channel)) {
                const subscription = (event, ...args) => func(...args);
                ipcRenderer.on(channel, subscription);
                return () => ipcRenderer.removeListener(channel, subscription);
            }
        },
        off: (channel, func) => {
            ipcRenderer.removeListener(channel, func);
        },
        removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
    },
});
