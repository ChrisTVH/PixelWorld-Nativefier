import { Menu, clipboard, shell, MenuItemConstructorOptions } from 'electron';

export function createMenu({
  nativefierVersion,
  appQuit,
  zoomIn,
  zoomOut,
  zoomReset,
  zoomBuildTimeValue,
  goBack,
  goForward,
  getCurrentUrl,
  clearAppData,
  disableDevTools,
}): void {
  const zoomResetLabel =
    zoomBuildTimeValue === 1.0
      ? 'Restablecer Zoom'
      : `Restablecer zoom (a ${
          zoomBuildTimeValue * 100
        }%, establecido en el momento de la construcción)`;

  const editMenu: MenuItemConstructorOptions = {
    label: '&Editar',
    submenu: [
      {
        label: 'Deshacer',
        accelerator: 'CmdOrCtrl+Z',
        role: 'undo',
      },
      {
        label: 'Rehacer',
        accelerator: 'Shift+CmdOrCtrl+Z',
        role: 'redo',
      },
      {
        type: 'separator',
      },
      {
        label: 'Cortar',
        accelerator: 'CmdOrCtrl+X',
        role: 'cut',
      },
      {
        label: 'Copiar',
        accelerator: 'CmdOrCtrl+C',
        role: 'copy',
      },
      {
        label: 'Copiar URL actual',
        accelerator: 'CmdOrCtrl+L',
        click: () => {
          const currentURL = getCurrentUrl();
          clipboard.writeText(currentURL);
        },
      },
      {
        label: 'Pegar',
        accelerator: 'CmdOrCtrl+V',
        role: 'paste',
      },
      {
        label: 'Pegar y combinar estilo',
        accelerator: 'CmdOrCtrl+Shift+V',
        role: 'pasteAndMatchStyle',
      },
      {
        label: 'Seleccionar Todo',
        accelerator: 'CmdOrCtrl+A',
        role: 'selectAll',
      },
      {
        label: 'Borrar datos de la aplicación',
        click: clearAppData,
      },
    ],
  };

  const viewMenu: MenuItemConstructorOptions = {
    label: '&Ver',
    submenu: [
      {
        label: 'Atras',
        accelerator: (() => {
          const backKbShortcut =
            process.platform === 'darwin' ? 'Cmd+Left' : 'Alt+Left';
          return backKbShortcut;
        })(),
        click: goBack,
      },
      {
        label: 'AtrásAdditionalShortcut',
        visible: false,
        acceleratorWorksWhenHidden: true,
        accelerator: 'CmdOrCtrl+[', // What old versions of Nativefier used, kept for backwards compat
        click: goBack,
      },
      {
        label: 'Siguiente',
        accelerator: (() => {
          const forwardKbShortcut =
            process.platform === 'darwin' ? 'Cmd+Right' : 'Alt+Right';
          return forwardKbShortcut;
        })(),
        click: goForward,
      },
      {
        label: 'AdelanteAdditionalShortcut',
        visible: false,
        acceleratorWorksWhenHidden: true,
        accelerator: 'CmdOrCtrl+]', // What old versions of Nativefier used, kept for backwards compat
        click: goForward,
      },
      {
        label: 'Recargar',
        accelerator: 'CmdOrCtrl+R',
        click: (item, focusedWindow) => {
          if (focusedWindow) {
            focusedWindow.reload();
          }
        },
      },
      {
        type: 'separator',
      },
      {
        label: 'Alternar pantalla completa',
        accelerator: (() => {
          if (process.platform === 'darwin') {
            return 'Ctrl+Cmd+F';
          }
          return 'F11';
        })(),
        click: (item, focusedWindow) => {
          if (focusedWindow) {
            focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
          }
        },
      },
      {
        label: 'Acercarse',
        accelerator: 'CmdOrCtrl+=',
        click: zoomIn,
      },
      {
        label: 'AcercarseAdditionalShortcut',
        visible: false,
        acceleratorWorksWhenHidden: true,
        accelerator: 'CmdOrCtrl+numadd',
        click: zoomIn,
      },
      {
        label: 'Alejarse',
        accelerator: 'CmdOrCtrl+-',
        click: zoomOut,
      },
      {
        label: 'AlejarseAdditionalShortcut',
        visible: false,
        acceleratorWorksWhenHidden: true,
        accelerator: 'CmdOrCtrl+numsub',
        click: zoomOut,
      },
      {
        label: zoomResetLabel,
        accelerator: 'CmdOrCtrl+0',
        click: zoomReset,
      },
      {
        label: 'ResetearAcercamientoAdditionalShortcut',
        visible: false,
        acceleratorWorksWhenHidden: true,
        accelerator: 'CmdOrCtrl+num0',
        click: zoomReset,
      },
    ],
  };

  if (!disableDevTools) {
    (viewMenu.submenu as MenuItemConstructorOptions[]).push(
      {
        type: 'separator',
      },
      {
        label: 'Alternar herramientas para desarrolladores',
        accelerator: (() => {
          if (process.platform === 'darwin') {
            return 'Alt+Cmd+I';
          }
          return 'Ctrl+Shift+I';
        })(),
        click: (item, focusedWindow) => {
          if (focusedWindow) {
            focusedWindow.webContents.toggleDevTools();
          }
        },
      },
    );
  }

  const windowMenu: MenuItemConstructorOptions = {
    label: '&Ventana',
    role: 'window',
    submenu: [
      {
        label: 'Minimize',
        accelerator: 'CmdOrCtrl+M',
        role: 'minimize',
      },
      {
        label: 'Cerrar',
        accelerator: 'CmdOrCtrl+W',
        role: 'close',
      },
    ],
  };

  const helpMenu: MenuItemConstructorOptions = {
    label: '&Ayuda',
    role: 'help',
    submenu: [
      {
        label: `Construido con tecnologia de PixelWorld y Electron + Nativefier v${nativefierVersion}`,
        click: () => {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          shell.openExternal('https://discord.gg/C6XR9nB');
        },
      },
      {
        label: 'Reportar un problema',
        click: () => {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          shell.openExternal('https://discord.gg/C6XR9nB');
        },
      },
    ],
  };

  let menuTemplate: MenuItemConstructorOptions[];

  if (process.platform === 'darwin') {
    const electronMenu: MenuItemConstructorOptions = {
      label: 'E&lectron',
      submenu: [
        {
          label: 'Servicios',
          role: 'services',
          submenu: [],
        },
        {
          type: 'separator',
        },
        {
          label: 'Esconder App',
          accelerator: 'Cmd+H',
          role: 'hide',
        },
        {
          label: 'Ocultar a otros',
          accelerator: 'Cmd+Shift+H',
          role: 'hideOthers',
        },
        {
          label: 'Mostrar todo',
          role: 'unhide',
        },
        {
          type: 'separator',
        },
        {
          label: 'Salir',
          accelerator: 'Cmd+Q',
          click: appQuit,
        },
      ],
    };
    (windowMenu.submenu as MenuItemConstructorOptions[]).push(
      {
        type: 'separator',
      },
      {
        label: 'Traer todo al frente',
        role: 'front',
      },
    );
    menuTemplate = [electronMenu, editMenu, viewMenu, windowMenu, helpMenu];
  } else {
    menuTemplate = [editMenu, viewMenu, windowMenu, helpMenu];
  }

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}
