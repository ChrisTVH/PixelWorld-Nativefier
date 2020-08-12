import * as log from 'loglevel';

import { sanitizeFilename } from '../../utils/sanitizeFilename';
import { inferTitle } from '../../infer/inferTitle';
import { DEFAULT_APP_NAME } from '../../constants';

type NameParams = {
  packager: {
    name?: string;
    platform?: string;
    targetUrl: string;
  };
};

async function tryToInferName(targetUrl: string): Promise<string> {
  try {
    log.debug('Inferir nombre para', targetUrl);
    const pageTitle = await inferTitle(targetUrl);
    return pageTitle || DEFAULT_APP_NAME;
  } catch (err) {
    log.warn(
      `No se puede determinar automáticamente el nombre de la aplicación, recurriendo a '${DEFAULT_APP_NAME}'. Razon: ${(err as Error).toString()}`,
    );
    return DEFAULT_APP_NAME;
  }
}

export async function name(options: NameParams): Promise<string> {
  if (options.packager.name) {
    log.debug(
      `Tengo nombre ${options.packager.name} de opciones. No es necesario inferir`,
    );
    return sanitizeFilename(options.packager.platform, options.packager.name);
  }

  const inferredName = await tryToInferName(options.packager.targetUrl);
  return sanitizeFilename(options.packager.platform, inferredName);
}
