/**
 * Donaive Software — proceso Electron (app local, no navegador).
 */
const { app, BrowserWindow, shell, Menu } = require("electron");
const path = require("path");
const fs = require("fs");

const isDev = !app.isPackaged;

function uiIndexPath() {
  if (isDev) {
    return path.join(__dirname, "dist-ui", "index.html");
  }
  return path.join(process.resourcesPath, "dist-ui", "index.html");
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    title: "Donaive Software",
    backgroundColor: "#0c1117",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const indexHtml = uiIndexPath();
  if (!fs.existsSync(indexHtml)) {
    win.loadURL(
      "data:text/html;charset=utf-8," +
        encodeURIComponent(
          "<h1 style='font-family:sans-serif;padding:2rem'>Falta el build de la UI.<br/>Ejecute npm run desktop:build</h1>",
        ),
    );
    return win;
  }

  win.loadFile(indexHtml, { hash: "/" });

  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  return win;
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
