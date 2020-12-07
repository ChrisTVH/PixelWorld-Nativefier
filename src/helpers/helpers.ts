import * as os from 'os';
import * as path from 'path';

import axios from 'axios';
import * as hasbin from 'hasbin';
import { ncp } from 'ncp';
import * as log from 'loglevel';
import * as tmp from 'tmp';
tmp.setGracefulCleanup(); // limpieza de directorios temporales incluso cuando se produce una excepción no detectada

const now = new Date();
const TMP_TIME = `${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;

type DownloadResult = {
  data: Buffer;
  ext: string;
};

export function isOSX(): boolean {
  return os.platform() === 'darwin';
}

export function isWindows(): boolean {
  return os.platform() === 'win32';
}

/**
 * Cree un directorio temporal con un nombre compatible con la depuración y devuelva su ruta.
 * Se eliminará automáticamente al salir.
 */
export function getTempDir(prefix: string, mode?: number): string {
  return tmp.dirSync({
    mode,
    unsafeCleanup: true, // eliminar recursivamente tmp dir al salir, incluso si no está vacío.
    prefix: `nativefier-${TMP_TIME}-${prefix}-`,
  }).name;
}

export async function copyFileOrDir(
  sourceFileOrDir: string,
  dest: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    ncp(sourceFileOrDir, dest, (error: any) => {
      if (error) {
        reject(error);
      }
      resolve();
    });
  });
}

export async function downloadFile(fileUrl: string): Promise<DownloadResult> {
  log.debug(`Descargando ${fileUrl}`);
  return axios
    .get(fileUrl, {
      responseType: 'arraybuffer',
    })
    .then((response) => {
      if (!response.data) {
        return null;
      }
      return {
        data: response.data,
        ext: path.extname(fileUrl),
      };
    });
}

export function getAllowedIconFormats(platform: string): string[] {
  const hasIdentify = hasbin.sync('identify');
  const hasConvert = hasbin.sync('convert');
  const hasIconUtil = hasbin.sync('iconutil');

  const pngToIcns = hasConvert && hasIconUtil;
  const pngToIco = hasConvert;
  const icoToIcns = pngToIcns && hasIdentify;
  const icoToPng = hasConvert;

  // Unsupported
  const icnsToPng = false;
  const icnsToIco = false;

  const formats = [];

  // Las secuencias de comandos de shell no se admiten en Windows, anulación temporal
  if (isWindows()) {
    switch (platform) {
      case 'darwin':
        formats.push('.icns');
        break;
      case 'linux':
        formats.push('.png');
        break;
      case 'win32':
        formats.push('.ico');
        break;
      default:
        throw new Error(`Plataforma desconocida ${platform}`);
    }
    log.debug(
      `Formatos de icono permitidos al crear para ${platform} (limitado en Windows):`,
      formats,
    );
    return formats;
  }

  switch (platform) {
    case 'darwin':
      formats.push('.icns');
      if (pngToIcns) {
        formats.push('.png');
      }
      if (icoToIcns) {
        formats.push('.ico');
      }
      break;
    case 'linux':
      formats.push('.png');
      if (icoToPng) {
        formats.push('.ico');
      }
      if (icnsToPng) {
        formats.push('.icns');
      }
      break;
    case 'win32':
      formats.push('.ico');
      if (pngToIco) {
        formats.push('.png');
      }
      if (icnsToIco) {
        formats.push('.icns');
      }
      break;
    default:
      throw new Error(`Plataforma desconocida ${platform}`);
  }
  log.debug(`Formatos de icono permitidos al crear para ${platform}:`, formats);
  return formats;
}

/**
 * Rechazar argumentos como '--n' or '-name', Nosotros aceptamos cualquiera corto '-n' O largo '--name'
 */
export function isArgFormatInvalid(arg: string): boolean {
  return (
    arg.startsWith('---') ||
    /^--[a-z]$/i.exec(arg) !== null ||
    /^-[a-z]{2,}$/i.exec(arg) !== null
  );
}
