#!/usr/bin/env node
import 'source-map-support/register';

import * as commander from 'commander';
import * as dns from 'dns';
import * as log from 'loglevel';

import { buildNativefierApp } from './main';
import { isWindows } from './helpers/helpers';

// package.json is `require`d to let tsc strip the `src` folder by determining
// baseUrl=src. A static import would prevent that and cause an ugly extra "src" folder
const packageJson = require('../package.json'); // eslint-disable-line @typescript-eslint/no-var-requires

function collect(val: any, memo: any[]): any[] {
  memo.push(val);
  return memo;
}

function parseBooleanOrString(val: string): boolean | string {
  switch (val) {
    case 'true':
      return true;
    case 'false':
      return false;
    default:
      return val;
  }
}

function parseJson(val: string): any {
  if (!val) return {};
  try {
    return JSON.parse(val);
  } catch (err) {
    const windowsShellHint = isWindows()
      ? `\n   In particular, Windows cmd doesn't have single quotes, so you have to use only double-quotes plus escaping: "{\\"someKey\\": \\"someValue\\"}"`
      : '';

    log.error(
      `Unable to parse JSON value: ${val}\n` +
        `JSON should look like {"someString": "someValue", "someBoolean": true, "someArray": [1,2,3]}.\n` +
        ` - Only double quotes are allowed, single quotes are not.\n` +
        ` - Learn how your shell behaves and escapes characters.${windowsShellHint}\n` +
        ` - If unsure, validate your JSON using an online service.`,
    );
    throw err;
  }
}

function getProcessEnvs(val: string): any {
  if (!val) {
    return {};
  }
  return parseJson(val);
}

function checkInternet(): void {
  dns.lookup('npmjs.com', (err) => {
    if (err && err.code === 'ENOTFOUND') {
      log.warn(
        '\nSin conexión a Internet\nPara compilar sin conexión, descargue electron desde https://github.com/electron/electron/releases\ny colocar en ~/AppData/Local/electron/Cache/ en Windows,\n~/.cache/electron en Linux or ~/Library/Caches/electron/ en Mac\nUse --electron-version para especificar la versión que descargó.',
      );
    }
  });
}

if (require.main === module) {
  const sanitizedArgs = [];
  process.argv.forEach((arg) => {
    if (sanitizedArgs.length > 0) {
      const previousArg = sanitizedArgs[sanitizedArgs.length - 1];

      // Work around commander.js not supporting default argument for options
      if (
        previousArg === '--tray' &&
        !['true', 'false', 'start-in-tray'].includes(arg)
      ) {
        sanitizedArgs.push('true');
      }
    }
    sanitizedArgs.push(arg);
  });

  const positionalOptions = {
    targetUrl: '',
    out: '',
  };
  const args = commander
    .name('nativefier')
    .version(packageJson.version, '-v, --version')
    .arguments('<targetUrl> [dest]')
    .action((url, outputDirectory) => {
      positionalOptions.targetUrl = url;
      positionalOptions.out = outputDirectory;
    })
    .option('-n, --name <valor>', 'nombre de la app')
    .option('-p, --platform <valor>', "'mac', 'mas', 'linux' o 'windows'")
    .option('-a, --arch <valor>', "'ia32' o 'x64' o 'arm' o 'arm64'")
    .option(
      '--app-version <valor>',
      '(macOS, solo windows) la versión de la aplicación. Se asigna a la propiedad de metadatos `ProductVersion` en Windows y a` CFBundleShortVersionString` en macOS.',
    )
    .option(
      '--build-version <valor>',
      '(macOS, solo windows) La versión de compilación de la aplicación. Se asigna a la propiedad de metadatos `FileVersion` en Windows y a` CFBundleVersion` en macOS',
    )
    .option(
      '--app-copyright <valor>',
      '(macOS, solo windows) una línea de derechos de autor legible por humanos para la aplicación. Se asigna a la propiedad de metadatos `LegalCopyright` en Windows y a` NSHumanReadableCopyright` en macOS',
    )
    .option(
      '--win32metadata <json-string>',
      '(solo Windows) una cadena JSON de pares clave/valor (ProductName, InternalName, FileDescription) para incrustar como metadatos ejecutables',
      parseJson,
    )
    .option(
      '-e, --electron-version <valor>',
      "versión de electron a paquete, sin la 'v', consulte https://github.com/electron/electron/releases",
    )
    .option(
      '--no-overwrite',
      'no anule el directorio de salida si ya existe; por defecto es false',
    )
    .option(
      '-c, --conceal',
      'empaqueta el código fuente de la aplicación en un archivo asar; por defecto es false',
    )
    .option(
      '--counter',
      '(solo macOS) establezca una insignia de recuento de muelle, determinada buscando un número en el título de la ventana; por defecto es false',
    )
    .option(
      '--bounce',
      '(solo macOS) hace que el icono del muelle rebote cuando aumenta el contador; por defecto es false',
    )
    .option(
      '-i, --icon <valor>',
      'el archivo de icono que se utilizará como icono de la aplicación (debe ser un .png, en macOS también puede ser un .icns)',
    )
    .option(
      '--width <valor>',
      'establecer el ancho predeterminado de la ventana; predeterminado a 1280px',
      parseInt,
    )
    .option(
      '--height <valor>',
      'establecer la altura predeterminada de la ventana; predeterminado a 800px',
      parseInt,
    )
    .option(
      '--min-width <valor>',
      'establecer el ancho mínimo de la ventana; predeterminado a 0px',
      parseInt,
    )
    .option(
      '--min-height <valor>',
      'establecer la altura mínima de la ventana; predeterminado a 0px',
      parseInt,
    )
    .option(
      '--max-width <valor>',
      'establecer el ancho máximo de la ventana; por defecto es ilimitado',
      parseInt,
    )
    .option(
      '--max-height <valor>',
      'establecer la altura máxima de la ventana; por defecto es ilimitado',
      parseInt,
    )
    .option('--x <valor>', 'establecer ventana en ubicación x', parseInt)
    .option('--y <valor>', 'establecer ventana en ubicación y', parseInt)
    .option(
      '-m, --show-menu-bar',
      'mostrar la barra de menu por defecto es false',
    )
    .option(
      '-f, --fast-quit',
      '(macOS only) salir de la aplicación al cerrar la ventana; por defecto es false',
    )
    .option(
      '-u, --user-agent <valor>',
      'establecer la cadena del agente de usuario de la aplicación',
    )
    .option(
      '--honest',
      'evitar que el cambio normal de la cadena del agente de usuario aparezca como un navegador Chrome normal',
    )
    .option(
      '--ignore-certificate',
      'ignorar los errores relacionados con el certificado',
    )
    .option('--disable-gpu', 'deshabilitar la aceleración de hardware')
    .option(
      '--ignore-gpu-blacklist',
      'forzar que las aplicaciones WebGL funcionen en GPU no compatibles',
    )
    .option('--enable-es3-apis', 'forzar la activación de WebGL 2.0')
    .option(
      '--insecure',
      'habilitar la carga de contenido inseguro; por defecto es false',
    )
    .option('--flash', 'habilita Adobe Flash; por defecto es false')
    .option(
      '--flash-path <valor>',
      'ruta al complemento flash de Chrome; encontrarlo en `chrome://plugins`',
    )
    .option(
      '--disk-cache-size <valor>',
      'fuerza el espacio máximo en disco (en bytes) que debe utilizar la memoria caché del disco',
    )
    .option(
      '--inject <valor>',
      'ruta a un archivo CSS / JS que se inyectará. Pase varias veces para inyectar varios archivos.',
      collect,
      [],
    )
    .option(
      '--full-screen',
      'siempre inicie la aplicación en pantalla completa',
    )
    .option('--maximize', 'siempre inicie la aplicación maximizada')
    .option(
      '--hide-window-frame',
      'deshabilitar el marco y los controles de la ventana',
    )
    .option(
      '--verbose',
      'habilitar registros detallados / de depuración / resolución de problemas',
    )
    .option(
      '--disable-context-menu',
      'deshabilitar el menú contextual (clic derecho)',
    )
    .option(
      '--disable-dev-tools',
      'deshabilitar las herramientas de desarrollo (Ctrl + Shift + I / F12)',
    )
    .option(
      '--zoom <valor>',
      'factor de zoom predeterminado para usar cuando se abre la aplicación; predeterminado en 1.0',
      parseFloat,
    )
    .option(
      '--internal-urls <valor>',
      'regex de URL para considerar "interno"; todas las demás URL se abrirán en un navegador externo. Predeterminado: URL en el mismo dominio de segundo nivel que la aplicación',
    )
    .option(
      '--block-external-urls',
      `prohibir la navegación a URL que no se consideren "internas" (consulte '--internal-urls'). En lugar de abrir en un navegador externo, se bloquearán los intentos de navegar a URL externas. Predeterminado: false`,
    )
    .option(
      '--proxy-rules <valor>',
      'reglas de proxy; mire https://www.electronjs.org/docs/api/session#sessetproxyconfig',
    )
    .option(
      '--crash-reporter <valor>',
      'URL del servidor remoto para enviar informes de fallos',
    )
    .option(
      '--single-instance',
      'permitir solo una instancia única de la aplicación',
    )
    .option(
      '--clear-cache',
      'evitar que la aplicación conserve la caché entre lanzamientos',
    )
    .option(
      '--processEnvs <json-string>',
      'una cadena JSON de pares clave / valor que se configurará como variables de entorno antes de que se abra cualquier ventana del navegador',
      getProcessEnvs,
    )
    .option(
      '--file-download-options <json-string>',
      'una cadena JSON de pares clave / valor que se configurará como opciones de descarga de archivos. Ver https://github.com/sindresorhus/electron-dl para conocer las opciones disponibles.',
      parseJson,
    )
    .option(
      '--tray [start-in-tray]',
      "Permita que la aplicación permanezca en la bandeja del sistema. Si 'start-in-tray' está configurado como argumento, no muestra la ventana principal en el primer inicio",
      parseBooleanOrString,
    )
    .option(
      '--basic-auth-username <valor>',
      'nombre de usuario de autenticación http (s) básico',
    )
    .option(
      '--basic-auth-password <valor>',
      'contraseña de autenticación http (s) básica',
    )
    .option('--always-on-top', 'habilitar siempre en la ventana superior')
    .option(
      '--title-bar-style <valor>',
      "(macOS solamente) establece el estilo de la barra de título ('hidden', 'hiddenInset'). Considere la posibilidad de inyectar CSS personalizado (a través de --inject) para una mejor integración",
    )
    .option(
      '--global-shortcuts <valor>',
      'Archivo JSON que define accesos directos globales. Ver https://github.com/jiahaog/nativefier/blob/master/docs/api.md#global-shortcuts',
    )
    .option(
      '--browserwindow-options <json-string>',
      'una cadena JSON que se enviará directamente a las opciones de electron BrowserWindow. Ver https://github.com/jiahaog/nativefier/blob/master/docs/api.md#browserwindow-options',
      parseJson,
    )
    .option(
      '--background-color <valor>',
      "establece el color de fondo de la aplicación, para una mejor integración mientras se carga la aplicación. Valor de ejemplo: '#2e2c29'",
    )
    .option(
      '--darwin-dark-mode-support',
      '(solo macOS) habilita la compatibilidad con el modo oscuro en macOS 10.14+',
    );

  try {
    args.parse(sanitizedArgs);
  } catch (err) {
    log.error(
      'No se pudieron analizar los argumentos de la línea de comandos. Abortar.',
    );
    process.exit(1);
  }

  if (!process.argv.slice(2).length) {
    commander.help();
  }
  checkInternet();
  const options = { ...positionalOptions, ...commander.opts() };
  buildNativefierApp(options).catch((error) => {
    log.error(
      'Error durante la compilación. Ejecute con',
      '--verbose para obtener más detalles.', error);
  });
}