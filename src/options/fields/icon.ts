import * as log from 'loglevel';

import { inferIcon } from '../../infer/inferIcon';

type IconParams = {
  packager: {
    icon?: string;
    targetUrl: string;
    platform?: string;
  };
};

export async function icon(options: IconParams): Promise<string> {
  if (options.packager.icon) {
    log.debug(
      'Obtuve el ícono de las opciones. Usándolo, no es necesario inferir',
    );
    return null;
  }

  try {
    return await inferIcon(
      options.packager.targetUrl,
      options.packager.platform,
    );
  } catch (error) {
    log.warn(
      'No se puede recuperar automáticamente el icono de la aplicación:',
      error,
    );
    return null;
  }
}
