/**
 * Study Hub — DESKTOP APP (Electron main process)
 *
 * How it works, in one line: the very same web app (already built, including the
 * in-browser SQLite backend) is served to the window from a private `app://`
 * address, so the desktop app needs no server, no internet and no separate
 * database.
 *
 * Why a custom `app://` scheme instead of loading the files with `file://`:
 * Chromium treats `file://` pages as an opaque origin, and IndexedDB / WebAssembly
 * storage are unreliable there. A registered standard + secure scheme behaves
 * like a normal website origin, which is exactly what the storage layer needs.
 * It is registered as privileged BEFORE the app is ready — that order matters.
 */
const { app, BrowserWindow, Menu, dialog, ipcMain, protocol, shell } = require('electron');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');

const SCHEME = 'app';
const HOST = 'study-hub';
const ROOT = path.join(__dirname, 'app'); // the built web app (scripts/prepare-app.mjs)
const START_URL = `${SCHEME}://${HOST}/index.html`;
const LIVE_SITE = 'https://study-hub-virid.vercel.app/';
const REPO_URL = 'https://github.com/md-abdullah-mulla/study-hub';

protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true },
  },
]);

// --------------------------------------------------------------------------- files
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

/**
 * Maps a request to a file inside the app folder.
 *  - path traversal is refused,
 *  - unknown paths without a file extension fall back to index.html (the app
 *    uses real URLs such as /exam, /report — the desktop app must open those too),
 *  - missing assets return 404 instead of a silent HTML file, so a broken build
 *    is visible instead of mysterious.
 */
function resolveFile(requestUrl) {
  const { pathname } = new URL(requestUrl);
  const decoded = decodeURIComponent(pathname);
  const relative = decoded.replace(/^\/+/, '');
  const target = path.join(ROOT, relative || 'index.html');
  const normalizedRoot = path.resolve(ROOT);
  const normalizedTarget = path.resolve(target);

  if (!normalizedTarget.startsWith(normalizedRoot)) return { status: 403 };
  if (fs.existsSync(normalizedTarget) && fs.statSync(normalizedTarget).isFile()) return { status: 200, file: normalizedTarget };

  const hasExtension = path.extname(normalizedTarget) !== '';
  if (hasExtension) return { status: 404 };
  return { status: 200, file: path.join(normalizedRoot, 'index.html'), spa: true };
}

async function serve(request) {
  const resolved = resolveFile(request.url);
  if (resolved.status !== 200) return new Response('Not found', { status: resolved.status });

  const data = await fsp.readFile(resolved.file);
  const type = MIME[path.extname(resolved.file).toLowerCase()] ?? 'application/octet-stream';
  return new Response(data, {
    status: 200,
    headers: {
      'content-type': type,
      // the app updates by installing a new build, so nothing is cached in the session
      'cache-control': 'no-cache',
      ...(resolved.spa ? { 'x-study-hub-spa-fallback': '1' } : {}),
    },
  });
}

// --------------------------------------------------------------------------- window state
const stateFile = () => path.join(app.getPath('userData'), 'window-state.json');

function readWindowState() {
  try {
    const saved = JSON.parse(fs.readFileSync(stateFile(), 'utf8'));
    if (typeof saved.width === 'number' && typeof saved.height === 'number') return saved;
  } catch {
    /* first run */
  }
  return { width: 1280, height: 860 };
}

function saveWindowState(win) {
  if (win.isDestroyed()) return;
  const bounds = win.getNormalBounds();
  try {
    fs.writeFileSync(stateFile(), JSON.stringify({ ...bounds, maximized: win.isMaximized() }, null, 2));
  } catch {
    /* not important enough to bother the student */
  }
}

// --------------------------------------------------------------------------- app menu
function openRoute(pathname) {
  const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
  win?.loadURL(`${SCHEME}://${HOST}${pathname}`);
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'Study Hub',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+1',
          click: () => openRoute('/index.html'),
        },
        { label: 'Exam Mode', accelerator: 'CmdOrCtrl+2', click: () => openRoute('/exam') },
        { label: 'Analytics', accelerator: 'CmdOrCtrl+3', click: () => openRoute('/analytics') },
        { label: 'PDF Report', accelerator: 'CmdOrCtrl+4', click: () => openRoute('/report') },
        { label: 'Settings', accelerator: 'CmdOrCtrl+5', click: () => openRoute('/settings') },
        { type: 'separator' },
        {
          label: 'ডেটা ফোল্ডার খুলো (backup-এর জন্য)',
          click: () => shell.openPath(app.getPath('userData')),
        },
        { label: 'Download ফোল্ডার খুলো', click: () => shell.openPath(app.getPath('downloads')) },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit', label: 'বন্ধ করো' },
      ],
    },
    {
      label: 'Edit',
      submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload', accelerator: 'F5' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { role: 'toggleDevTools', label: 'Developer tools' },
      ],
    },
    {
      role: 'help',
      label: 'Help',
      submenu: [
        {
          label: 'About Study Hub',
          click: () => {
            dialog.showMessageBox({
              type: 'info',
              title: 'About Study Hub',
              message: `Study Hub — Smart Semester Study Management\nVersion ${app.getVersion()}`,
              detail:
                `Semester 6 (CST) এর পড়াশোনা track, analyse ও revise করার offline desktop app.\n\n` +
                `তোমার ডেটা এখানে থাকে:\n${app.getPath('userData')}\n\n` +
                'নিয়মিত Settings → Backup (JSON) দিয়ে ফাইল নামিয়ে রাখলে যেকোনো ডিভাইসে ফিরিয়ে আনা যাবে।',
              buttons: ['ঠিক আছে'],
              noLink: true,
            });
          },
        },
        { label: 'Live website খোলো', click: () => shell.openExternal(LIVE_SITE) },
        { label: 'Source code (GitHub)', click: () => shell.openExternal(REPO_URL) },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// --------------------------------------------------------------------------- window
function createWindow() {
  const state = readWindowState();

  const win = new BrowserWindow({
    width: state.width,
    height: state.height,
    ...(typeof state.x === 'number' && typeof state.y === 'number' ? { x: state.x, y: state.y } : {}),
    minWidth: 900,
    minHeight: 620,
    title: 'Study Hub — Semester 6',
    backgroundColor: '#eef4ff',
    show: false,
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      backgroundThrottling: false,
    },
  });

  if (state.maximized) win.maximize();

  win.once('ready-to-show', () => win.show());

  // links to the outside world open in the real browser, never inside the app
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`${SCHEME}://${HOST}`) && /^https?:/.test(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  win.on('close', () => saveWindowState(win));
  win.loadURL(START_URL);

  return win;
}

// a single instance keeps one copy of the database open
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(async () => {
    protocol.handle(SCHEME, serve);
    Menu.setApplicationMenu(null); // built below, after the app is ready
    buildMenu();

    ipcMain.handle('study-hub:open-data-folder', () => shell.openPath(app.getPath('userData')));
    ipcMain.handle('study-hub:open-downloads-folder', () => shell.openPath(app.getPath('downloads')));
    ipcMain.handle('study-hub:info', () => ({
      version: app.getVersion(),
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      dataFolder: app.getPath('userData'),
    }));

    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  // Windows taskbar grouping / notifications
  if (process.platform === 'win32') app.setAppUserModelId('com.studyhub.semester6');

  // no background work is needed; a second copy of the process would only fight
  // over the same database file
  app.on('before-quit', () => saveWindowState(BrowserWindow.getAllWindows()[0] ?? { isDestroyed: () => true }));
}
