import { shell } from 'electron';
import contextMenu from 'electron-context-menu';

export function initContextMenu(createNewWindow, createNewTab): void {
  contextMenu({
    prepend: (actions, params) => {
      const items = [];
      if (params.linkURL) {
        items.push({
          label: 'Abrir enlace en el navegador predeterminado',
          click: () => {
            shell.openExternal(params.linkURL); // eslint-disable-line @typescript-eslint/no-floating-promises
          },
        });
        items.push({
          label: 'Abrir enlace en una nueva ventana',
          click: () => {
            createNewWindow(params.linkURL);
          },
        });
        if (createNewTab) {
          items.push({
            label: 'Abrir enlace en una nueva pestaña',
            click: () => {
              createNewTab(params.linkURL, false);
            },
          });
        }
      }
      return items;
    },
  });
}
