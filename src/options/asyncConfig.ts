import * as log from 'loglevel';

import { processOptions } from './fields/fields';
import { AppOptions } from './model';

/**
 * Toma el objeto de opciones e infiere nuevos valores que necesitan trabajo asincrónico
 */
export async function asyncConfig(options: AppOptions): Promise<any> {
  log.debug('\nRealización de posprocesamiento de opciones asíncronas.');
  await processOptions(options);
}
