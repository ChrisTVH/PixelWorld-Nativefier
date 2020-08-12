import * as path from 'path';

import * as shell from 'shelljs';

import { isWindows, isOSX, getTempDir } from './helpers';
import * as log from 'loglevel';

const SCRIPT_PATHS = {
  singleIco: path.join(__dirname, '../..', 'icon-scripts/singleIco'),
  convertToPng: path.join(__dirname, '../..', 'icon-scripts/convertToPng'),
  convertToIco: path.join(__dirname, '../..', 'icon-scripts/convertToIco'),
  convertToIcns: path.join(__dirname, '../..', 'icon-scripts/convertToIcns'),
};

/**
 * Executes a shell script with the form "./pathToScript param1 param2"
 */
async function iconShellHelper(
  shellScriptPath: string,
  icoSource: string,
  icoDestination: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (isWindows()) {
      reject(
        new Error(
          'La conversión de iconos solo es compatible con macOS o Linux. ' +
            'Si está compilando para Windows, descargue/cree un .ico y páselo con --icon favicon.ico . ' +
            'Si construye para macOS/Linux, hágalo desde macOS/Linux',
        ),
      );
      return;
    }

    const shellCommand = `"${shellScriptPath}" "${icoSource}" "${icoDestination}"`;
    log.debug(
      `Convirtiendo icono ${icoSource} a ${icoDestination}.`,
      `Llamando: ${shellCommand}`,
    );
    shell.exec(shellCommand, { silent: true }, (exitCode, stdOut, stdError) => {
      if (exitCode) {
        reject({
          stdOut,
          stdError,
        });
        return;
      }

      log.debug(
        `La conversión se realizó correctamente y se produjo un ícono en ${icoDestination}`,
      );
      resolve(icoDestination);
    });
  });
}

export function singleIco(icoSrc: string): Promise<string> {
  return iconShellHelper(
    SCRIPT_PATHS.singleIco,
    icoSrc,
    `${getTempDir('iconconv')}/icon.ico`,
  );
}

export async function convertToPng(icoSrc: string): Promise<string> {
  return iconShellHelper(
    SCRIPT_PATHS.convertToPng,
    icoSrc,
    `${getTempDir('iconconv')}/icon.png`,
  );
}

export async function convertToIco(icoSrc: string): Promise<string> {
  return iconShellHelper(
    SCRIPT_PATHS.convertToIco,
    icoSrc,
    `${getTempDir('iconconv')}/icon.ico`,
  );
}

export async function convertToIcns(icoSrc: string): Promise<string> {
  if (!isOSX()) {
    throw new Error('Se requiere macOS para convertir a un ícono .icns');
  }

  return iconShellHelper(
    SCRIPT_PATHS.convertToIcns,
    icoSrc,
    `${getTempDir('iconconv')}/icon.icns`,
  );
}
