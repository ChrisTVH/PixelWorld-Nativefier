import * as fs from 'fs';

import axios from 'axios';
import * as log from 'loglevel';

// package.json is `require`d para permitir que tsc elimine la carpeta `src` determinando
// baseUrl=src. Una importación estática evitaría eso y causaría una fea carpeta extra `src` en `lib`
const packageJson = require('../../package.json'); // eslint-disable-line @typescript-eslint/no-var-requires
import {
  DEFAULT_ELECTRON_VERSION,
  PLACEHOLDER_APP_DIR,
  ELECTRON_MAJOR_VERSION,
} from '../constants';
import { inferPlatform, inferArch } from '../infer/inferOs';
import { asyncConfig } from './asyncConfig';
import { AppOptions } from './model';
import { normalizeUrl } from './normalizeUrl';

const SEMVER_VERSION_NUMBER_REGEX = /\d+\.\d+\.\d+[-_\w\d.]*/;

/**
 * Procesar y validar argumentos de usuario sin procesar
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function getOptions(rawOptions: any): Promise<AppOptions> {
  const options: AppOptions = {
    packager: {
      appCopyright: rawOptions.appCopyright,
      appVersion: rawOptions.appVersion,
      arch: rawOptions.arch || inferArch(),
      asar: rawOptions.conceal || false,
      buildVersion: rawOptions.buildVersion,
      darwinDarkModeSupport: rawOptions.darwinDarkModeSupport || false,
      dir: PLACEHOLDER_APP_DIR,
      electronVersion: rawOptions.electronVersion || DEFAULT_ELECTRON_VERSION,
      icon: rawOptions.icon,
      name: typeof rawOptions.name === 'string' ? rawOptions.name : '',
      out: rawOptions.out || process.cwd(),
      overwrite: rawOptions.overwrite,
      platform: rawOptions.platform || inferPlatform(),
      targetUrl: normalizeUrl(rawOptions.targetUrl),
      tmpdir: false, // solución para electron-packager#375
      win32metadata: rawOptions.win32metadata || {
        ProductName: rawOptions.name,
        InternalName: rawOptions.name,
        FileDescription: rawOptions.name,
      },
    },
    nativefier: {
      alwaysOnTop: rawOptions.alwaysOnTop || false,
      backgroundColor: rawOptions.backgroundColor || null,
      basicAuthPassword: rawOptions.basicAuthPassword || null,
      basicAuthUsername: rawOptions.basicAuthUsername || null,
      bounce: rawOptions.bounce || false,
      browserwindowOptions: rawOptions.browserwindowOptions,
      clearCache: rawOptions.clearCache || false,
      counter: rawOptions.counter || false,
      crashReporter: rawOptions.crashReporter,
      disableContextMenu: rawOptions.disableContextMenu,
      disableDevTools: rawOptions.disableDevTools,
      disableGpu: rawOptions.disableGpu || false,
      diskCacheSize: rawOptions.diskCacheSize || null,
      disableOldBuildWarning:
      rawOptions.disableOldBuildWarningYesiknowitisinsecure || false,
      enableEs3Apis: rawOptions.enableEs3Apis || false,
      fastQuit: rawOptions.fastQuit || false,
      fileDownloadOptions: rawOptions.fileDownloadOptions,
      flashPluginDir: rawOptions.flashPath || rawOptions.flash || null,
      fullScreen: rawOptions.fullScreen || false,
      globalShortcuts: null,
      hideWindowFrame: rawOptions.hideWindowFrame,
      ignoreCertificate: rawOptions.ignoreCertificate || false,
      ignoreGpuBlacklist: rawOptions.ignoreGpuBlacklist || false,
      inject: rawOptions.inject || [],
      insecure: rawOptions.insecure || false,
      internalUrls: rawOptions.internalUrls || null,
      blockExternalUrls: rawOptions.blockExternalUrls || false,
      maximize: rawOptions.maximize || false,
      nativefierVersion: packageJson.version,
      processEnvs: rawOptions.processEnvs,
      proxyRules: rawOptions.proxyRules || null,
      showMenuBar: rawOptions.showMenuBar || false,
      singleInstance: rawOptions.singleInstance || false,
      titleBarStyle: rawOptions.titleBarStyle || null,
      tray: rawOptions.tray || false,
      userAgent: rawOptions.userAgent,
      verbose: rawOptions.verbose,
      versionString: rawOptions.versionString,
      width: rawOptions.width || 1280,
      height: rawOptions.height || 800,
      minWidth: rawOptions.minWidth,
      minHeight: rawOptions.minHeight,
      maxWidth: rawOptions.maxWidth,
      maxHeight: rawOptions.maxHeight,
      x: rawOptions.x,
      y: rawOptions.y,
      zoom: rawOptions.zoom || 1.0,
    },
  };

  if (options.nativefier.verbose) {
    log.setLevel('trace');
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('debug').enable('electron-packager');
    } catch (err) {
      log.debug(
        'No se pudo habilitar la salida de depuración del empaquetador de electron. Esto no debería suceder',
        'y sugiere que cambiaron sus partes internas. Informe un problema.',
      );
    }

    log.debug(
      '¡Ejecutando en modo detallado! Esto producirá una montaña de troncos y',
      'se recomienda solo para solucionar problemas o si te gusta Shakespeare.',
    );
  } else {
    log.setLevel('info');
  }

  if (rawOptions.electronVersion) {
    const requestedVersion: string = rawOptions.electronVersion;
    if (!SEMVER_VERSION_NUMBER_REGEX.exec(requestedVersion)) {
      throw `Número de versión de Electron no válido "${requestedVersion}". Abortando.`;
    }
    const requestedMajorVersion = parseInt(requestedVersion.split('.')[0], 10);
    if (requestedMajorVersion < ELECTRON_MAJOR_VERSION) {
      log.warn(
        `\nATENCIÓN: Usando la versión **antigua** de Electron ${requestedVersion} de acuerdo a lo pedido.`,
        '\nNo ha sido probado, los errores y el horror sucederán, estás solo.',
        `\nSimplemente aborte y vuelva a ejecutar sin pasar el indicador de versión al predeterminado ${DEFAULT_ELECTRON_VERSION}`,
      );
    }
  }

  if (rawOptions.widevine) {
    const widevineElectronVersion = `${options.packager.electronVersion}-wvvmp`;
    try {
      await axios.get(
        `https://github.com/castlabs/electron-releases/releases/tag/v${widevineElectronVersion}`,
      );
    } catch (error) {
      throw `\nERROR: versión de castLabs Electron "${widevineElectronVersion}" no existe. \nVerificar versiones en https://github.com/castlabs/electron-releases/releases. \nAbortando.`;
    }

    options.packager.electronVersion = widevineElectronVersion;
    process.env.ELECTRON_MIRROR =
      'https://github.com/castlabs/electron-releases/releases/download/';
    log.warn(
      `\nATENCIÓN: Usando el ** nooficial** Electron de castLabs`,
      "\nImplementa el módulo de descifrado de contenido Widevine (CDM) de Google para la reproducción habilitada para DRM.",
      `\nSimplemente aborte y vuelva a ejecutar sin pasar la bandera de widevine al predeterminado ${DEFAULT_ELECTRON_VERSION}`,
    );
  }

  if (options.nativefier.flashPluginDir) {
    options.nativefier.insecure = true;
  }

  if (rawOptions.honest) {
    options.nativefier.userAgent = null;
  }

  const platform = options.packager.platform.toLowerCase();
  if (platform === 'windows') {
    options.packager.platform = 'win32';
  }

  if (['osx', 'mac', 'macos'].includes(platform)) {
    options.packager.platform = 'darwin';
  }

  if (options.nativefier.width > options.nativefier.maxWidth) {
    options.nativefier.width = options.nativefier.maxWidth;
  }

  if (options.nativefier.height > options.nativefier.maxHeight) {
    options.nativefier.height = options.nativefier.maxHeight;
  }

  if (rawOptions.globalShortcuts) {
    log.debug(
      'Usar archivo de accesos directos globales en',
      rawOptions.globalShortcuts,
    );
    const globalShortcuts = JSON.parse(
      fs.readFileSync(rawOptions.globalShortcuts).toString(),
    );
    options.nativefier.globalShortcuts = globalShortcuts;
  }

  await asyncConfig(options);

  return options;
}
