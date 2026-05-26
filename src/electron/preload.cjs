const electron = require("electron");

electron.contextBridge.exposeInMainWorld("electron", {
    selectVanillaPlusPath: () => electron.ipcRenderer.invoke("select-vanilla-plus-path"),
    getVanillaPlusPath: () => electron.ipcRenderer.invoke("get-vanilla-plus-path"),
    playVanillaPlus: () => electron.ipcRenderer.invoke("play-vanilla-plus"), // Renamed from play-wow

    // Wallet and PGP keys functions:
    saveWallet: (walletData) => electron.ipcRenderer.invoke("save-wallet", walletData),
    getWallet: () => electron.ipcRenderer.invoke("get-wallet"),
    // Keys functions:
    saveKeys: (keysData) => electron.ipcRenderer.invoke("save-keys", keysData),
    getKeys: () => electron.ipcRenderer.invoke("get-keys"),
    // VanillaPlus account functions
    saveVanillaPlusAccount: (account) => electron.ipcRenderer.invoke("save-vanilla-plus-account", account),
    getVanillaPlusAccount: () => electron.ipcRenderer.invoke("get-vanilla-plus-account"),
    exportVanillaPlusFiles: () => electron.ipcRenderer.invoke("export-vanilla-plus-files"), // Renamed from export-wow-files

    getVersion: () => electron.ipcRenderer.invoke('get-app-version'),
    getVanillaCacheCount: () => electron.ipcRenderer.invoke("return-VanillaCache-Count"), // Renamed from export-wow-files

    testPing: () => electron.ipcRenderer.invoke('test-auth-ping'),

  onMainProcessLog: (callback) => {
    electron.ipcRenderer.on('main-process-log', (event, [type, ...args]) => {
        callback(type, args);
    });
    return () => {
        electron.ipcRenderer.removeAllListeners('main-process-log'); // fixed: was bare ipcRenderer
    };
},
    // Add this so main knows renderer is mounted
    notifyRendererReady: () => {
        electron.ipcRenderer.send('renderer-ready');
    },
});