import * as log from 'loglevel';

import { icon } from './icon';
import { inferIcon } from '../../infer/inferIcon';

jest.mock('./../../infer/inferIcon');
jest.mock('loglevel');

const mockedResult = 'icon path';
const ICON_PARAMS_PROVIDED = {
  packager: {
    icon: './icon.png',
    targetUrl: 'https://google.com',
    platform: 'mac',
  },
};
const ICON_PARAMS_NEEDS_INFER = {
  packager: {
    targetUrl: 'https://google.com',
    platform: 'mac',
  },
};

describe('cuando se pasa el parámetro de icono', () => {
  test('debería devolver el parámetro de icono', async () => {
    expect(inferIcon).toHaveBeenCalledTimes(0);
    await expect(icon(ICON_PARAMS_PROVIDED)).resolves.toBe(null);
  });
});

describe('cuando no se pasa el parámetro del icono', () => {
  test('debería llamar inferIcon', async () => {
    (inferIcon as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve(mockedResult),
    );
    const result = await icon(ICON_PARAMS_NEEDS_INFER);

    expect(result).toBe(mockedResult);
    expect(inferIcon).toHaveBeenCalledWith(
      ICON_PARAMS_NEEDS_INFER.packager.targetUrl,
      ICON_PARAMS_NEEDS_INFER.packager.platform,
    );
  });

  describe('cuando inferIcon se resuelve con un error', () => {
    test('debería manejar el error', async () => {
      (inferIcon as jest.Mock).mockImplementationOnce(() =>
        Promise.reject(new Error('some error')),
      );
      const result = await icon(ICON_PARAMS_NEEDS_INFER);

      expect(result).toBe(null);
      expect(inferIcon).toHaveBeenCalledWith(
        ICON_PARAMS_NEEDS_INFER.packager.targetUrl,
        ICON_PARAMS_NEEDS_INFER.packager.platform,
      );
      expect(log.warn).toHaveBeenCalledTimes(1); // eslint-disable-line @typescript-eslint/unbound-method
    });
  });
});
