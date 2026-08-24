/**
 * Puente seguro hacia el renderer: marca que la app corre en escritorio local.
 */
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("donaiveDesktop", {
  isDesktop: true,
  platform: process.platform,
  version: "1.0.0",
});
