import * as os from 'os';
import * as log from 'loglevel';

export function inferPlatform(): string {
  const platform = os.platform();
  if (
    platform === 'darwin' ||
    // @ts-ignore
    platform === 'mas' ||
    platform === 'win32' ||
    platform === 'linux'
  ) {
    log.debug('Plataforma inferida', platform);
    return platform;
  }

  throw new Error(`Plataforma no probada ${platform} detectada`);
}

export function inferArch(): string {
  const arch = os.arch();
  if (arch !== 'ia32' && arch !== 'x64' && arch !== 'arm') {
    throw new Error(`Arquitectura incompatible ${arch} detectada`);
  }
  log.debug('Arquitectura inferida', arch);
  return arch;
}
