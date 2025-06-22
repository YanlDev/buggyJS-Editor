"use strict";
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electronAPI", {
  // Eventos del menú
  onMenuNewFile: (callback) => ipcRenderer.on("menu-new-file", callback),
  onMenuRunCode: (callback) => ipcRenderer.on("menu-run-code", callback),
  onMenuClearConsole: (callback) => ipcRenderer.on("menu-clear-console", callback),
  // Remover listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  // Información de la aplicación
  platform: process.platform,
  isElectron: true
});
window.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("wheel", (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
    }
  }, { passive: false });
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && (e.key === "+" || e.key === "-" || e.key === "0")) {
      if (e.key !== "Enter" && e.key !== "Delete") {
        e.preventDefault();
      }
    }
  });
});
