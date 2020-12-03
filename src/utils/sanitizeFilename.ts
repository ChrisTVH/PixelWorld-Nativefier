import * as log from 'loglevel';

import { DEFAULT_APP_NAME } from '../constants';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sanitize = require('sanitize-filename');

export function sanitizeFilename(
  platform: string,
  filenameToSanitize: string,
): string {
  let result: string = sanitize(filenameToSanitize);

  // eliminar todo lo que no sea ascii o usar el nombre de la aplicación predeterminada
  // eslint-disable-next-line no-control-regex
  result = result.replace(/[^\x00-\x7F]/g, '') || DEFAULT_APP_NAME;

  // los espacios causarán problemas con Ubuntu cuando se fijen al dock
  if (platform === 'linux') {
    result = result.replace(/ /g, '');
  }
  log.debug(`Sanitized filename for ${filenameToSanitize} : ${result}`);
  return result;
}
