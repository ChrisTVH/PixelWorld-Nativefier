import * as path from 'path';

import * as log from 'loglevel';

import { isOSX } from '../helpers/helpers';
import {
  convertToPng,
  convertToIco,
  convertToIcns,
} from '../helpers/iconShellHelpers';
import { AppOptions } from '../options/model';

function iconIsIco(iconPath: string): boolean {
  return path.extname(iconPath) === '.ico';
}

function iconIsPng(iconPath: string): boolean {
  return path.extname(iconPath) === '.png';
}

function iconIsIcns(iconPath: string): boolean {
  return path.extname(iconPath) === '.icns';
}

/**
 * Convertirá un icono `.png` al formato de arco apropiado (si es necesario),
 * y devolver opciones ajustadas
 */
export async function convertIconIfNecessary(
  options: AppOptions,
): Promise<void> {
  if (!options.packager.icon) {
    log.debug(
      'La opción "icono" no está configurada, omitiendo la conversión de iconos.',
    );
    return;
  }

  if (options.packager.platform === 'win32') {
    if (iconIsIco(options.packager.icon)) {
      log.debug(
        'La construcción para Windows y el ícono ya son .ico, no se necesita conversión',
      );
      return;
    }

    try {
      const iconPath = await convertToIco(options.packager.icon);
      options.packager.icon = iconPath;
      return;
    } catch (error) {
      log.warn('No se pudo convertir el ícono a .ico, omitiendo.', error);
      return;
    }
  }

  if (options.packager.platform === 'linux') {
    if (iconIsPng(options.packager.icon)) {
      log.debug(
        'La construcción para Linux y el icono ya es un .png, no se necesita conversión',
      );
      return;
    }

    try {
      const iconPath = await convertToPng(options.packager.icon);
      options.packager.icon = iconPath;
      return;
    } catch (error) {
      log.warn('No se pudo convertir el ícono a .png, omitiendo.', error);
      return;
    }
  }

  if (iconIsIcns(options.packager.icon)) {
    log.debug(
      'La construcción para macOS y el icono ya es un .icns, no se necesita conversión',
    );
    return;
  }

  if (!isOSX()) {
    log.warn(
      'Omitiendo la conversión de íconos a .icns, la conversión solo es compatible con macOS',
    );
    return;
  }

  try {
    const iconPath = await convertToIcns(options.packager.icon);
    options.packager.icon = iconPath;
    return;
  } catch (error) {
    log.warn('No se pudo convertir el ícono a .icns, omitiendo.', error);
    options.packager.icon = undefined;
    return;
  }
}
