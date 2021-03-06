import * as fs from 'fs';
import * as path from 'path';

import { BrowserWindow, shell, ipcMain, dialog, Event } from 'electron';
import windowStateKeeper from 'electron-window-state';

import {
  isOSX,
  linkIsInternal,
  getCssToInject,
  shouldInjectCss,
  getAppIcon,
  nativeTabsSupported,
  getCounterValue,
} from '../helpers/helpers';
import { initContextMenu } from './contextMenu';
import { onNewWindowHelper } from './mainWindowHelpers';
import { createMenu } from './menu';

const ZOOM_INTERVAL = 0.1;

function hideWindow(
  window: BrowserWindow,
  event: Event,
  fastQuit: boolean,
  tray,
): void {
  if (isOSX() && !fastQuit) {
    // esto se llama al salir de hacer clic en el botón de cruz en la ventana
    event.preventDefault();
    window.hide();
  } else if (!fastQuit && tray) {
    event.preventDefault();
    window.hide();
  }
  // cerrará la ventana en otras plataformas
}

function injectCss(browserWindow: BrowserWindow): void {
  if (!shouldInjectCss()) {
    return;
  }

  const cssToInject = getCssToInject();

  browserWindow.webContents.on('did-navigate', () => {
    // Debemos inyectar css lo suficientemente temprano; entonces onHeadersReceived es un buen lugar.
    // Se ejecutará varias veces, consulte `did-finish-load` a continuación que desarma este controlador.
    browserWindow.webContents.session.webRequest.onHeadersReceived(
      { urls: [] }, // Pase una lista de filtros vacía; nulo no coincidirá con _cualquier_ URL
      (details, callback) => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        browserWindow.webContents.insertCSS(cssToInject);
        callback({ cancel: false, responseHeaders: details.responseHeaders });
      },
    );
  });
}

async function clearCache(browserWindow: BrowserWindow): Promise<void> {
  const { session } = browserWindow.webContents;
  await session.clearStorageData();
  await session.clearCache();
}

function setProxyRules(browserWindow: BrowserWindow, proxyRules): void {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  browserWindow.webContents.session.setProxy({
    proxyRules,
    pacScript: '',
    proxyBypassRules: '',
  });
}

/**
 * @param {{}} nativefierOptions AppArgs de nativefier.json
 * @param {function} onAppQuit
 * @param {function} setDockBadge
 */
export function createMainWindow(
  nativefierOptions,
  onAppQuit,
  setDockBadge,
): BrowserWindow {
  const options = { ...nativefierOptions };
  const mainWindowState = windowStateKeeper({
    defaultWidth: options.width || 1280,
    defaultHeight: options.height || 800,
  });

  const DEFAULT_WINDOW_OPTIONS = {
    // Convierta guiones en espacios porque en Linux el nombre de la aplicación está unido con guiones
    title: options.name,
    tabbingIdentifier: nativeTabsSupported() ? options.name : undefined,
    webPreferences: {
      javascript: true,
      plugins: true,
      nodeIntegration: false, // `true` es * inseguro * y causa problemas con messenger.com
      webSecurity: !options.insecure,
      preload: path.join(__dirname, 'preload.js'),
      zoomFactor: options.zoom,
    },
  };

  const browserwindowOptions = { ...options.browserwindowOptions };

  const mainWindow = new BrowserWindow({
    frame: !options.hideWindowFrame,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: options.minWidth,
    minHeight: options.minHeight,
    maxWidth: options.maxWidth,
    maxHeight: options.maxHeight,
    x: options.x,
    y: options.y,
    autoHideMenuBar: !options.showMenuBar,
    icon: getAppIcon(),
    // establecido en indefinido y no falso porque establecer explícitamente en falso desactivará la pantalla completa
    fullscreen: options.fullScreen || undefined,
    // Si la ventana debe permanecer siempre encima de otras ventanas. El valor predeterminado es falso.
    alwaysOnTop: options.alwaysOnTop,
    titleBarStyle: options.titleBarStyle,
    show: options.tray !== 'start-in-tray',
    backgroundColor: options.backgroundColor,
    ...DEFAULT_WINDOW_OPTIONS,
    ...browserwindowOptions,
  });

  mainWindowState.manage(mainWindow);

  // después de la primera ejecución, ya no fuerza a maximizar para que sea cierto
  if (options.maximize) {
    mainWindow.maximize();
    options.maximize = undefined;
    try {
      fs.writeFileSync(
        path.join(__dirname, '..', 'nativefier.json'),
        JSON.stringify(options),
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(
        `WARNING: Ignored nativefier.json rewrital (${(err as Error).toString()})`,
      );
    }
  }

  if (options.tray === 'start-in-tray') {
    mainWindow.hide();
  }

  const withFocusedWindow = (block: (window: BrowserWindow) => void): void => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
      return block(focusedWindow);
    }
    return undefined;
  };

  const adjustWindowZoom = (
    window: BrowserWindow,
    adjustment: number,
  ): void => {
    window.webContents.zoomFactor = window.webContents.zoomFactor + adjustment;
  };

  const onZoomIn = (): void => {
    withFocusedWindow((focusedWindow: BrowserWindow) =>
      adjustWindowZoom(focusedWindow, ZOOM_INTERVAL),
    );
  };

  const onZoomOut = (): void => {
    withFocusedWindow((focusedWindow: BrowserWindow) =>
      adjustWindowZoom(focusedWindow, -ZOOM_INTERVAL),
    );
  };

  const onZoomReset = (): void => {
    withFocusedWindow((focusedWindow: BrowserWindow) => {
      focusedWindow.webContents.zoomFactor = options.zoom;
    });
  };

  const clearAppData = async (): Promise<void> => {
    const response = await dialog.showMessageBox(mainWindow, {
      type: 'warning',
      buttons: ['Estoy Seguro(a)', 'No estoy Seguro(a)'],
      defaultId: 1,
      title: 'Borrar datos en Caché',
      message:
        'Esto borrará todos los datos (cookies, almacenamiento local, etc.) de esta aplicación. ¿Seguro que desea continuar?',
    });

    if (response.response !== 0) {
      return;
    }
    await clearCache(mainWindow);
  };

  const onGoBack = (): void => {
    withFocusedWindow((focusedWindow) => {
      focusedWindow.webContents.goBack();
    });
  };

  const onGoForward = (): void => {
    withFocusedWindow((focusedWindow) => {
      focusedWindow.webContents.goForward();
    });
  };

  const getCurrentUrl = (): void =>
    withFocusedWindow((focusedWindow) => focusedWindow.webContents.getURL());

  const onBlockedExternalUrl = (url: string) => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    dialog.showMessageBox(mainWindow, {
      message: `No puedo navegar a una URL externa: ${url}`,
      type: 'error',
      title: 'Navegación Bloqueada',
    });
  };

  const onWillNavigate = (event: Event, urlToGo: string): void => {
    if (!linkIsInternal(options.targetUrl, urlToGo, options.internalUrls)) {
      event.preventDefault();
      if (options.blockExternalUrls) {
        onBlockedExternalUrl(urlToGo);
      } else {
        shell.openExternal(urlToGo); // eslint-disable-line @typescript-eslint/no-floating-promises
      }
    }
  };

  const createNewWindow: (url: string) => BrowserWindow = (url: string) => {
    const window = new BrowserWindow(DEFAULT_WINDOW_OPTIONS);
    if (options.userAgent) {
      window.webContents.userAgent = options.userAgent;
    }

    if (options.proxyRules) {
      setProxyRules(window, options.proxyRules);
    }

    injectCss(window);
    sendParamsOnDidFinishLoad(window);
    window.webContents.on('new-window', onNewWindow);
    window.webContents.on('will-navigate', onWillNavigate);
    window.loadURL(url); // eslint-disable-line @typescript-eslint/no-floating-promises
    return window;
  };

  const createNewTab = (url: string, foreground: boolean): BrowserWindow => {
    withFocusedWindow((focusedWindow) => {
      const newTab = createNewWindow(url);
      focusedWindow.addTabbedWindow(newTab);
      if (!foreground) {
        focusedWindow.focus();
      }
      return newTab;
    });
    return undefined;
  };

  const createAboutBlankWindow = (): BrowserWindow => {
    const window = createNewWindow('about:blank');
    window.hide();
    window.webContents.once('did-stop-loading', () => {
      if (window.webContents.getURL() === 'about:blank') {
        window.close();
      } else {
        window.show();
      }
    });
    return window;
  };

  const onNewWindow = (
    event: Event & { newGuest?: any },
    urlToGo: string,
    frameName: string,
    disposition,
  ): void => {
    const preventDefault = (newGuest: any): void => {
      event.preventDefault();
      if (newGuest) {
        event.newGuest = newGuest;
      }
    };
    onNewWindowHelper(
      urlToGo,
      disposition,
      options.targetUrl,
      options.internalUrls,
      preventDefault,
      shell.openExternal.bind(this),
      createAboutBlankWindow,
      nativeTabsSupported,
      createNewTab,
      options.blockExternalUrls,
      onBlockedExternalUrl,
    );
  };

  const sendParamsOnDidFinishLoad = (window: BrowserWindow): void => {
    window.webContents.on('did-finish-load', () => {
      // También en ventanas para niños: Restaurar pellizcar para hacer zoom, deshabilitado por defecto en Electron reciente.
      // See https://github.com/jiahaog/nativefier/issues/379#issuecomment-598612128
      // and https://github.com/electron/electron/pull/12679
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      window.webContents.setVisualZoomLevelLimits(1, 3);

      window.webContents.send('params', JSON.stringify(options));
    });
  };

  const menuOptions = {
    nativefierVersion: options.nativefierVersion,
    appQuit: onAppQuit,
    zoomIn: onZoomIn,
    zoomOut: onZoomOut,
    zoomReset: onZoomReset,
    zoomBuildTimeValue: options.zoom,
    goBack: onGoBack,
    goForward: onGoForward,
    getCurrentUrl,
    clearAppData,
    disableDevTools: options.disableDevTools,
  };

  createMenu(menuOptions);
  if (!options.disableContextMenu) {
    initContextMenu(
      createNewWindow,
      nativeTabsSupported() ? createNewTab : undefined,
    );
  }

  if (options.userAgent) {
    mainWindow.webContents.userAgent = options.userAgent;
  }

  if (options.proxyRules) {
    setProxyRules(mainWindow, options.proxyRules);
  }

  injectCss(mainWindow);
  sendParamsOnDidFinishLoad(mainWindow);

  if (options.counter) {
    mainWindow.on('page-title-updated', (e, title) => {
      const counterValue = getCounterValue(title);
      if (counterValue) {
        setDockBadge(counterValue, options.bounce);
      } else {
        setDockBadge('');
      }
    });
  } else {
    ipcMain.on('notification', () => {
      if (!isOSX() || mainWindow.isFocused()) {
        return;
      }
      setDockBadge('•', options.bounce);
    });
    mainWindow.on('focus', () => {
      setDockBadge('');
    });
  }

  ipcMain.on('notification-click', () => {
    mainWindow.show();
  });

  mainWindow.webContents.on('new-window', onNewWindow);
  mainWindow.webContents.on('will-navigate', onWillNavigate);
  mainWindow.webContents.on('did-finish-load', () => {
    // Restaurar pellizcar para hacer zoom, desactivado de forma predeterminada en Electron reciente.
    // See https://github.com/jiahaog/nativefier/issues/379#issuecomment-598309817
    // and https://github.com/electron/electron/pull/12679
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    mainWindow.webContents.setVisualZoomLevelLimits(1, 3);

    // Remove potential css injection code set in `did-navigate`) (see injectCss code)
    mainWindow.webContents.session.webRequest.onHeadersReceived(null);
  });

  if (options.clearCache) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    clearCache(mainWindow);
  }

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  mainWindow.loadURL(options.targetUrl);

  // @ts-ignore
  mainWindow.on('new-tab', () => createNewTab(options.targetUrl, true));

  mainWindow.on('close', (event) => {
    if (mainWindow.isFullScreen()) {
      if (nativeTabsSupported()) {
        mainWindow.moveTabToNewWindow();
      }
      mainWindow.setFullScreen(false);
      mainWindow.once(
        'leave-full-screen',
        hideWindow.bind(this, mainWindow, event, options.fastQuit),
      );
    }
    hideWindow(mainWindow, event, options.fastQuit, options.tray);

    if (options.clearCache) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      clearCache(mainWindow);
    }
  });

  return mainWindow;
}
