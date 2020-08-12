import axios, { AxiosResponse } from 'axios';

import { inferTitle } from './inferTitle';

test('devuelve el título correcto', async () => {
  const axiosGetMock = jest.spyOn(axios, 'get');
  const mockedResponse: AxiosResponse<string> = {
    data: `
      <HTML>
        <head>
          <title>TEST_TITLE</title>
        </head>
      </HTML>`,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
  };
  axiosGetMock.mockResolvedValue(mockedResponse);
  const result = await inferTitle('alguna url');

  expect(axiosGetMock).toHaveBeenCalledTimes(1);
  expect(result).toBe('TEST_TITLE');
});
