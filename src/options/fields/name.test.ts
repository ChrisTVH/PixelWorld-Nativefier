import * as log from 'loglevel';

import { name } from './name';
import { DEFAULT_APP_NAME } from '../../constants';
import { inferTitle } from '../../infer/inferTitle';
import { sanitizeFilename } from '../../utils/sanitizeFilename';

jest.mock('./../../infer/inferTitle');
jest.mock('./../../utils/sanitizeFilename');
jest.mock('loglevel');

const inferTitleMockedResult = 'mock name';
const NAME_PARAMS_PROVIDED = {
  packager: {
    name: 'appname',
    targetUrl: 'https://google.com',
    platform: 'linux',
  },
};
const NAME_PARAMS_NEEDS_INFER = {
  packager: {
    targetUrl: 'https://google.com',
    platform: 'mac',
  },
};
beforeAll(() => {
  (sanitizeFilename as jest.Mock).mockImplementation(
    (_, filename: string) => filename,
  );
});

describe('parámetros de nombre bien formados', () => {
  test('no debería llamar inferTitle', async () => {
    const result = await name(NAME_PARAMS_PROVIDED);

    expect(inferTitle).toHaveBeenCalledTimes(0);
    expect(result).toBe(NAME_PARAMS_PROVIDED.packager.name);
  });

  test('debería llamar a sanitize filename', async () => {
    const result = await name(NAME_PARAMS_PROVIDED);

    expect(sanitizeFilename).toHaveBeenCalledWith(
      NAME_PARAMS_PROVIDED.packager.platform,
      result,
    );
  });
});

describe('parámetros de mal nombre', () => {
  beforeEach(() => {
    (inferTitle as jest.Mock).mockResolvedValue(inferTitleMockedResult);
  });

  const params = {
    packager: { targetUrl: 'alguna url', platform: 'lo que sea' },
  };
  test('debería llamar inferTitle cuando el nombre no está definido', async () => {
    await name(params);
    expect(inferTitle).toHaveBeenCalledWith(params.packager.targetUrl);
  });

  test('debería llamar inferTitle cuando el nombre es una cadena vacía', async () => {
    const testParams = {
      ...params,
      name: '',
    };

    await name(testParams);
    expect(inferTitle).toHaveBeenCalledWith(params.packager.targetUrl);
  });

  test('debería llamar a sanitize filename', async () => {
    const result = await name(params);
    expect(sanitizeFilename).toHaveBeenCalledWith(
      params.packager.platform,
      result,
    );
  });
});

describe('manejo de resultados inferTitle', () => {
  test('debería devolver el resultado de inferTitle', async () => {
    const result = await name(NAME_PARAMS_NEEDS_INFER);

    expect(result).toEqual(inferTitleMockedResult);
    expect(inferTitle).toHaveBeenCalledWith(
      NAME_PARAMS_NEEDS_INFER.packager.targetUrl,
    );
  });

  test('debería devolver el nombre de la aplicación predeterminada cuando el pageTitle devuelto es falso', async () => {
    (inferTitle as jest.Mock).mockResolvedValue(null);
    const result = await name(NAME_PARAMS_NEEDS_INFER);

    expect(result).toEqual(DEFAULT_APP_NAME);
    expect(inferTitle).toHaveBeenCalledWith(
      NAME_PARAMS_NEEDS_INFER.packager.targetUrl,
    );
  });

  test('debería devolver el nombre de la aplicación predeterminada cuando inferTitle rechaza', async () => {
    (inferTitle as jest.Mock).mockRejectedValue('algún error');
    const result = await name(NAME_PARAMS_NEEDS_INFER);

    expect(result).toEqual(DEFAULT_APP_NAME);
    expect(inferTitle).toHaveBeenCalledWith(
      NAME_PARAMS_NEEDS_INFER.packager.targetUrl,
    );
    expect(log.warn).toHaveBeenCalledTimes(1); // eslint-disable-line @typescript-eslint/unbound-method
  });
});
