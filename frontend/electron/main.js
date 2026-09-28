import {
  app,
  BrowserWindow,
  shell,
  session,
  dialog,
} from "electron";

import electronUpdater from "electron-updater";

import path from "path";
import { fileURLToPath } from "url";

const { autoUpdater } = electronUpdater;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_URL = "https://webdrop-eight.vercel.app/";
const APP_ORIGIN = new URL(APP_URL).origin;

let mainWindow = null;

/* ------------------------------------------------------------
   AUTO UPDATER
------------------------------------------------------------ */

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

function checkForUpdates() {
  if (!app.isPackaged) return;

  autoUpdater.checkForUpdates().catch((error) => {
    console.log("Update check failed:", error.message);
  });
}

/* ------------------------------------------------------------
   UPDATE AVAILABLE
------------------------------------------------------------ */

autoUpdater.on("update-available", async (info) => {
  if (!mainWindow) return;

  const result = await dialog.showMessageBox(mainWindow, {
    type: "info",
    title: "WebDrop Update Available",
    message: `WebDrop ${info.version} is available.`,
    detail:
      "A new version of WebDrop is available. Do you want to download it now?",
    buttons: ["Update Now", "Later"],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  });

  if (result.response === 0) {
    try {
      await autoUpdater.downloadUpdate();
    } catch (error) {
      if (!mainWindow) return;

      dialog.showMessageBox(mainWindow, {
        type: "error",
        title: "Update Failed",
        message: "Unable to download the update.",
        detail: error.message,
        buttons: ["OK"],
        noLink: true,
      });
    }
  }
});

/* ------------------------------------------------------------
   DOWNLOAD PROGRESS
------------------------------------------------------------ */

autoUpdater.on("download-progress", (progress) => {
  if (!mainWindow) return;

  mainWindow.setProgressBar(progress.percent / 100);
});

/* ------------------------------------------------------------
   UPDATE DOWNLOADED
------------------------------------------------------------ */

autoUpdater.on("update-downloaded", async () => {
  if (!mainWindow) return;

  mainWindow.setProgressBar(-1);

  const result = await dialog.showMessageBox(mainWindow, {
    type: "info",
    title: "WebDrop Update Ready",
    message: "The update has been downloaded.",
    detail:
      "Restart WebDrop now to install the latest version.",
    buttons: ["Restart Now", "Later"],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  });

  if (result.response === 0) {
    autoUpdater.quitAndInstall(false, true);
  }
});

/* ------------------------------------------------------------
   UPDATE NOT AVAILABLE
------------------------------------------------------------ */

autoUpdater.on("update-not-available", () => {
  console.log("WebDrop is already up to date.");
});

/* ------------------------------------------------------------
   UPDATE ERROR
------------------------------------------------------------ */

autoUpdater.on("error", (error) => {
  console.log("Auto update error:", error.message);
});

/* ------------------------------------------------------------
   ONLY ONE INSTANCE
------------------------------------------------------------ */

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }

      mainWindow.focus();
    }
  });
}

/* ------------------------------------------------------------
   LOAD WEBDROP
------------------------------------------------------------ */

function loadApp() {
  if (!mainWindow) return;

  mainWindow.loadURL(APP_URL).catch(() => {
    // Offline handler handles the failure
  });
}

/* ------------------------------------------------------------
   CREATE WINDOW
------------------------------------------------------------ */

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,

    minWidth: 1000,
    minHeight: 700,

    title: "WebDrop",

    autoHideMenuBar: true,

    backgroundColor: "#1A1A1A",

    icon: path.join(__dirname, "webdrop.ico"),

    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),

      contextIsolation: true,

      nodeIntegration: false,

      sandbox: true,

      devTools: false,
    },
  });

  /* ----------------------------------------------------------
     BLOCK DEVTOOLS ONLY INSIDE WEBDROP
  ---------------------------------------------------------- */

  mainWindow.webContents.on(
    "before-input-event",
    (event, input) => {
      const key = (input.key || "").toLowerCase();

      const isDevKey =
        key === "f12" ||
        ((input.control || input.meta) &&
          input.shift &&
          ["i", "j", "c"].includes(key));

      if (isDevKey) {
        event.preventDefault();
      }
    }
  );

  /* ----------------------------------------------------------
     EXTERNAL LINKS
  ---------------------------------------------------------- */

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);

    return {
      action: "deny",
    };
  });

  mainWindow.webContents.on(
    "will-navigate",
    (event, url) => {
      let target;

      try {
        target = new URL(url);
      } catch {
        event.preventDefault();
        return;
      }

      if (
        target.origin === APP_ORIGIN ||
        target.protocol === "file:"
      ) {
        return;
      }

      event.preventDefault();

      shell.openExternal(url);
    }
  );

  /* ----------------------------------------------------------
     OFFLINE PAGE
  ---------------------------------------------------------- */

  mainWindow.webContents.on(
    "did-fail-load",
    (
      _event,
      errorCode,
      _desc,
      validatedURL,
      isMainFrame
    ) => {
      // -3 = aborted navigation
      if (!isMainFrame || errorCode === -3) {
        return;
      }

      if (
        validatedURL &&
        validatedURL.startsWith("file:")
      ) {
        return;
      }

      mainWindow.loadFile(
        path.join(__dirname, "offline.html")
      );
    }
  );

  /* ----------------------------------------------------------
     WINDOW CLOSED
  ---------------------------------------------------------- */

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  /* ----------------------------------------------------------
     LOAD WEBDROP
  ---------------------------------------------------------- */

  loadApp();
}

/* ------------------------------------------------------------
   APP READY
------------------------------------------------------------ */

if (gotLock) {
  app.whenReady().then(() => {
    /* --------------------------------------------------------
       PERMISSIONS
    -------------------------------------------------------- */

    session.defaultSession.setPermissionRequestHandler(
      (
        webContents,
        permission,
        callback,
        details
      ) => {
        let origin = "";

        try {
          origin = new URL(
            details.requestingUrl
          ).origin;
        } catch {
          // Ignore invalid URL
        }

        const allowedPermissions = [
          "media",
          "clipboard-sanitized-write",
          "fullscreen",
        ];

        callback(
          origin === APP_ORIGIN &&
            allowedPermissions.includes(permission)
        );
      }
    );

    /* --------------------------------------------------------
       CREATE WINDOW
    -------------------------------------------------------- */

    createWindow();

    /* --------------------------------------------------------
       CHECK FOR UPDATE
       5 seconds after app starts
    -------------------------------------------------------- */

    setTimeout(() => {
      checkForUpdates();
    }, 5000);

    /* --------------------------------------------------------
       MACOS ACTIVATE
    -------------------------------------------------------- */

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

/* ------------------------------------------------------------
   CLOSE APP
------------------------------------------------------------ */

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});