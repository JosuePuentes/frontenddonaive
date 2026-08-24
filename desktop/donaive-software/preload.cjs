/**
 * Puente seguro: marca escritorio local + persistencia en disco.
 */
const { contextBridge, ipcRenderer } = require("electron");
const path = require("path");
const os = require("os");

const dataPath =
  ipcRenderer.sendSync("ds-get-data-path-sync") ||
  path.join(os.homedir(), ".config", "donaive-software-desktop", "local-db");

contextBridge.exposeInMainWorld("donaiveDesktop", {
  isDesktop: true,
  platform: process.platform,
  version: "1.1.0",
  dataPath,
  storage: {
    getItem(key) {
      return ipcRenderer.sendSync("ds-storage-get", key);
    },
    setItem(key, value) {
      ipcRenderer.sendSync("ds-storage-set", key, value);
    },
    removeItem(key) {
      ipcRenderer.sendSync("ds-storage-remove", key);
    },
  },
  openDataFolder() {
    return ipcRenderer.invoke("ds-open-data-folder");
  },
});
