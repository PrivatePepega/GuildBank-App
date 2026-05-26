import { app, BrowserWindow, dialog, ipcMain } from "electron";
import path from "path";
import { isDev } from "./utils.js";
import { getPreloadPath } from "./pathResolver.js";
import Store from "electron-store";
import { spawn } from "child_process";
import fs from "node:fs/promises";
import os from "node:os";
import sudo from "sudo-prompt"; 
import fetch from "node-fetch";
import crypto from "crypto";
// import updateElectronApp from "update-electron-app";
import pkg from "electron-updater";
import https from "https";
// import NodeRSA from 'node-rsa';
// import * as openpgp from 'openpgp';
import dotenv from 'dotenv';
import log from "electron-log";





const store = new Store();
// Load .env in development only
if (isDev()) {
  dotenv.config();
}












ipcMain.handle("test-auth-ping", async () => {
  try {
    const wallet = store.get("wallet", null);
    console.log("wallet:", wallet);
    const walletWallet = wallet.wallet;
    console.log("walletWallet:", walletWallet);

    const keyPair = store.get("keys", { publicKey: "", privateKey: "" });
    const publicKey = keyPair.publicKey;
    const privateKey = keyPair.privateKey;
    const account = store.get("save-vanilla-plus-account", {});
    const accountName = account;
    console.log("account:" , account);
    console.log("accountName:", accountName);

    if (!wallet || !publicKey || !privateKey) {
      console.error("Test auth-ping failed: Missing wallet or keys", { wallet, publicKey });
      return { success: false, message: "Missing wallet or keys" };
    }

    const fakeData = {
        "daily": {
          "date": "2026-05-29",
          "playerLog": "14:30:00",
          "activity": "Battleground",
          "completed": true
        },
        "weekly": {
          "completed": true,
          "week": "2026-W25",
          "activity": "Raid",
          "bossesKilled": {661: true},
          "playerLog": "14:30:00"
        },
        "character": {
          "charUID": "Player-6064-029BFDBC",
          "log": {
            "bgLog": {
              "playerLog": "14:30:00",
              "playerEnter": "14:30:00",
              "date": "2026-05-29",
              "completed": false,
              "activity": "BattleGround"
            },
            "raidLog": {
              "playerLog": "14:30:00",
              "week": "2026-W25",
              "playerEnter": "14:30:00",
              "completed": false,
              "activity": "Raid"
            }
          },
          "faction": "Alliance",
          "charName": "Pepegangster",
          "class": "PALADIN",
          "race": "Dwarf",
          "serverName": "Dreamscythe"
        },
        "buttonPos": {
          "y": -117.805229764653,
          "x": -245.7679135473017,
          "point": "TOPRIGHT",
          "relativePoint": "TOPRIGHT"
        },
        "framePos": null
      }
    //   daily: {
    //     date: "2025-05-31",
    //     completed: true,
    //     activity: "Battleground",
    //     playerLog: "14:30:00"
    //   },
    //   weekly: {
    //     week: "2025-W31",
    //     completed: true,
    //     activity: "Raid",
    //     playerLog: "16:45:00",
    //     bossesKilled: { "672": true, "673": true }
    //   },
    //   character: {
    //     charUID: "Player-6103-029BFDBC",
    //     charName: "Pepegangster",
    //     serverName: "Dreamscythe",
    //     class: "PALADIN",
    //     race: "Dwarf",
    //     faction: "Alliance",
    //     log: {
    //       bgLog: {
    //         date: "2025-05-08",
    //         playerEnter: "14:00:00",
    //         playerLog: "14:30:00",
    //         activity: "Alterac Valley",
    //         completed: true
    //       },
    //       raidLog: {
    //         week: "2025-W20",
    //         playerEnter: "16:00:00",
    //         playerLog: "16:45:00",
    //         activity: "Molten Core",
    //         completed: true
    //       }
    //     }
    //   },
    //   buttonPos: null,
    //   framePos: null
    // };
    console.log("fake data:", fakeData);
    const currentDate = new Date().toISOString().split("T")[0];
    const currentWeek = getWeekNumber(new Date());
    console.log("current week", currentWeek);

    if (!store.has("vanillaPlusCompletionData")) store.set("vanillaPlusCompletionData", { daily: {}, weekly: {} });
    if (!store.has("vanillaPlusFileCache")) store.set("vanillaPlusFileCache", { dailyFiles: [], weeklyFiles: [], count: 0 });
    const vanillaPlusCompletionData = store.get("vanillaPlusCompletionData");
    const vanillaPlusFileCache = store.get("vanillaPlusFileCache");
    console.log("vanillaPlusCompletionData", vanillaPlusCompletionData);
    console.log("vanillaPlusFileCache", vanillaPlusFileCache);

    const dailyCompleted = fakeData.daily?.completed || false;
    const weeklyCompleted = fakeData.weekly?.completed || false;
    console.log("dailyCompleted", dailyCompleted);
    console.log("weeklyCompleted", weeklyCompleted);
    const dailyDate = fakeData.daily?.date || currentDate;
    const weeklyWeek = fakeData.weekly?.week || currentWeek;
    let newDaily = false;
    let newWeekly = false;

    const randomString = generateRandomString();

    if (dailyCompleted && vanillaPlusCompletionData.daily[dailyDate] !== true) {
      vanillaPlusCompletionData.daily[dailyDate] = true;
      vanillaPlusFileCache.dailyFiles.push({
        daily: {
          ...fakeData.daily,
          date: dailyDate,
          accountName: accountName,
          wallet: walletWallet,
          randomString: randomString // Add random string
        }
      });
      vanillaPlusFileCache.count += 1;
      newDaily = true;
    }

    if (weeklyCompleted && vanillaPlusCompletionData.weekly[weeklyWeek] !== true) {
      vanillaPlusCompletionData.weekly[weeklyWeek] = true;
      vanillaPlusFileCache.weeklyFiles.push({
        weekly: {
          ...fakeData.weekly,
          week: weeklyWeek,
          accountName: accountName,
          wallet: walletWallet,
          randomString: randomString // Add random string
        }
      });
      vanillaPlusFileCache.count += 1;
      newWeekly = true;
    }

    let dailySuccess = false;
    let weeklySuccess = false;



    if (newDaily || newWeekly) {


      if (newDaily) {
        const dailyCache = { ...fakeData.daily, date: dailyDate, accountName: accountName, wallet: walletWallet, randomString: randomString};
        const dailyUpload = {
          game: "vanilla-plus",
          type: "daily",
          accountName : accountName,
          wallet: walletWallet,
          cache: dailyCache
        };
        console.log("logtoServer daily");
        dailySuccess = await logToServer(dailyUpload);
        mainWindow.webContents.send("log-update", {
          success: dailySuccess,
          message: dailySuccess ? "Fake daily completion logged!" : "Failed to log fake daily"
        });
      }

      if (newWeekly) {
        const weeklyCache = { ...fakeData.weekly, week: weeklyWeek, accountName: accountName, wallet: walletWallet, randomString: randomString };
        const weeklyUpload = {
          game: "vanilla-plus",
          type: "weekly",
          accountName : accountName,
          wallet: walletWallet,
          cache: weeklyCache
        };
        console.log("logtoServer weekly");
        weeklySuccess = await logToServer(weeklyUpload);
        mainWindow.webContents.send("log-update", {
          success: weeklySuccess,
          message: weeklySuccess ? "Fake weekly completion logged!" : "Failed to log fake weekly"
        });
      }
      store.set("vanillaPlusFileCache", vanillaPlusFileCache);
      store.set("vanillaPlusCompletionData", vanillaPlusCompletionData);
      return {
        success: dailySuccess && weeklySuccess,
        message: (newDaily && newWeekly) ? "Fake daily & weekly test completed" : newDaily ? "Fake daily test completed" : "Fake weekly test completed"
      };
    } else {
       console.log("no new data to test")
      mainWindow.webContents.send("log-update", {
        success: true,
        message: "No new fake completions to log"
      });
      return { success: true, message: "No new fake data" };
    }
  } catch (err) {
    console.error("Test auth-ping error:", { error: err.message });
    mainWindow.webContents.send("log-update", {
      success: false,
      message: `Test auth-ping error: ${err.message}`
    });
    return { success: false, message: err.message };
  }
});

























function checkRSAKeyPair(publicKey, privateKey) {
  try {
    // Validate PEM format
    if (!publicKey.includes('-----BEGIN PUBLIC KEY-----') || !publicKey.includes('-----END PUBLIC KEY-----')) {
      throw new Error('Invalid public key: Missing PEM headers');
    }
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || !privateKey.includes('-----END PRIVATE KEY-----')) {
      throw new Error('Invalid private key: Missing PEM headers');
    }

    // Test message
    const testMessage = 'RSA_KEY_PAIR_TEST';
    const testBuffer = Buffer.from(testMessage);

    // Encrypt with public key
    const encrypted = crypto.publicEncrypt(
      { key: publicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
      testBuffer
    );

    // Decrypt with private key
    const decrypted = crypto.privateDecrypt(
      { key: privateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
      encrypted
    ).toString('utf8');

    // Check if decrypted matches original
    if (decrypted !== testMessage) {
      throw new Error('Key pair mismatch: Decrypted message does not match original');
    }

    console.log('RSA key pair is valid and matches');
    return true;
  } catch (err) {
    console.error('RSA key pair check failed:', { error: err.message });
    return false;
  }
}
// Generate RSA keypair on app boot
function generateRSAKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  console.log('Generated RSA Public Key:', `|${publicKey}|`);
  console.log('Generated RSA Private Key:', `|${privateKey}|`);
  checkRSAKeyPair(publicKey, privateKey);

  return { publicKey, privateKey };
}
// generateRSAKeyPair();
async function testPingServer() {
  try {
    const response = await fetch("http://localhost:3000/api/test-ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });

    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    const { success } = await response.json();
    mainWindow.webContents.send("ping-update", {
      success,
      message: success ? "Test ping successful!" : "Test ping failed"
    });
    return { success, message: success ? "Test ping successful!" : "Test ping failed" };
  } catch (err) {
    console.error("Test ping error:", { error: err.message });
    mainWindow.webContents.send("ping-update", {
      success: false,
      message: `Test ping error: ${err.message}`
    });
    return { success: false, message: err.message };
  }
}












const serverPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtr05QuNNrWGFhWNnG55v
Q8OGq+On0wi/fdy0Vx5D5P8BNuG4Sje2CmR4shvM47tvzPrwt0v+rpQ7Em1rI0eS
4PZl9VYFiFdmnedQJII0lLaIY4WHT+Ouj9cggGDDnLE6+OWzu9l1vw6j2QNjWlI3
zuXasf0angLgJsFE+7Q7KlV1oaqW0OgHkw0xScIM1ghmSy5YxB0oPsSroYUHcM0I
vxzbTS9sJa+iaPi/2GBu+2qdfnyt/QFEmLzhlzrJajHP6OHZgrfPhynNCfDZDlBm
IZmFo77kw+aduHKCPM8nRg7+NSOck6xBX0zVL/UyO7b52+aPpZF2qbCRdDBYLcWI
awIDAQAB
-----END PUBLIC KEY-----`;

const allowedServers = ["Dreamscythe", "NightSlayer", "Maladath"];
const AddonHash = process.env.ADDONHASH || 'HARDCODED_ADDONHASH_PLACEHOLDER'; // this is .lua and .toc sha-256 hashed, added and sha-256 hashed once again. the order is a-z. so .luaHash + .tocHash = addonHash. dont fuck up retard... -10 million dolla
const ADDON_NAME = "Vanilla-Plus"; // Hardcode your addon name here
const VanillaHash = process.env.VANILLAHASH || 'HARDCODED_VANILLAHASH_PLACEHOLDER';
if (!serverPublicKey.includes('-----BEGIN PUBLIC KEY-----') || !serverPublicKey.includes('-----END PUBLIC KEY-----')) {
  console.error('Invalid serverPublicKey: Missing PEM headers');
  throw new Error('Invalid serverPublicKey');
}
// Use process.env.SECRET in dev, hardcoded in build (handled by obfuscate.js)
const secret = process.env.SECRET || 'HARDCODED_SECRET_PLACEHOLDER';
const ghToken = process.env.GH_TOKEN || 'HARDCODED_GH_TOKEN_PLACEHOLDER';



console.log("secret", secret ? "set" : "not set");
console.log("ghToken", ghToken ? "set" : "not set");

// Warn if environment variables are missing in development only
if (isDev()) {
  if (!process.env.GH_TOKEN) {
    log.warn("[Env] GH_TOKEN is not set; updates may fail in development");
  }
  if (!process.env.SECRET) {
    log.warn("[Env] SECRET is not set; app functionality may be affected");
  }
}












































let mainWindow = null;
app.on("ready", async () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 700,
      webPreferences: {
          preload: getPreloadPath(),
          contextIsolation: true,
          nodeIntegration: false
      },
  });

  // --- LOG FORWARDING SETUP (runs in BOTH dev and prod) ---
  const logBuffer = [];
  let rendererReady = false;

  const sendLog = (type, args) => {
      if (rendererReady && mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('main-process-log', [type, ...args]);
      } else {
          logBuffer.push([type, ...args]);
      }
  };

  ipcMain.once('renderer-ready', () => {
      rendererReady = true;
      logBuffer.forEach(entry => {
          if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('main-process-log', entry);
          }
      });
      logBuffer.length = 0;
  });

  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  console.log = (...args) => {
      originalConsoleLog(...args);
      sendLog('log', args);
  };
  console.error = (...args) => {
      originalConsoleError(...args);
      sendLog('error', args);
  };
  // --- END LOG FORWARDING SETUP ---

  if (isDev()) {
      mainWindow.loadURL("http://localhost:5123");
  } else {
      mainWindow.loadFile(path.join(app.getAppPath(), "/dist-react/index.html"));
      mainWindow.webContents.openDevTools();
  }

  console.log('Main process started');
  checkAutoUpdateStatus();
});




app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
// IPC handler to get app version
ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});
























pkg.autoUpdater.logger = log;
pkg.autoUpdater.autoDownload = true;
pkg.autoUpdater.autoInstallOnAppQuit = true;


// Configure autoUpdater for private repository
pkg.autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'PrivatePepega',
  repo: 'GuildBank-App',
  private: true,
  token: ghToken
});


async function checkAutoUpdateStatus() {
  log.info("[AutoUpdateStatus] Checking auto-update configuration...");
  // Show "Checking for updates..." dialog with OK button
  const response = await dialog.showMessageBox(mainWindow, {
    type: "info",
    title: "Checking for Updates",
    message: "Checking for updates, please press OK to continue...",
    buttons: ["OK"],
    defaultId: 0,
  });

  if (response.response === 0) {
    // User clicked OK, proceed with checks
    // Check GH_TOKEN validity
    try {
      const userResponse = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `token ${ghToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        log.info(`[AutoUpdateStatus] GH_TOKEN is valid for user: ${userData.login}`);
      } else {
        log.warn(`[AutoUpdateStatus] GH_TOKEN is invalid (status: ${userResponse.status})`);
        dialog.showErrorBox("Update Error", `Invalid GH_TOKEN (status: ${userResponse.status})`);
        return;
      }
      const repoResponse = await fetch("https://api.github.com/repos/PrivatePepega/GuildBank-App", {
        headers: {
          Authorization: `token ${ghToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
      if (repoResponse.ok) {
        log.info("[AutoUpdateStatus] GH_TOKEN has access to repo: PrivatePepega/GuildBank-App");
      } else {
        log.warn(`[AutoUpdateStatus] GH_TOKEN lacks access to repo (status: ${repoResponse.status})`);
        dialog.showErrorBox("Update Error", `GH_TOKEN lacks repo access (status: ${repoResponse.status})`);
        return;
      }
    } catch (error) {
      log.warn(`[AutoUpdateStatus] Failed to validate GH_TOKEN: ${error.message}`);
      dialog.showErrorBox("Update Error", `Failed to validate GH_TOKEN: ${error.message}`);
      return;
    }

    // Check for updates
    if (isDev()) {
      log.info("[AutoUpdateStatus] Running in development; update check will occur in packaged app");
      return;
    }
    await checkForUpdates();
    setInterval(async () => {
      log.info("[AutoUpdater] Background check triggered");
      await checkForUpdates(true);
  }, 30 * 60 * 1000);
  }
}

async function checkForUpdates(silent = false) {
  log.info("[AutoUpdater] Initiating update check");
  try {
    const updateCheckResult = await pkg.autoUpdater.checkForUpdates();
    const currentVersion = app.getVersion();
    const latestVersion = updateCheckResult?.updateInfo?.version;

        // Normalize versions to handle potential "v" prefix or formatting issues
        if (latestVersion && latestVersion.startsWith("v")) {
          latestVersion = latestVersion.replace(/^v/, "");
        }
        if (currentVersion && currentVersion.startsWith("v")) {
          currentVersion = currentVersion.replace(/^v/, "");
        }

        log.info(`[AutoUpdater] Current version: ${currentVersion}, Latest version: ${latestVersion || "unknown"}`);


    if (!latestVersion || currentVersion === latestVersion) {
      // No update available or already on latest version
      log.info(`[AutoUpdater] No update needed. Current version: ${currentVersion}, Latest version: ${latestVersion || "unknown"}`);
      mainWindow?.webContents.send("update-status", "App is up to date");
      // Show "You're up to date, fren!" dialog
      await dialog.showMessageBox(mainWindow, {
        type: "info",
        title: "Up to Date",
        message: "You're up to date, fren!",
        buttons: ["OK"],
        defaultId: 0,
      });
      return;
    }

    // Update available
    log.info(`[AutoUpdater] Update available: v${latestVersion}`);
    const response = await dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "Update Available",
      message: `A new version (v${latestVersion}) is available. Current version: v${currentVersion}.`,
      buttons: ["Download", "Close"],
      defaultId: 0,
      cancelId: 1,
    });
    if (response.response === 0) {
      // User clicked "Download"
      log.info("[AutoUpdater] Starting download");
      // Show downloading dialog
      const downloadingDialogPromise = dialog.showMessageBox(mainWindow, {
        type: "info",
        title: "Downloading Update",
        message: "Downloading update, please wait... press ok,",
        buttons: [], // No buttons to prevent closing during download
        noLink: true,
      });
      mainWindow?.webContents.send("update-status", "Downloading update...");
      await pkg.autoUpdater.downloadUpdate();
      await downloadingDialogPromise; // Ensure dialog is shown until download completes
      log.info("[AutoUpdater] Closing downloading dialog");
    } else {
      // User clicked "Close"
      log.info("[AutoUpdater] User chose to close the app");
      app.quit();
    }
  } catch (err) {
    log.error(`[AutoUpdater] Check for updates failed: ${err.message}`);
    dialog.showErrorBox("Update Error", `Failed to check for updates: ${err.message}`);
  }
}

// Auto-updater event handlers
pkg.autoUpdater.on("checking-for-update", () => {
  log.info("[AutoUpdater] Checking for updates...");
  mainWindow?.webContents.send("update-status", "Checking for updates...");
});

pkg.autoUpdater.on("update-available", (info) => {
  log.info(`[AutoUpdater] Update available: v${info.version}`);
  mainWindow?.webContents.send("update-status", `Update available: v${info.version}`);
});

pkg.autoUpdater.on("update-not-available", () => {
  log.info("[AutoUpdater] No update available");
  mainWindow?.webContents.send("update-status", "No updates available");
});

pkg.autoUpdater.on("download-progress", (progress) => {
  const progressMsg = `Downloading: ${progress.percent.toFixed(1)}%`;
  log.info(`[AutoUpdater] ${progressMsg}`);
  mainWindow?.webContents.send("update-status", progressMsg);
});

pkg.autoUpdater.on("update-downloaded", async (info) => {
  log.info(`[AutoUpdater] Update downloaded: v${info.version}`);
  mainWindow?.webContents.send("update-status", `Update v${info.version} downloaded`);
  const response = await dialog.showMessageBox(mainWindow, {
    type: "info",
    title: "Update Ready",
    message: `A new version (v${info.version}) is downloaded. Restart to apply it?`,
    buttons: ["Restart Now", "Close"],
    defaultId: 0,
    cancelId: 1,
  });
  if (response.response === 0) {
    log.info("[AutoUpdater] Restarting to apply update");
    pkg.autoUpdater.quitAndInstall();
  } else {
    log.info("[AutoUpdater] User chose to close the app");
    app.quit();
  }
});

pkg.autoUpdater.on("error", (error) => {
  log.error(`[AutoUpdater] Error: ${error.message}`);
  mainWindow?.webContents.send("update-error", `Update failed: ${error.message}`);
  dialog.showErrorBox("Update Error", `Failed to update: ${error.message}`);
});






































// --- Wallet Handlers ---
ipcMain.handle("save-wallet", async (_event, walletData) => {
  try {
    store.set("wallet", walletData);
    console.log("Wallet saved:", walletData);
    return "Wallet saved successfully!";
  } catch (error) {
    console.error("Error saving wallet:", error);
    return "Wallet save error: " + error.message;
  }
});
ipcMain.handle("get-wallet", async () => {
  return store.get("wallet", {});
});
// IPC handler for saving keys (both user and server keys)
ipcMain.handle("save-keys", async (_event, keysData) => {
  try {
    store.set("keys", keysData);
    console.log("Keys saved:", keysData);
    return "Keys saved successfully!";
  } catch (error) {
    console.error("Error saving keys:", error);
    return "Error saving keys: " + error.message;
  }
});
// IPC handler for retrieving saved keys
ipcMain.handle("get-keys", async () => {
  return store.get("keys", { publicKey: "", privateKey: "" });
});

// VanillaPlus
// Handle file selection
ipcMain.handle("select-vanilla-plus-path", async () => {
  const { filePaths } = await dialog.showOpenDialog({
    title: "Select VanillaPlus.exe",
    properties: ["openFile"],
    filters: [{ name: "Executables", extensions: ["exe"] }]
  });
  if (filePaths.length > 0) {
    store.set("vanillaPlusPath", filePaths[0]); // Save to electron-store
    return filePaths[0]; // Return the path to the UI
  }
  return ""; // Ensure we return an empty string instead of null
});
// Get stored VanillaPlus path
ipcMain.handle("get-vanilla-plus-path", () => {
  return store.get("vanillaPlusPath", ""); // Default to empty string if not set
});

ipcMain.handle("save-vanilla-plus-account", async (_event, account) => {
  try {
    // Get the vanillaPlusPath from store, default to empty string if not set
    const vanillaPlusPath = store.get("vanillaPlusPath", "");

    // Validate that vanillaPlusPath exists and is not empty
    if (!vanillaPlusPath) {
      throw new Error("Vanilla Plus path not set in store.");
    }

    const folderPath = path.dirname(vanillaPlusPath);

    // Construct the path to the WTF/Account folder
    const accountPath = path.join(folderPath, "WTF", "Account");

    // Read the list of folders in WTF/Account
    let accountFolders;
    try {
      accountFolders = await fs.readdir(accountPath, { withFileTypes: true });
    } catch (error) {
      throw new Error(`Failed to read account directory: ${error.message}`);
    }

    // Filter for directories and check if the account exists (case-insensitive)
    const accountExists = accountFolders
      .filter((dirent) => dirent.isDirectory())
      .some((dirent) => dirent.name.toLowerCase() === account.toLowerCase());

    // If account doesn't exist, return an error
    if (!accountExists) {
      console.log("Please try again with a valid account.")
      return "Please try again with a valid account.";
    }

    // If account exists, proceed with saving
    store.set("save-vanilla-plus-account", account);
    console.log("save-vanilla-plus-account", account);
    return "save-vanilla-plus-account saved successfully!";
  } catch (error) {
    console.error("Error saving save-vanilla-plus-account:", error);
    return `Error saving save-vanilla-plus-account: ${error.message}`;
  }
});
// IPC handler for retrieving saved keys
ipcMain.handle("get-vanilla-plus-account", async () => {
  return store.get("save-vanilla-plus-account", {});
});

function getSavedVariablesPath() {
  const vanillaPlusLauncherPath = store.get("vanillaPlusPath", "");
  const vanillaPlusPath = path.dirname(vanillaPlusLauncherPath);
  const accountName = store.get("save-vanilla-plus-account", {});
  if (!accountName) {
    console.error("No account name found in store");
    return "";
  }
  const basePath = path.join(vanillaPlusPath, "WTF", "Account", accountName, "SavedVariables");
  const filePath = path.join(basePath, `${ADDON_NAME}.lua`);
  console.log("getSavedVariablesPath returned:", filePath); // Debug
  return filePath;
}
















































// File Tracking
async function trackChanges(filePath, gameExitTime) {
  console.log("Tracking addon triggered for:", filePath);
  const platform = os.platform();
  console.log(`Tracking on platform: ${platform}`); // Debug
  try {
    await fs.access(filePath);
    console.log(`${path.basename(filePath)} exists`);
  } catch (err) {
    console.log(`${path.basename(filePath)} missing after game exit`);
    return false;
  }
  const stats = await fs.stat(filePath);
  const fileModTime = stats.mtime;
  console.log(`File last modified at: ${fileModTime}`);

  return platform === "win32" ? await trackWindows(filePath, gameExitTime) : await trackMacOS(filePath, gameExitTime);
}

async function trackWindows(filePath, gameExitTime) {
  const command = `
    powershell -ExecutionPolicy Bypass -Command "Get-WinEvent -LogName 'Security' -MaxEvents 500 | Where-Object { $_.Id -eq 4663 -and $_.Properties[6].Value -eq '${filePath}' } | Select-Object -Property TimeCreated, @{Name='Access';Expression={$_.Properties[8].Value}}, @{Name='ProcessName';Expression={$_.Properties[10].Value}} | Sort-Object -Property TimeCreated -Descending | ConvertTo-Json"
  `;
  return new Promise((resolve) => {
    sudo.exec(command, { name: 'VanillaPlus Tracker' }, (error, stdout, stderr) => {
      if (error || stderr) {
        console.error('Windows tracking error:', error || stderr);
        resolve(false);
        return;
      }
      const events = JSON.parse(stdout || '[]');
      console.log(`Found ${events.length} security events for ${filePath}`);
      const vanillaPlusPath = store.get("vanillaPlusPath", "").replace(/\\/g, "\\\\");
      for (const event of events) {
        const eventTime = new Date(event.TimeCreated);
        if (eventTime > gameExitTime && (event.Access === 'WriteData' || event.Access === 'Create' || event.Access === 'AppendData')) {
          if (event.ProcessName !== vanillaPlusPath) {
            console.warn('Non-game process tampered with file:', event.ProcessName);
            resolve(false);
            return;
          }
        }
      }
      console.log('No tampering detected after game exit');
      resolve(true);
    });
  });
}

async function trackMacOS(filePath, gameExitTime) {
  const command = `sudo ausearch -f "${filePath}" -k vanilla-plus-audit`;
  return new Promise((resolve) => {
    sudo.exec(command, { name: 'VanillaPlus Tracker' }, (error, stdout, stderr) => {
      if (error || stderr) {
        console.error('macOS tracking error:', error || stderr);
        resolve(false);
        return;
      }
      const lines = stdout.split('\n');
      console.log(`Found ${lines.length} audit lines for ${filePath}`);
      const vanillaPlusPath = store.get("vanillaPlusPath", "");
      for (const line of lines) {
        if (line.includes('type=PATH') && line.includes(`name="${filePath}"`)) {
          const timeMatch = line.match(/time=([^ ]+)/);
          const exeMatch = line.match(/exe="([^"]+)"/);
          if (timeMatch && exeMatch && line.includes('type=WRITE')) {
            const eventTime = new Date(parseInt(timeMatch[1]) * 1000);
            if (eventTime > gameExitTime && exeMatch[1] !== vanillaPlusPath) {
              console.warn('Non-game process tampered with file:', exeMatch[1]);
              resolve(false);
              return;
            }
          }
        }
      }
      console.log('No tampering detected after game exit on macOS');
      resolve(true);
    });
  });
}

async function auditFolder(folderPath, gameExitTime) {
  const platform = os.platform();
  if (platform === 'win32') {
    const command = `
      powershell -ExecutionPolicy Bypass -Command "Get-WinEvent -LogName 'Security' -MaxEvents 500 | Where-Object { $_.Id -eq 4663 -and $_.Properties[6].Value -like '*${folderPath}*' } | Select-Object -Property TimeCreated, @{Name='Access';Expression={$_.Properties[8].Value}}, @{Name='ProcessName';Expression={$_.Properties[10].Value}} | Sort-Object -Property TimeCreated -Descending | ConvertTo-Json"
    `;
    return new Promise((resolve) => {
      sudo.exec(command, { name: 'VanillaPlus Folder Audit' }, (error, stdout, stderr) => {
        if (error || stderr) {
          console.error('Folder audit error:', error || stderr);
          resolve(false);
          return;
        }
        const events = JSON.parse(stdout || '[]');
        console.log(`Found ${events.length} security events for folder ${folderPath}`);
        const vanillaPlusPath = store.get("vanillaPlusPath", "").replace(/\\/g, "\\\\");
        for (const event of events) {
          const eventTime = new Date(event.TimeCreated);
          if (eventTime > gameExitTime && (event.Access === 'WriteData' || event.Access === 'Create' || event.Access === 'AppendData')) {
            if (event.ProcessName !== vanillaPlusPath) {
              console.warn('Non-game process modified addon folder:', event.ProcessName);
              resolve(false);
              return;
            }
          }
        }
        console.log('No tampering detected in addon folder');
        resolve(true);
      });
    });
  } else if (platform === 'darwin') {
    const command = `sudo ausearch -f "${folderPath}" -k vanilla-plus-audit`;
    return new Promise((resolve) => {
      sudo.exec(command, { name: 'VanillaPlus Folder Audit' }, (error, stdout, stderr) => {
        if (error || stderr) {
          console.error('macOS folder audit error:', error || stderr);
          resolve(false);
          return;
        }
        const lines = stdout.split('\n');
        const vanillaPlusPath = store.get("vanillaPlusPath", "");
        for (const line of lines) {
          if (line.includes('type=PATH') && line.includes(`name="${folderPath}"`)) {
            const timeMatch = line.match(/time=([^ ]+)/);
            const exeMatch = line.match(/exe="([^"]+)"/);
            if (timeMatch && exeMatch && line.includes('type=WRITE')) {
              const eventTime = new Date(parseInt(timeMatch[1]) * 1000);
              if (eventTime > gameExitTime && exeMatch[1] !== vanillaPlusPath) {
                console.warn('Non-game process modified addon folder:', exeMatch[1]);
                resolve(false);
                return;
              }
            }
          }
        }
        console.log('No tampering in addon folder on macOS');
        resolve(true);
      });
    });
  }
}





function generateAuditScript(filePath) {
  const platform = os.platform();
  const addonFolder = path.join(path.dirname(store.get("vanillaPlusPath", "")), 'Interface', 'AddOns');
  let scriptContent;

  if (platform === 'win32') {
    scriptContent = `
# Enable global auditing
auditpol /set /category:"Object Access" /success:enable /failure:enable

# Audit addon folder
$acl = Get-Acl -Path "${addonFolder}"
$auditRule = New-Object System.Security.AccessControl.FileSystemAuditRule("Everyone", "CreateFiles,Modify", "Success,Failure")
$acl.SetAuditRule($auditRule)
Set-Acl -Path "${addonFolder}" -AclObject $acl

# Audit SavedVariables folder
$svFolder = "${path.dirname(filePath)}"
$svAcl = Get-Acl -Path "$svFolder"
$svRule = New-Object System.Security.AccessControl.FileSystemAuditRule("Everyone", "CreateFiles,Modify", "Success,Failure")
$svAcl.SetAuditRule($svRule)
Set-Acl -Path "$svFolder" -AclObject $svAcl

# Audit the specific file
$fileAcl = Get-Acl -Path "${filePath}"
$fileRule = New-Object System.Security.AccessControl.FileSystemAuditRule("Everyone", "Modify", "Success,Failure")
$fileAcl.SetAuditRule($fileRule)
Set-Acl -Path "${filePath}" -AclObject $fileAcl
Write-Output "Auditing enabled for addon folder, SavedVariables, and ${filePath}"
`;
    store.set('auditScriptVanillaPlus', { path: 'audit.ps1', content: scriptContent });
    return { path: 'audit.ps1', content: scriptContent };
  } else if (platform === 'darwin') {
    scriptContent = `#!/bin/bash
sudo launchctl load -w /System/Library/LaunchDaemons/com.apple.auditd.plist
sudo auditctl -w "${addonFolder}" -p wa -k vanilla-plus-audit
sudo auditctl -w "${path.dirname(filePath)}" -p wa -k vanilla-plus-audit
sudo auditctl -w "${filePath}" -p wa -k vanilla-plus-audit
echo "Auditing enabled for addon folder, SavedVariables, and ${filePath}"
`;
    store.set('auditScriptVanillaPlus', { path: 'audit.sh', content: scriptContent });
    return { path: 'audit.sh', content: scriptContent };
  } else {
    throw new Error('Unsupported OS');
  }
}
// Function to save script to disk
async function saveScriptToFile(script) {
  await fs.writeFile(script.path, script.content);
  return script.path;
}

// Function to run script with admin rights
function runAuditScript(scriptPath, callback) {
  const platform = os.platform();
  const options = { name: 'VanillaPlus Audit Tool' };
  if (platform === 'win32') {
    sudo.exec(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`, options, (error, stdout, stderr) => {
      callback(error, stdout, stderr);
    });
  } else if (platform === 'darwin') {
    sudo.exec(`bash "${scriptPath}"`, options, (error, stdout, stderr) => {
      callback(error, stdout, stderr);
    });
  }
}



function processKeysIntoPassword(input1, input2) {
  // Step 1: Validate inputs
  if (typeof input1 !== 'string' || typeof input2 !== 'string') {
    throw new Error('Both inputs must be strings');
  }

  // Step 2: Remove all whitespace from both inputs
  const cleaned1 = input1.replace(/\s+/g, '');
  const cleaned2 = input2.replace(/\s+/g, '');

  // Step 3: Combine inputs (concatenate)
  const combined = cleaned1 + cleaned2;

  // Step 4: JSON.stringify the result
  let result;
  try {
    result = JSON.stringify(combined);
  } catch (error) {
    throw new Error('Failed to JSON.stringify the combined input');
  }

  // Step 5: Return the stringified result
  return result;
}



















































async function hashFile(filePath) {
  console.log("hashing file:", filePath);
  if (!filePath.endsWith('.exe')) {
    throw new Error('File must be a .exe file');
  }
  const content = await fs.readFile(filePath);
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  console.log("exe hash" , hash);
  return hash;
}

// Hash a folder recursively
async function hashFolder(folderPath) {
  console.log("hashing folder:", folderPath);
  const files = await fs.readdir(folderPath, { withFileTypes: true });
  const hashes = [];
  for (const file of files) {
    const fullPath = path.join(folderPath, file.name);
    if (file.isDirectory()) {
      hashes.push(await hashFolder(fullPath));
    } else if (file.name.endsWith('.lua') || file.name.endsWith('.toc')) {
      const content = await fs.readFile(fullPath);
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      hashes.push(`${file.name}:${hash}`);
    }
  }
  return crypto.createHash('sha256').update(hashes.sort().join('')).digest('hex');
}










// Scan addons for SavedVariables conflicts
async function checkAddonConflicts(addonFolder) {
  const addonDirs = await fs.readdir(addonFolder, { withFileTypes: true });
  const conflicts = [];
  console.log("checking for conspiracy;");
  for (const dir of addonDirs) {
    if (dir.isDirectory() && dir.name !== ADDON_NAME) {
      console.log("checking addon #?;");
      const tocPath = path.join(addonFolder, dir.name, `${dir.name}.toc`);
      try {
        const tocContent = await fs.readFile(tocPath, 'utf8');
        if (tocContent.includes(`SavedVariables: ${ADDON_NAME}`)) {
          conflicts.push(dir.name);
        }
      } catch (err) {
        // Skip if no .toc
      }
    }
  }
  return conflicts;
}

async function luaToJsonSimple(filePath) {
  try {
    console.log("Parsing Lua file:", filePath);
    const luaContent = await fs.readFile(filePath, "utf8");

    // Default structure matching VanillaPlusData
    const result = {
      daily: { date: "", completed: false, activity: "", playerLog: "" },
      weekly: { week: "", completed: false, activity: "", playerLog: "", bossesKilled: {} },
      character: {
        charUID: "", charName: "", serverName: "", class: "", race: "", faction: "",
        log: {
          bgLog: { date: "", playerEnter: "", playerLog: "", activity: "", completed: false },
          raidLog: { week: "", playerEnter: "", playerLog: "", activity: "", completed: false }
        }
      },
      buttonPos: null,
      framePos: null
    };

    // Extract main table content
    const vanillaPlusMatch = luaContent.match(/VanillaPlusData\s*=\s*{([\s\S]*)}/);
    if (!vanillaPlusMatch) {
      console.error("No VanillaPlusData table found");
      return JSON.stringify({ error: "No VanillaPlusData table found" });
    }

    let content = vanillaPlusMatch[1].trim();

    // Preprocess to convert Lua table to valid JSON
    content = content.replace(/\[\"(\w+)\"\]\s*=/g, '"$1": ');  // ["key"] = -> "key":
    content = content.replace(/=\s*/g, ': ');                  // Any remaining = -> :
    content = content.replace(/,\s*([}\]])/g, '$1');            // Remove trailing , before } or ]
    content = content.replace(/,\s*$/, '');                     // Remove any trailing , at end

    // Parse as JSON and merge with defaults
    const parsed = JSON.parse(`{${content}}`);
    Object.assign(result, parsed);  // Overwrite defaults with parsed data

    // Validate and fill missing data
    const currentDate = new Date().toISOString().split("T")[0];
    const currentWeek = getWeekNumber(new Date());
    if (!result.daily.date && result.daily.completed) result.daily.date = currentDate;
    if (!result.weekly.week && result.weekly.completed) result.weekly.week = currentWeek;

    return JSON.stringify(result, null, 2);
  } catch (error) {
    console.error("Lua parsing error:", error);
    return JSON.stringify({ error: error.message });
  }
}











const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return Math.round(((d - week1) / 86400000 + 1) / 7);
};
function generateRandomString() {
  return crypto.randomBytes(16).toString('hex'); // e.g., "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}

async function runVanillaPlusAuditScript (scriptContent) {
  return new Promise((resolve, reject) => {
    runAuditScript(scriptContent.path, (error, stdout, stderr) => {
      if (error) {
        console.error('Script failed:', { error, stderr }); // Log for debug
        resolve(false); // No reject, just false
      } else {
        // Check if stdout looks good (optional tweak)
        const success = stdout && stdout.includes('Auditing enabled');
        console.log("running Audit Script");
        resolve(success); // True if it worked, false if funky
      }
    });
  });
}












































// Launching game
ipcMain.handle("play-vanilla-plus", async () => {
  const savedVarPath = getSavedVariablesPath();
  const script = generateAuditScript(savedVarPath);
  await saveScriptToFile(script);
  console.log("Audit Script Generating");
  const scriptContent = store.get('auditScriptVanillaPlus');
  if (!scriptContent || !scriptContent.path) {
    throw new Error('No script generated yet');
  }
  console.log("Audit Script Generated");

  const auditScriptRan = await runVanillaPlusAuditScript(scriptContent);
  if(auditScriptRan.res === false){
    return false;
  }
  console.log("Audit Script Ran");

  const wallet = store.get("wallet", null);
  const walletWallet = wallet.wallet;
  const keyPair = store.get("keys", { publicKey: "", privateKey: "" });
  const publicKey = keyPair.publicKey;
  const privateKey = keyPair.privateKey;
  const vanillaPlusPath = store.get("vanillaPlusPath", "");
  const account = store.get("save-vanilla-plus-account", {});
  const accountName = account;

  if (!walletWallet || !privateKey || !publicKey || !accountName || !vanillaPlusPath) {
    console.error("Log failed: Missing wallet or keys or data", { walletWallet, publicKey, privateKey, accountName, vanillaPlusPath });
    return false;
  }


  try {
    // Integrity check
    const addonFolder = path.join(path.dirname(vanillaPlusPath), 'Interface', 'AddOns');
    const yourAddonPath = path.join(addonFolder, ADDON_NAME);
    console.log("Checking addon at:", yourAddonPath); // Log the addon path

    // Integrity check
    const currentHash = await hashFolder(yourAddonPath);
    console.log("Current hash:", currentHash); // Log computed hash
    console.log("Expected hash:", AddonHash); // Log expected hash
    if (currentHash !== AddonHash) {
      console.log("addon hash error");
      mainWindow.webContents.send("log-update", {
        success: false,
        message: "Addon integrity check failed—possible tampering!",
      });
      return { success: false, message: "Addon tampered" };
    }
    // Check for SavedVariables conflicts
    const conflicts = await checkAddonConflicts(addonFolder);

    if (conflicts.length > 0) {
      console.log("addon conspiracy found;");
      mainWindow.webContents.send("log-update", {
        success: false,
        message: `Conflicting addons detected: ${conflicts.join(', ')}`,
      });
      return { success: false, message: "Addon conflict detected" };
    }
    console.log("no conspiracies found, proceed nerd,")


   const userVanillaHash = await hashFile(vanillaPlusPath);
   console.log("user .exe hash is", userVanillaHash);
   console.log("expected app .exe hash is", VanillaHash);
    if(userVanillaHash != VanillaHash){
      console.log(".exe conspiracy found;");
      mainWindow.webContents.send("log-update", {
        success: false,
        message: `Conflicting .exe detected: ${conflicts.join(', ')}`,
      });
      return { success: false, message: ".exe conflict detected" };
    }
    console.log("exe hash match expected exe hash");




    // Launch game
    const child = spawn(vanillaPlusPath, [], { detached: true, stdio: "ignore" });
    child.unref();
    console.log(`VanillaPlus launched with PID: ${child.pid}`);
    let gameExitTime;
    await new Promise((resolve) => {
      child.on('exit', () => {
        gameExitTime = new Date();
        console.log('Game closed at:', gameExitTime);
        resolve();
      });
    });
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Audit on close
    const filePath = getSavedVariablesPath();
    const addonAudit = await auditFolder(addonFolder, gameExitTime);
    const fileAudit = await trackChanges(filePath, gameExitTime);
    const isLegit = addonAudit && fileAudit;

    if (!isLegit) {
      mainWindow.webContents.send("log-update", {
        success: false,
        message: "Tampering detected in addon folder or SavedVariables!",
      });
      return { success: false, message: "Post-game tampering detected" };
    }

    // Generate random string after parsing
    const randomString = generateRandomString();
    console.log("Generated random string:", randomString);

    const parsedData = await luaToJsonSimple(filePath);
    if (parsedData && !parsedData.error) {
      console.log("data parsed", parsedData);
      const dataObj = JSON.parse(parsedData);
      console.log("data to json", dataObj);


    // Server name filter
    const serverName = dataObj.character?.serverName || "";
    if (!allowedServers.includes(serverName)) {
      console.log("Invalid server:", serverName);
      mainWindow.webContents.send("log-update", {
        success: false,
        message: `Wrong server: ${serverName}. Allowed servers: ${allowedServers.join(", ")}`,
      });
      return { success: false, message: "Wrong server" };
    }
    console.log("Server validated:", serverName);




      const currentDate = new Date().toISOString().split("T")[0];
      const currentWeek = getWeekNumber(new Date());
      console.log("current week", currentWeek);
      if (!store.has("vanillaPlusCompletionData")) store.set("vanillaPlusCompletionData", { daily: {}, weekly: {} });
      if (!store.has("vanillaPlusFileCache")) store.set("vanillaPlusFileCache", { dailyFiles: [], weeklyFiles: [], count: 0 });
      const vanillaPlusCompletionData = store.get("vanillaPlusCompletionData");
      const vanillaPlusFileCache = store.get("vanillaPlusFileCache");
      console.log("vanillaPlusCompletionData", vanillaPlusCompletionData);
      console.log("vanillaPlusFileCache", vanillaPlusFileCache);
      const dailyCompleted = dataObj.daily?.completed || false;
      const weeklyCompleted = dataObj.weekly?.completed || false;
      const dailyDate = dataObj.daily?.date || currentDate;
      const weeklyWeek = dataObj.weekly?.week || currentWeek;
      let newDaily = false;
      let newWeekly = false;
      const account = store.get("save-vanilla-plus-account", {});
      const userPaswordAdded = processKeysIntoPassword(publicKey, privateKey);
      const addingPassword = account +  userPaswordAdded;
      const accountHash = crypto.createHash('sha256').update(addingPassword).digest('hex');
      const accountName = accountHash;
      console.log("account: " , account);
      console.log("accountName hashed: ", accountName);
      const wallet = store.get("wallet", null);
      console.log("wallet: ", wallet);
      const walletWallet = wallet.wallet;
      console.log("walletWallet: ", walletWallet);



      if (dailyCompleted && vanillaPlusCompletionData.daily[dailyDate] !== true) {
        vanillaPlusCompletionData.daily[dailyDate] = true;
        vanillaPlusFileCache.dailyFiles.push({
          daily: {
            ...dataObj.daily,
            date: dailyDate,
            accountName: accountName,
            wallet: walletWallet,
            randomString: randomString // Add random string
          }
        });
        vanillaPlusFileCache.count += 1;
        newDaily = true;
      }

      if (weeklyCompleted && vanillaPlusCompletionData.weekly[weeklyWeek] !== true) {
        vanillaPlusCompletionData.weekly[weeklyWeek] = true;
        vanillaPlusFileCache.weeklyFiles.push({
          weekly: {
            ...dataObj.weekly,
            week: weeklyWeek,
            accountName: accountName,
            wallet: walletWallet,
            randomString: randomString
          }
        });
        vanillaPlusFileCache.count += 1;
        newWeekly = true;
      }

      if (newDaily || newWeekly) {
        if (newDaily && isLegitCheck) {
          const dailyUpload = { 
            game: "vanilla-plus", 
            type: "daily",
            accountName: accountName,
            wallet: walletWallet,
            cache: { 
              ...dataObj.daily, 
              date: dailyDate, 
              accountName: accountName,
              wallet: walletWallet,
              randomString: randomString
            }
          };          
          const dailySuccess = await logToServer(dailyUpload);
          mainWindow.webContents.send("log-update", {
            success: dailySuccess,
            message: dailySuccess ? "Daily completion logged!" : "Failed to log daily",
          });
        }

        if (newWeekly && isLegitCheck) {
          const weeklyUpload = { 
            game: "vanilla-plus", 
            type: "weekly", 
            accountName: accountName,
            wallet: walletWallet,
            cache: { 
              ...dataObj.weekly, 
              week: weeklyWeek,
              accountName: accountName,
              wallet: walletWallet,
              randomString: randomString
            }
          };          
          const weeklySuccess = await logToServer(weeklyUpload);
          mainWindow.webContents.send("log-update", {
            success: weeklySuccess,
            message: weeklySuccess ? "Weekly completion logged!" : "Failed to log weekly",
          });
        }
        store.set("vanillaPlusFileCache", vanillaPlusFileCache);
        store.set("vanillaPlusCompletionData", vanillaPlusCompletionData);
        return {
          success: true,
          isLegit: true,
          message: (newDaily && newWeekly) ? "Daily & weekly logged" : newDaily ? "Daily logged" : "Weekly logged",
        };
      } else {
        console.log("no new data to log to server, thank you for funning fren!")
        mainWindow.webContents.send("log-update", {
          success: true,
          message: "No new completions to log",
        });
        return { success: true, isLegit: true, message: "No new data" };
      }
    } else {
      const errorMsg = parsedData?.error || "Failed to parse addon data";
      console.error("Parsing failed:", errorMsg);
      return { success: false, message: errorMsg };
    }
  } 
  catch (error) {
    console.error('Error launching Vanilla Plus:', error);
    return { success: false, message: error.message };
  }
});
























async function logToServer(dataUpload) {
  console.log("log to server triggered")
  const walletRaw = store.get("wallet", null);
  const wallet = walletRaw.wallet;

  const keyPair = store.get("keys", { publicKey: "", privateKey: "" });
  const publicKey = keyPair.publicKey;
  const privateKey = keyPair.privateKey;

  if (!wallet || !privateKey || !publicKey) {
    console.error("Log failed: Missing wallet or keys", { wallet, publicKey });
    return false;
  }

  try {
    const fileHash = crypto.createHash('sha256').update(JSON.stringify(dataUpload.cache)).digest('hex');
    const gameName = dataUpload.game;
    const type = dataUpload.type;
    const accountName = dataUpload.accountName;
    const timeField = type === "daily" ? dataUpload.cache.date : dataUpload.cache.week;
    // Hash userPassword to reduce payload size
    const userPaswordAdded = processKeysIntoPassword(publicKey, privateKey);
    const userPassword = crypto.createHash('sha256').update(userPaswordAdded).digest('hex');
    const payload = `${fileHash}:${gameName}:${secret}:${userPassword}:${type}:${timeField}:${accountName}`;

    // Log payload size for debugging
    console.log('Payload size:', Buffer.from(payload).length, 'bytes');

    // Encrypt with RSA public key
    let encryptedPayload;
    try {
      encryptedPayload = crypto.publicEncrypt(
        { key: serverPublicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
        Buffer.from(payload)
      ).toString('base64');
    } catch (err) {
      console.error('RSA encryption error:', { error: err.message, keySnippet: serverPublicKey.substring(0, 50) });
      throw err;
    }

    // const response = await fetch('http://vanilla-plus.com/api/auth-ping', {
      const response = await fetch('http://localhost:3000/api/auth-ping', {

      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet, publicKey, signedMessage: encryptedPayload, game: dataUpload.game, type, cache: dataUpload.cache })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    console.log("payload successfully recieved!")
    const { success } = await response.json();
    return success;
  } catch (err) {
    console.error("Log failed:", { error: err.message, type: dataUpload.type });
    return false;
  }
}

ipcMain.handle("export-vanilla-plus-files", async () => {
  console.log("export vanilla plus files triggered");
  const vanillaPlusFileCache = store.get("vanillaPlusFileCache", { dailyFiles: [], weeklyFiles: [], count: 0 });
  if (vanillaPlusFileCache.dailyFiles.length === 0 && vanillaPlusFileCache.weeklyFiles.length === 0) {
    mainWindow.webContents.send("export-update", {
      success: false,
      message: "No completion data to export"
    });
    return { success: false, message: "No data to export" };
  }

  const exportData = {
    dailyFiles: vanillaPlusFileCache.dailyFiles,
    weeklyFiles: vanillaPlusFileCache.weeklyFiles,
    count: vanillaPlusFileCache.count
  };
  const jsonContent = JSON.stringify(exportData, null, 2);

  // Use Electron's app.getPath('desktop') for the actual user Desktop
  const desktopPath = app.getPath('desktop');
  const filePath = path.join(desktopPath, "vanilla_plus_file_cache.json");

  try {
    console.log('Exporting to:', filePath); // Debug path
    await fs.mkdir(desktopPath, { recursive: true });
    await fs.writeFile(filePath, jsonContent, { encoding: 'utf8', mode: 0o666 });
    // Ensure file is not hidden (Windows)
    if (process.platform === 'win32') {
      try {
        await fs.chmod(filePath, 0o666); // Ensure writable
        // Remove hidden attribute (Windows)
        const { exec } = require('child_process');
        await new Promise((resolve, reject) => {
          exec(`attrib -h "${filePath}"`, (err) => (err ? reject(err) : resolve()));
        });
      } catch (err) {
        console.warn('Failed to clear hidden attribute:', err.message);
      }
    }
    // Clear the cache after successful export
    store.delete("vanillaPlusFileCache");
    console.log('Cleared vanillaPlusFileCache from store');
    mainWindow.webContents.send("export-update", {
      success: true,
      message: `File exported to Desktop: ${filePath}`
    });
    return { success: true, filePath };
  } catch (err) {
    console.error("Export error:", { error: err.message, filePath });
    mainWindow.webContents.send("export-update", {
      success: false,
      message: `Failed to export file: ${err.message}`
    });
    return { success: false, message: err.message };
  }
});
ipcMain.handle("return-VanillaCache-Count", async () => {
  const vanillaPlusFileCache = store.get("vanillaPlusFileCache", { dailyFiles: [], weeklyFiles: [], count: 0 });
  return vanillaPlusFileCache.count;
})





























