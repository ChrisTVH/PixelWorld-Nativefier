import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { BrowserWindow } from 'electron';
import wurl from 'wurl';

const INJECT_CSS_PATH = path.join(__dirname, '..', 'inject/inject.css');

export function isOSX(): boolean {
  return os.platform() === 'darwin';
}

export function isLinux(): boolean {
  return os.platform() === 'linux';
}

export function isWindows(): boolean {
  return os.platform() === 'win32';
}

export function linkIsInternal(
  currentUrl: string,
  newUrl: string,
  internalUrlRegex: string | RegExp,
): boolean {
  if (newUrl === 'about:blank') {
    return true;
  }

  if (internalUrlRegex) {
    const regex = RegExp(internalUrlRegex);
    return regex.test(newUrl);
  }

  const currentDomain = wurl('domain', currentUrl);
  const newDomain = wurl('domain', newUrl);
  return currentDomain === newDomain;
}

export function shouldInjectCss(): boolean {
  try {
    fs.accessSync(INJECT_CSS_PATH);
    return true;
  } catch (e) {
    return false;
  }
}

export function getCssToInject(): string {
  return fs.readFileSync(INJECT_CSS_PATH).toString();
}

/**
 * Ayudante para imprimir mensajes de depuración del proceso principal en la ventana del navegador
 */
export function debugLog(browserWindow: BrowserWindow, message: string): void {
  // Necesita un retraso, ya que se necesita tiempo para que la ventana cargue los js precargados
  setTimeout(() => {
    browserWindow.webContents.send('debug', message);
  }, 3000);
  console.info(message);
}

export function getAppIcon(): string {
  // Prefiera ICO bajo Windows, consulte
  // https://www.electronjs.org/docs/api/browser-window#new-browserwindowoptions
  // https://www.electronjs.org/docs/api/native-image#supported-formats
  if (isWindows()) {
    const ico = path.join(__dirname, '..', 'icon.ico');
    if (fs.existsSync(ico)) {
      return ico;
    }
  }
  const png = path.join(__dirname, '..', 'icon.png');
  if (fs.existsSync(png)) {
    return png;
  }
}

export function nativeTabsSupported(): boolean {
  return isOSX();
}

export function getCounterValue(title: string): string {
  const itemCountRegex = /[([{]([\d.,]*)\+?[}\])]/;
  const match = itemCountRegex.exec(title);
  return match ? match[1] : undefined;
}
