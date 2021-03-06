[![Build Status](https://github.com/ChrisTVH/PixelWorld-Nativefier/workflows/ci/badge.svg)](https://github.com/ChrisTVH/PixelWorld-Nativefier/actions?query=workflow%3Aci)

## Introducción

- Para comenzar a utilizarlo requiere las siguiente
- Plataformas: macOS 10.9+ / Windows / Linux

# Dependencias

- Node.js >= 10 y npm >= 6
- Opcionales: ImageMagick y Wine

# Instalación

```bash
npm install -g pixelworld-nativefier
```

- Si le aparece algún error trate de ejecutarlo con sudo


# Guía de desarrollo

## Preparar

Primero, clona el proyecto

```bash
git clone https://github.com/ChrisTVH/PixelWorld-Nativefier.git
cd pixelworld-nativefier/
```

Instale dependencias tanto para la CLI como para la aplicación Electron:

```bash
# Bajo Linux y macOS:
npm run dev-up

# Bajo Windows:
npm run dev-up-win
```

Construir pixelworld-nativefier:

```bash
npm run build
```

Configure un enlace simbólico para que la ejecución de `nativefier` llame a su versión de desarrollo con sus cambios:

```bash
npm link
# si tienes GNU/Linux ejecuta esto también
which nativefier
# -> Debería devolver un camino, e.g. /home/tu-usuario/.node_modules/lib/node_modules/nativefier
# Si no, asegúrese de `npm_config_prefix` Env var está configurado y en tu `RUTA`
```

Después de hacerlo, puede ejecutar Nativefier con sus parámetros de prueba:

```bash
nativefier --tu-increíble-nueva-bandera 'https://tu-stio-de-prueba.com'
```

Luego ejecute su aplicación nativefier _a través de la línea de comando también_ (para ver registros y errores):

```bash
# Bajo Linux
./tu-sitio-de-prueba-linux-x64/tu-sitio-de-prueba

# Bajo Windows
tu-sitio-de-prueba-win32-x64/tu-sitio-de-prueba.exe

# Bajo macOS
open -a TuSitioDePrueba.app
```

## Linting y formateo

Usos de Nativefier [Prettier](https://prettier.io/), que te gritará por
no formatear el código exactamente como se espera. Esto garantiza un estilo homogéneo,
pero es doloroso hacerlo manualmente. Hágase un favor e instale un
[Prettier Plugin para tu editor](https://prettier.io/docs/en/editors.html).

## Pruebas

- Para ejecutar todas las pruebas, `npm t`
- Para ejecutar solo pruebas unitarias, `npm run test:unit`
- Para ejecutar solo pruebas de integración, `npm run test:integration`
- El registro se suprime por defecto en las pruebas, para evitar contaminar
- la salida de Jest.
- Para obtener registros de depuración, `npm run test:withlog` o establecer el `LOGLEVEL` env. var.
- Para una buena experiencia en vivo, abra dos paneles / pestañas de terminal que
- ejecutan observadores de código / pruebas:
  1. Ejecute un observador de TSC: `npm run build:watch`
  2. Ejecute un observador de pruebas unitarias de Jest: `npm run test:watch`
- Alternativamente, puede ejecutar ambos procesos de prueba en la misma terminal
- ejecutando: `npm run watch`

## Guía de Uso

- [Dame un click para ir la guía basica](https://github.com/jiahaog/nativefier/blob/master/README.md)

- [Proyecto Original](https://github.com/jiahaog/nativefier).