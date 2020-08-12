import { linkIsInternal, getCounterValue } from './helpers';

const internalUrl = 'https://medium.com/';
const internalUrlSubPath = 'topic/technology';
const externalUrl = 'https://www.wikipedia.org/wiki/Electron';
const wildcardRegex = /.*/;

test('la URL original debe ser interna', () => {
  expect(linkIsInternal(internalUrl, internalUrl, undefined)).toEqual(true);
});

test('las subrutas de la URL original deben ser internas', () => {
  expect(
    linkIsInternal(internalUrl, internalUrl + internalUrlSubPath, undefined),
  ).toEqual(true);
});

test("'about: blank 'debe ser interno", () => {
  expect(linkIsInternal(internalUrl, 'about:blank', undefined)).toEqual(true);
});

test('las URL de diferentes sitios no deben ser internas', () => {
  expect(linkIsInternal(internalUrl, externalUrl, undefined)).toEqual(false);
});

test('todas las URL deben ser internas con expresiones regulares comodín', () => {
  expect(linkIsInternal(internalUrl, externalUrl, wildcardRegex)).toEqual(true);
});

const smallCounterTitle = 'Inbox (11) - nobody@example.com - Gmail';
const largeCounterTitle = 'Inbox (8,756) - nobody@example.com - Gmail';
const noCounterTitle = 'Inbox - nobody@example.com - Gmail';

test('getCounterValue debería devolver undefined para títulos sin números de contador', () => {
  expect(getCounterValue(noCounterTitle)).toEqual(undefined);
});

test('getCounterValue debería devolver una cadena para pequeños números de contador en el título', () => {
  expect(getCounterValue(smallCounterTitle)).toEqual('11');
});

test('getCounterValue debería devolver una cadena para números de contador grandes en el título', () => {
  expect(getCounterValue(largeCounterTitle)).toEqual('8,756');
});
