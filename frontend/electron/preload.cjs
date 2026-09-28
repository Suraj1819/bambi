// NOTE: preload must be CommonJS (.cjs). With "type": "module" in package.json,
// a plain preload.js using `import` fails silently in Electron's sandboxed
// renderer and window.electronAPI never gets exposed.
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isDesktopApp: true,
});