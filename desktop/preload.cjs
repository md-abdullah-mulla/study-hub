/**
 * Preload script — the only bridge between the desktop app and the web UI.
 *
 * It deliberately exposes very little: a flag that says "you are running inside
 * the desktop app", plus two harmless helpers (open the folder where the data
 * lives, open the downloads folder). No filesystem, no shell, no Node APIs are
 * handed to the page, so the same UI code stays safe in a browser too.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('studyHubDesktop', {
  isDesktop: true,
  platform: process.platform,
  openDataFolder: () => ipcRenderer.invoke('study-hub:open-data-folder'),
  openDownloadsFolder: () => ipcRenderer.invoke('study-hub:open-downloads-folder'),
  info: () => ipcRenderer.invoke('study-hub:info'),
});
