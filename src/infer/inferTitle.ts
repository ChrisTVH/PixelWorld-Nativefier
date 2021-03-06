import axios from 'axios';
import * as cheerio from 'cheerio';
import * as log from 'loglevel';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.1 Safari/537.36';

export async function inferTitle(url: string): Promise<string> {
  const { data } = await axios.get(url, {
    headers: {
      // Agente de usuario falso para páginas como http://messenger.com
      'User-Agent': USER_AGENT,
    },
  });
  log.debug(`Obtenido ${(data.length / 1024).toFixed(1)} kb página en`, url);
  const $ = cheerio.load(data);
  const inferredTitle = $('title').first().text();

  log.debug('Título inferido:', inferredTitle);
  return inferredTitle;
}
