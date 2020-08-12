import * as _ from 'lodash';
import axios from 'axios';
import * as log from 'loglevel';
import { DEFAULT_CHROME_VERSION } from '../constants';

const ELECTRON_VERSIONS_URL = 'https://atom.io/download/atom-shell/index.json';

async function getChromeVersionForElectronVersion(
  electronVersion: string,
  url = ELECTRON_VERSIONS_URL,
): Promise<string> {
  log.debug('Tomando el archivo de versiones de electron <-> chrome de', url);
  const response = await axios.get(url, { timeout: 5000 });
  if (response.status !== 200) {
    throw new Error(
      `Solicitud incorrecta: código de estado ${response.status}`,
    );
  }
  const { data } = response;
  const electronVersionToChromeVersion: _.Dictionary<string> = _.zipObject(
    data.map((d) => d.version),
    data.map((d) => d.chrome),
  );
  if (!(electronVersion in electronVersionToChromeVersion)) {
    throw new Error(
      `Versión de Electron '${electronVersion}' no encontrado en la lista de versiones recuperadas!`,
    );
  }
  const chromeVersion = electronVersionToChromeVersion[electronVersion];
  log.debug(`Electrón asociado v${electronVersion} a chrome v${chromeVersion}`);
  return chromeVersion;
}

export function getUserAgentString(
  chromeVersion: string,
  platform: string,
): string {
  let userAgent: string;
  switch (platform) {
    case 'darwin':
    case 'mas':
      userAgent = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
      break;
    case 'win32':
      userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
      break;
    case 'linux':
      userAgent = `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
      break;
    default:
      throw new Error(
        'Error de plataforma no válida especificada para getUserAgentString()',
      );
  }
  log.debug(
    `Dado Chrome ${chromeVersion} en ${platform},`,
    `usando el agente de usuario: ${userAgent}`,
  );
  return userAgent;
}

export async function inferUserAgent(
  electronVersion: string,
  platform: string,
  url = ELECTRON_VERSIONS_URL,
): Promise<string> {
  log.debug(
    `Inferir agente de usuario para electron ${electronVersion} / ${platform}`,
  );
  try {
    const chromeVersion = await getChromeVersionForElectronVersion(
      electronVersion,
      url,
    );
    return getUserAgentString(chromeVersion, platform);
  } catch (e) {
    log.warn(
      `No se puede inferir la versión de Chrome para el agente de usuario, usando ${DEFAULT_CHROME_VERSION}`,
    );
    return getUserAgentString(DEFAULT_CHROME_VERSION, platform);
  }
}
