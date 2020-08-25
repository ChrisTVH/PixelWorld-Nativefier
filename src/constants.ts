import * as path from 'path';

export const DEFAULT_APP_NAME = 'APP';

// Actualizar ambos juntos
export const DEFAULT_ELECTRON_VERSION = '10.0.0';
export const DEFAULT_CHROME_VERSION = '83.0.4103.122';

export const ELECTRON_MAJOR_VERSION = parseInt(
  DEFAULT_ELECTRON_VERSION.split('.')[0],
  10,
);
export const PLACEHOLDER_APP_DIR = path.join(__dirname, './../', 'app');
