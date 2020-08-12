import { normalizeUrl } from './normalizeUrl';

test('una URL adecuada no debe estar alterada', () => {
  expect(normalizeUrl('http://www.google.com')).toEqual(
    'http://www.google.com/',
  );
});

test('el protocolo que falta debe ser https', () => {
  expect(normalizeUrl('www.google.com')).toEqual('https://www.google.com/');
});

test('una URL adecuada no debe estar alterada', () => {
  expect(() => {
    normalizeUrl('http://ssddfoo bar');
  }).toThrow('Your url "http://ssddfoo bar" Es invalido');
});
