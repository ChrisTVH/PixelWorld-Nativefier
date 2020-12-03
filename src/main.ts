import 'source-map-support/register';

import { buildNativefierApp } from './build/buildNativefierApp';

export { buildNativefierApp };

/**
 * Solo para compatibilidad con Nativefier <= 7.7.1 !
 * ¡Use la mejor y moderna async `buildNativefierApp` en su lugar si puede!
 */
function buildNativefierAppOldCallbackStyle(
  options: any, // eslint-disable-line @typescript-eslint/explicit-module-boundary-types
  callback: (err: any, result?: any) => void,
): void {
  buildNativefierApp(options)
    .then((result) => callback(null, result))
    .catch((err) => callback(err));
}

export default buildNativefierAppOldCallbackStyle;
