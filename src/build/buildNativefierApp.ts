import * as path from 'path';

import * as electronGet from '@electron/get';
import * as electronPackager from 'electron-packager';
import * as hasbin from 'hasbin';
import * as log from 'loglevel';

import { isWindows, getTempDir, copyFileOrDir } from '../helpers/helpers';
import { getOptions } from '../options/optionsMain';
import { prepareElectronApp } from './prepareElectronApp';
import { convertIconIfNecessary } from './buildIcon';
import { AppOptions, NativefierOptions } from '../options/model';

const OPTIONS_REQUIRING_WINDOWS_FOR_WINDOWS_BUILD = [
  'icon',
  'appCopyright',
  'appVersion',
  'buildVersion',
  'versionString',
  'win32metadata',
];

/**
 * Checks the app path array to determine if packaging completed successfully
 */
function getAppPath(appPath: string | string[]): string {
  if (!Array.isArray(appPath)) {
    return appPath;
  }

  if (appPath.length === 0) {
    return null; // directory already exists and `--overwrite` not set
  }

  if (appPath.length > 1) {
    log.warn(
      'Advertencia: esto no debería estar sucediendo, la ruta de la aplicación empaquetada contiene más de un elemento:',
      appPath,
    );
  }

  return appPath[0];
}

/**
 * For Windows & Linux, we have to copy over the icon to the resources/app
 * folder, which the BrowserWindow is hard-coded to read the icon from
 */
async function copyIconsIfNecessary(
  options: AppOptions,
  appPath: string,
): Promise<void> {
  log.debug('Copiar iconos si es necesario');
  if (!options.packager.icon) {
    log.debug('Ningún icono especificado en las opciones; abortar');
    return;
  }

  if (
    options.packager.platform === 'darwin' ||
    options.packager.platform === 'mas'
  ) {
    log.debug('No es necesario copiar en MacOS; abortar');
    return;
  }

  // windows & linux: put the icon file into the app
  const destAppPath = path.join(appPath, 'resources/app');
  const destFileName = `icon${path.extname(options.packager.icon)}`;
  const destIconPath = path.join(destAppPath, destFileName);

  log.debug(`Copiar icono ${options.packager.icon} a`, destIconPath);
  await copyFileOrDir(options.packager.icon, destIconPath);
}

function trimUnprocessableOptions(options: AppOptions): void {
  if (
    options.packager.platform === 'win32' &&
    !isWindows() &&
    !hasbin.sync('wine')
  ) {
    const optionsPresent = Object.entries(options)
      .filter(
        ([key, value]) =>
          OPTIONS_REQUIRING_WINDOWS_FOR_WINDOWS_BUILD.includes(key) && !!value,
      )
      .map(([key]) => key);
    if (optionsPresent.length === 0) {
      return;
    }
    log.warn(
      `* No* ajuste [${optionsPresent.join(
        ', ',
      )}], como no pude encontrar Wine.`,
      'Se requiere Wine al empaquetar una aplicación de Windows en plataformas que no son de Windows.',
      'Además, tenga en cuenta que las aplicaciones de Windows creadas en plataformas distintas de Windows sin Wine * carecerán * de ciertos',
      'características, como un icono y un nombre de proceso correctos. Hágase un favor e instale Wine, por favor.',
    );
    for (const keyToUnset of optionsPresent) {
      options[keyToUnset] = null;
    }
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function buildNativefierApp(
  rawOptions: NativefierOptions,
): Promise<string> {
  log.info('Procesando Opciones...');
  const options = await getOptions(rawOptions);

  log.info('\nPreparando la aplicación Electron...');
  const tmpPath = getTempDir('app', 0o755);
  await prepareElectronApp(options.packager.dir, tmpPath, options);

  log.info('\nConversión de iconos...');
  options.packager.dir = tmpPath; // const optionsWithTmpPath = { ...options, dir: tmpPath };
  await convertIconIfNecessary(options);

  log.info(
    '\nEmpaquetado... Esto tomará unos segundos, tal vez minutos si el Electron solicitado aún no está en caché...',
  );
  trimUnprocessableOptions(options);
  electronGet.initializeProxy(); // https://github.com/electron/get#proxies
  const appPathArray = await electronPackager(options.packager);

  log.info('\nFinalizando compilación...');
  const appPath = getAppPath(appPathArray);
  await copyIconsIfNecessary(options, appPath);

  return appPath;
}
