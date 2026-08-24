/**
 * Donaive Software — proceso principal Electron.
 * Sistema local: UI empaquetada + base de datos JSON en disco del usuario.
 */
const { app, BrowserWindow, shell, Menu, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

const isDev = !app.isPackaged;
const APP_VERSION = "1.1.0";

function uiIndexPath() {
  if (isDev) {
    return path.join(__dirname, "dist-ui", "index.html");
  }
  return path.join(process.resourcesPath, "dist-ui", "index.html");
}

function dataDir() {
  const dir = path.join(app.getPath("userData"), "local-db");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function dbFilePath() {
  return path.join(dataDir(), "donaive-software.json");
}

function readDb() {
  try {
    const file = dbFilePath();
    if (!fs.existsSync(file)) return {};
    const raw = fs.readFileSync(file, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeDb(store) {
  const file = dbFilePath();
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), "utf8");
  fs.renameSync(tmp, file);
}

function registerStorageIpc() {
  ipcMain.on("ds-storage-get", (event, key) => {
    const store = readDb();
    event.returnValue =
      typeof key === "string" && Object.prototype.hasOwnProperty.call(store, key)
        ? store[key]
        : null;
  });

  ipcMain.on("ds-storage-set", (event, key, value) => {
    if (typeof key !== "string") {
      event.returnValue = false;
      return;
    }
    const store = readDb();
    store[key] = String(value ?? "");
    writeDb(store);
    event.returnValue = true;
  });

  ipcMain.on("ds-storage-remove", (event, key) => {
    if (typeof key !== "string") {
      event.returnValue = false;
      return;
    }
    const store = readDb();
    delete store[key];
    writeDb(store);
    event.returnValue = true;
  });

  ipcMain.on("ds-get-data-path-sync", (event) => {
    event.returnValue = dataDir();
  });

  ipcMain.handle("ds-open-data-folder", async () => {
    await shell.openPath(dataDir());
  });
}

function buildMenu(win) {
  const template = [
    {
      label: "Archivo",
      submenu: [
        {
          label: "Abrir carpeta de datos…",
          click: () => {
            void shell.openPath(dataDir());
          },
        },
        { type: "separator" },
        { role: "quit", label: "Salir" },
      ],
    },
    {
      label: "Ver",
      submenu: [
        { role: "reload", label: "Recargar" },
        { role: "togglefullscreen", label: "Pantalla completa" },
        { type: "separator" },
        { role: "resetZoom", label: "Zoom normal" },
        { role: "zoomIn", label: "Acercar" },
        { role: "zoomOut", label: "Alejar" },
      ],
    },
    {
      label: "Ayuda",
      submenu: [
        {
          label: "Acerca de Donaive Software",
          click: () => {
            dialog.showMessageBox(win, {
              type: "info",
              title: "Donaive Software",
              message: "Donaive Software",
              detail: [
                `Versión ${APP_VERSION}`,
                "Sistema administrativo local (POS, inventario, finanzas).",
                "",
                `Datos en este PC:`,
                dataDir(),
              ].join("\n"),
            });
          },
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    title: "Donaive Software",
    backgroundColor: "#0c1117",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  buildMenu(win);

  const indexHtml = uiIndexPath();
  if (!fs.existsSync(indexHtml)) {
    win.loadURL(
      "data:text/html;charset=utf-8," +
        encodeURIComponent(
          "<h1 style='font-family:sans-serif;padding:2rem'>Falta el build de la UI.<br/>Ejecute npm run desktop:build</h1>",
        ),
    );
    win.show();
    return win;
  }

  win.loadFile(indexHtml, { hash: "/" });
  win.once("ready-to-show", () => win.show());

  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  return win;
}

app.whenReady().then(() => {
  dataDir();
  registerStorageIpc();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
