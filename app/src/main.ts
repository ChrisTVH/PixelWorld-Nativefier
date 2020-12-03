import 'source-map-support/register';

import fs from 'fs';
import path from 'path';

import {
  app,
  crashReporter,
  globalShortcut,
  BrowserWindow,
  dialog,
} from 'electron';
import electronDownload from 'electron-dl';

import { createLoginWindow } from './components/loginWindow';
import { createMainWindow } from './components/mainWindow';
import { createTrayIcon } from './components/trayIcon';
import { isOSX } from './helpers/helpers';
import { inferFlashPath } from './helpers/inferFlash';

// Entrypoint para Squirrel, un marco de actualización de Windows. Ver https://github.com/jiahaog/nativefier/pull/744
if (require('electron-squirrel-startup')) {
  app.exit();
}

const APP_ARGS_FILE_PATH = path.join(__dirname, '..', 'nativefier.json');
const appArgs = JSON.parse(fs.readFileSync(APP_ARGS_FILE_PATH, 'utf8'));

const OLD_BUILD_WARNING_THRESHOLD_DAYS = 60;
const OLD_BUILD_WARNING_THRESHOLD_MS =
  OLD_BUILD_WARNING_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;

const fileDownloadOptions = { ...appArgs.fileDownloadOptions };
electronDownload(fileDownloadOptions);

if (appArgs.processEnvs) {
  // Esta es la compatibilidad si solo se pasó una cadena.
  if (typeof appArgs.processEnvs === 'string') {
    process.env.processEnvs = appArgs.processEnvs;
  } else {
    Object.keys(appArgs.processEnvs).forEach((key) => {
      /* eslint-env node */
      process.env[key] = appArgs.processEnvs[key];
    });
  }
}

let mainWindow: BrowserWindow;

if (typeof appArgs.flashPluginDir === 'string') {
  app.commandLine.appendSwitch('ppapi-flash-path', appArgs.flashPluginDir);
} else if (appArgs.flashPluginDir) {
  const flashPath = inferFlashPath();
  app.commandLine.appendSwitch('ppapi-flash-path', flashPath);
}

if (appArgs.ignoreCertificate) {
  app.commandLine.appendSwitch('ignore-certificate-errors');
}

if (appArgs.disableGpu) {
  app.disableHardwareAcceleration();
}

if (appArgs.ignoreGpuBlacklist) {
  app.commandLine.appendSwitch('ignore-gpu-blacklist');
}

if (appArgs.enableEs3Apis) {
  app.commandLine.appendSwitch('enable-es3-apis');
}

if (appArgs.diskCacheSize) {
  app.commandLine.appendSwitch('disk-cache-size', appArgs.diskCacheSize);
}

if (appArgs.basicAuthUsername) {
  app.commandLine.appendSwitch(
    'basic-auth-username',
    appArgs.basicAuthUsername,
  );
}

if (appArgs.basicAuthPassword) {
  app.commandLine.appendSwitch(
    'basic-auth-password',
    appArgs.basicAuthPassword,
  );
}

const isRunningMacos = isOSX();
let currentBadgeCount = 0;
const setDockBadge = isRunningMacos
  ? (count: number, bounce = false) => {
      app.dock.setBadge(count.toString());
      if (bounce && count > currentBadgeCount) app.dock.bounce();
      currentBadgeCount = count;
    }
  : () => undefined;

app.on('window-all-closed', () => {
  if (!isOSX() || appArgs.fastQuit) {
    app.quit();
  }
});

app.on('activate', (event, hasVisibleWindows) => {
  if (isOSX()) {
    // this is called when the dock is clicked
    if (!hasVisibleWindows) {
      mainWindow.show();
    }
  }
});

app.on('before-quit', () => {
  // no se dispara cuando se hace clic en el botón de cierre de la ventana
  if (isOSX()) {
    // necesita forzar un cierre como solución temporal aquí para simular el comportamiento de ocultación de la aplicación osx
    // De alguna manera solución en https://github.com/atom/electron/issues/444#issuecomment-76492576 No funciona,
    // e.prevent default parece persistir

    // puede causar problemas en el futuro, ya que los eventos antes de salir y los eventos de voluntad de salir no se llaman
    app.exit(0);
  }
});

if (appArgs.crashReporter) {
  app.on('will-finish-launching', () => {
    crashReporter.start({
      companyName: appArgs.companyName || '',
      productName: appArgs.name,
      submitURL: appArgs.crashReporter,
      uploadToServer: true,
    });
  });
}

// salir si el modo singleInstance y ya hay otra instancia en ejecución
const shouldQuit = appArgs.singleInstance && !app.requestSingleInstanceLock();
if (shouldQuit) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (!mainWindow.isVisible()) {
        // tratar
        mainWindow.show();
      }
      if (mainWindow.isMinimized()) {
        // minimizado
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });

  app.on('ready', () => {
    mainWindow = createMainWindow(appArgs, app.quit.bind(this), setDockBadge);
    createTrayIcon(appArgs, mainWindow);

    // Registrar atajos globales
    if (appArgs.globalShortcuts) {
      appArgs.globalShortcuts.forEach((shortcut) => {
        globalShortcut.register(shortcut.key, () => {
          shortcut.inputEvents.forEach((inputEvent) => {
            mainWindow.webContents.sendInputEvent(inputEvent);
          });
        });
      });
    }
    if (
      !appArgs.disableOldBuildWarning &&
      new Date().getTime() - appArgs.buildDate > OLD_BUILD_WARNING_THRESHOLD_MS
    ) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dialog.showMessageBox(null, {
        type: 'warning',
        message: 'Construcción antigua detectada',
        detail:
          'Esta aplicación se creó hace mucho tiempo. Nativefier usa el navegador Chrome (a través de Electron) y es peligroso seguir usando una versión anterior. Debería reconstruir esta aplicación con un Electron reciente. El uso de la última versión de PixelWorld-Nativefier lo utilizará de forma predeterminada, o puede pasarlo manualmente.',
      });
    }
  });
}

app.on('new-window-for-tab', () => {
  mainWindow.emit('new-tab');
});

app.on('login', (event, webContents, request, authInfo, callback) => {
  // para autenticación http
  event.preventDefault();

  if (
    appArgs.basicAuthUsername !== null &&
    appArgs.basicAuthPassword !== null
  ) {
    callback(appArgs.basicAuthUsername, appArgs.basicAuthPassword);
  } else {
    createLoginWindow(callback);
  }
});
