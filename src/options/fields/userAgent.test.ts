import { userAgent } from './userAgent';
import { inferUserAgent } from '../../infer/inferUserAgent';

jest.mock('./../../infer/inferUserAgent');

test('cuando se pasa un parámetro userAgent', async () => {
  expect(inferUserAgent).toHaveBeenCalledTimes(0);

  const params = {
    packager: {},
    nativefier: { userAgent: 'Agente de usuario válido' },
  };
  await expect(userAgent(params)).resolves.toBe(null);
});

test('no se pasa ningún parámetro userAgent', async () => {
  const params = {
    packager: { electronVersion: '123', platform: 'mac' },
    nativefier: {},
  };
  await userAgent(params);
  expect(inferUserAgent).toHaveBeenCalledWith(
    params.packager.electronVersion,
    params.packager.platform,
  );
});
