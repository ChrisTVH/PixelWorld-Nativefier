import { processOptions } from './fields';

test('Las opciones asincrónicas completamente definidas se devuelven tal cual', async () => {
  const options = {
    packager: {
      icon: '/mi/icon.png',
      name: 'mi hermosa aplicación ',
      targetUrl: 'https://miurl.com',
      dir: '/tmp/miapp',
    },
    nativefier: { userAgent: 'agente de usuario aleatorio' },
  };
  // @ts-ignore
  await processOptions(options);

  expect(options.packager.icon).toEqual('/mi/icon.png');
  expect(options.packager.name).toEqual('mi hermosa aplicación');
  expect(options.nativefier.userAgent).toEqual('agente de usuario aleatorio');
});

test('El agente de usuario se infiere si no se pasa', async () => {
  const options = {
    packager: {
      icon: '/mi/icon.png',
      name: 'mi hermosa aplicación ',
      targetUrl: 'https://miurl.com',
      dir: '/tmp/miapp',
      platform: 'linux',
    },
    nativefier: { userAgent: undefined },
  };
  // @ts-ignore
  await processOptions(options);

  expect(options.nativefier.userAgent).toMatch(/Linux.*Chrome/);
});
