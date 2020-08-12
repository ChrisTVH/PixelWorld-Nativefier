import * as url from 'url';

import * as log from 'loglevel';

function appendProtocol(inputUrl: string): string {
  const parsed = url.parse(inputUrl);
  if (!parsed.protocol) {
    const urlWithProtocol = `https://${inputUrl}`;
    log.warn(
      `URL "${inputUrl}" carece de un protocolo.`,
      `Intentará analizarlo como HTTPS: "${urlWithProtocol}".`,
      `Por favor pase "http://${inputUrl}" si esto es lo que quisiste decir.`,
    );
    return urlWithProtocol;
  }
  return inputUrl;
}

export function normalizeUrl(urlToNormalize: string): string {
  const urlWithProtocol = appendProtocol(urlToNormalize);

  let parsedUrl: url.URL;
  try {
    parsedUrl = new url.URL(urlWithProtocol);
  } catch (err) {
    throw `Tu url "${urlWithProtocol}" Es invalido`;
  }
  const normalizedUrl = parsedUrl.toString();
  log.debug(`URL normalizada ${urlToNormalize} a:`, normalizedUrl);
  return normalizedUrl;
}
