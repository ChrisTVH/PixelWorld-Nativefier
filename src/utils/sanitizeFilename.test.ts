import { sanitizeFilename } from './sanitizeFilename';
import { DEFAULT_APP_NAME } from '../constants';

describe('reemplazando caracteres no ascii', () => {
  const nonAscii = '�';
  test('debería devolver un resultado sin caracteres no ascii', () => {
    const param = `${nonAscii}abc`;
    const expectedResult = 'abc';
    const result = sanitizeFilename('', param);
    expect(result).toBe(expectedResult);
  });

  describe('cuando el resultado de reemplazar estos caracteres está vacío', () => {
    const result = sanitizeFilename('', nonAscii);
    expect(result).toBe(DEFAULT_APP_NAME);
  });
});

describe('cuando la plataforma es linux', () => {
  test('debe devolver un nombre sin espacios', () => {
    const param = 'somename';
    const expectedResult = 'somename';
    const result = sanitizeFilename('linux', param);
    expect(result).toBe(expectedResult);
  });
});
