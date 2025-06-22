const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("path");
const isDev = process.env.NODE_ENV === "development";
let mainWindow;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, "../src/img/LogoEditorV2.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js")
    },
    show: false,
    // No mostrar hasta que esté listo
    titleBarStyle: "default",
    autoHideMenuBar: false
  });
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.focus();
    }
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== "http://localhost:5173" && !isDev) {
      event.preventDefault();
    }
  });
}
function createMenu() {
  const template = [
    {
      label: "Archivo",
      submenu: [
        {
          label: "Nuevo",
          accelerator: "CmdOrCtrl+N",
          click: () => {
            mainWindow.webContents.send("menu-new-file");
          }
        },
        { type: "separator" },
        {
          label: "Salir",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: "Editar",
      submenu: [
        { role: "undo", label: "Deshacer" },
        { role: "redo", label: "Rehacer" },
        { type: "separator" },
        { role: "cut", label: "Cortar" },
        { role: "copy", label: "Copiar" },
        { role: "paste", label: "Pegar" },
        { role: "selectall", label: "Seleccionar todo" }
      ]
    },
    {
      label: "Código",
      submenu: [
        {
          label: "Ejecutar",
          accelerator: "CmdOrCtrl+Enter",
          click: () => {
            mainWindow.webContents.send("menu-run-code");
          }
        },
        {
          label: "Limpiar Consola",
          accelerator: "CmdOrCtrl+Delete",
          click: () => {
            mainWindow.webContents.send("menu-clear-console");
          }
        }
      ]
    },
    {
      label: "Ver",
      submenu: [
        { role: "reload", label: "Recargar" },
        { role: "forceReload", label: "Forzar recarga" },
        { role: "toggleDevTools", label: "Herramientas de desarrollador" },
        { type: "separator" },
        { role: "resetZoom", label: "Zoom normal" },
        { role: "zoomin", label: "Acercar" },
        { role: "zoomout", label: "Alejar" },
        { type: "separator" },
        { role: "togglefullscreen", label: "Pantalla completa" }
      ]
    },
    {
      label: "Ayuda",
      submenu: [
        {
          label: "Acerca de EzJS",
          click: () => {
            const { dialog } = require("electron");
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "Acerca de EzJS",
              message: "EzJS - Editor de JavaScript",
              detail: "Un editor de JavaScript moderno y rápido.\n\nVersión: 1.0.0"
            });
          }
        }
      ]
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
app.whenReady().then(() => {
  createWindow();
  createMenu();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("web-contents-created", (event, contents) => {
  contents.on("new-window", (event2, navigationUrl) => {
    event2.preventDefault();
    shell.openExternal(navigationUrl);
  });
});
