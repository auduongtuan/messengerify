import { app, BrowserWindow, screen } from 'electron';
import * as path from 'path';

// Enable hot reload in development
try {
  require('electron-reloader')(module);
} catch (_) {}

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
