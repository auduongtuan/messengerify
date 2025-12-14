import { app, BrowserWindow, screen, shell, Menu, clipboard } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';

// Feature flags
const ENABLE_AUTO_UPDATES = false; // Set to true when you have code signing

// Enable hot reload in development
try {
  require('electron-reloader')(module);
} catch (_) {}

// Configure auto-updater (only if enabled and code-signed)
if (ENABLE_AUTO_UPDATES) {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
}

// Use separate userData directory for development to avoid conflicts
if (!app.isPackaged) {
  const userDataPath = app.getPath('userData');
  app.setPath('userData', `${userDataPath}-dev`);
  console.log('Development mode: Using separate userData directory');
}

// Single instance lock - prevent multiple instances from running
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.log('Another instance is already running. Quitting...');
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, focus our window instead
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      const mainWindow = windows[0];
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createWindow(): void {
  // Get screen size and calculate window dimensions
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  // Set window to 80% of screen size with min/max constraints
  const windowWidth = Math.min(Math.max(Math.floor(screenWidth * 0.8), 1000), 1600);
  const windowHeight = Math.min(Math.max(Math.floor(screenHeight * 0.85), 700), 1200);

  const win = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    frame: false,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../assets/icon.icns'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      partition: 'persist:messenger'
    }
  });

  // Log userData path for debugging
  console.log('userData path:', app.getPath('userData'));
  console.log('Session persist path:', app.getPath('sessionData'));

  win.loadURL('https://www.messenger.com');

  // Open external links in default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    // If it's a messenger.com URL, allow it in the app
    if (url.startsWith('https://www.messenger.com') || url.startsWith('https://messenger.com')) {
      return { action: 'allow' };
    }
    // Otherwise, open in external browser
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle navigation attempts (clicking links)
  win.webContents.on('will-navigate', (event, url) => {
    // Allow navigation within messenger.com
    if (url.startsWith('https://www.messenger.com') || url.startsWith('https://messenger.com')) {
      return;
    }
    // Prevent navigation and open in external browser instead
    event.preventDefault();
    shell.openExternal(url);
  });

  // Context menu handler
  win.webContents.on('context-menu', (event, params) => {
    const menuTemplate: Electron.MenuItemConstructorOptions[] = [];

    // Text selection menu items
    if (params.selectionText) {
      menuTemplate.push({
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        click: () => {
          clipboard.writeText(params.selectionText);
        }
      });

      menuTemplate.push({
        label: 'Search with Google',
        click: () => {
          const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(params.selectionText)}`;
          shell.openExternal(searchUrl);
        }
      });
    }

    // Image menu items
    if (params.mediaType === 'image') {
      if (menuTemplate.length > 0) {
        menuTemplate.push({ type: 'separator' });
      }

      menuTemplate.push({
        label: 'Copy Image',
        click: () => {
          win.webContents.copyImageAt(params.x, params.y);
        }
      });

      menuTemplate.push({
        label: 'Save Image',
        click: () => {
          win.webContents.downloadURL(params.srcURL);
        }
      });
    }

    // Input field menu items
    if (params.isEditable) {
      if (menuTemplate.length > 0) {
        menuTemplate.push({ type: 'separator' });
      }

      menuTemplate.push({
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        click: () => {
          win.webContents.paste();
        }
      });

      if (params.selectionText) {
        menuTemplate.push({
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          click: () => {
            win.webContents.cut();
          }
        });
      }

      menuTemplate.push({
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        click: () => {
          win.webContents.selectAll();
        }
      });
    }

    // Show context menu if there are items
    if (menuTemplate.length > 0) {
      const contextMenu = Menu.buildFromTemplate(menuTemplate);
      contextMenu.popup();
    }
  });

  // Add draggable area at the top and hide feed section
  win.webContents.on('did-finish-load', () => {
    // Add draggable area and margin to inbox switcher
    win.webContents.insertCSS(`
      body::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 32px;
        -webkit-app-region: drag;
        z-index: 9999;
        background: transparent;
      }

      [aria-label="Inbox switcher"][role="navigation"] {
        margin-top: 16px !important;
      }

      [aria-label="Inbox switcher"][role="navigation"] > div {
        margin-top: 0 !important;
      }

      div[aria-label="Media viewer"] div[aria-label="Close"] {
        margin-top: 24px;
      }
    `);

    // Hide feed section (parent parent parent of section[role="feed"]) and element before it
    win.webContents.executeJavaScript(`
      (function() {
        function hideElement() {
          const section = document.querySelector('section[role="feed"][aria-busy="false"]');
          if (section && section.parentElement && section.parentElement.parentElement && section.parentElement.parentElement.parentElement) {
            const targetElement = section.parentElement.parentElement.parentElement;

            // Hide the target element
            targetElement.style.display = 'none';

            // Hide the element right before it (previous sibling)
            if (targetElement.previousElementSibling) {
              targetElement.previousElementSibling.style.display = 'none';
            }

            return true;
          }
          return false;
        }

        // Try to hide immediately
        if (!hideElement()) {
          // If not found, observe for it to appear
          const observer = new MutationObserver(() => {
            if (hideElement()) {
              observer.disconnect();
            }
          });
          observer.observe(document.body, { childList: true, subtree: true });
        }
      })();
    `);
  });

  // Open dev tools with F12 or Cmd+Option+I (Ctrl+Shift+I on Windows/Linux)
  win.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' ||
        (input.key === 'i' && input.meta && input.alt) ||
        (input.key === 'I' && input.control && input.shift)) {
      win.webContents.toggleDevTools();
    }
  });

  // Uncomment to open dev tools by default
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  // Check for updates (only if enabled and in production)
  if (ENABLE_AUTO_UPDATES && app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on('checking-for-update', () => {
      console.log('Checking for updates...');
    });

    autoUpdater.on('update-available', (info) => {
      console.log('Update available:', info.version);
    });

    autoUpdater.on('update-not-available', (info) => {
      console.log('Update not available:', info.version);
    });

    autoUpdater.on('download-progress', (progressObj) => {
      console.log(`Download progress: ${progressObj.percent.toFixed(2)}%`);
    });

    autoUpdater.on('update-downloaded', (info) => {
      console.log('Update downloaded, will install on quit:', info.version);
    });

    autoUpdater.on('error', (err) => {
      console.error('Update error:', err);
    });
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
