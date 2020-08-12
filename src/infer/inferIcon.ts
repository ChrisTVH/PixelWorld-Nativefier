import * as path from 'path';
import { writeFile } from 'fs';
import { promisify } from 'util';

import * as gitCloud from 'gitcloud';
import * as pageIcon from 'page-icon';

import {
  downloadFile,
  getAllowedIconFormats,
  getTempDir,
} from '../helpers/helpers';
import * as log from 'loglevel';

const writeFileAsync = promisify(writeFile);

const GITCLOUD_SPACE_DELIMITER = '-';
const GITCLOUD_URL = 'https://jiahaog.github.io/nativefier-icons/';

function getMaxMatchScore(iconWithScores: any[]): number {
  const score = iconWithScores.reduce((maxScore, currentIcon) => {
    const currentScore = currentIcon.score;
    if (currentScore > maxScore) {
      return currentScore;
    }
    return maxScore;
  }, 0);
  log.debug('Puntuación máxima de coincidencia de iconos:', score);
  return score;
}

function getMatchingIcons(iconsWithScores: any[], maxScore: number): any[] {
  return iconsWithScores
    .filter((item) => item.score === maxScore)
    .map((item) => ({ ...item, ext: path.extname(item.url) }));
}

function mapIconWithMatchScore(cloudIcons: any[], targetUrl: string): any {
  const normalisedTargetUrl = targetUrl.toLowerCase();
  return cloudIcons.map((item) => {
    const itemWords = item.name.split(GITCLOUD_SPACE_DELIMITER);
    const score = itemWords.reduce((currentScore: number, word: string) => {
      if (normalisedTargetUrl.includes(word)) {
        return currentScore + 1;
      }
      return currentScore;
    }, 0);

    return { ...item, score };
  });
}

async function inferIconFromStore(
  targetUrl: string,
  platform: string,
): Promise<any> {
  log.debug(`Inferir icono de la tienda para ${targetUrl} en ${platform}`);
  const allowedFormats = new Set(getAllowedIconFormats(platform));

  const cloudIcons: any[] = await gitCloud(GITCLOUD_URL);
  log.debug(`Tiene ${cloudIcons.length} iconos de gitcloud`);
  const iconWithScores = mapIconWithMatchScore(cloudIcons, targetUrl);
  const maxScore = getMaxMatchScore(iconWithScores);

  if (maxScore === 0) {
    log.debug('Ningún icono relevante en la tienda.');
    return null;
  }

  const iconsMatchingScore = getMatchingIcons(iconWithScores, maxScore);
  const iconsMatchingExt = iconsMatchingScore.filter((icon) =>
    allowedFormats.has(icon.ext),
  );
  const matchingIcon = iconsMatchingExt[0];
  const iconUrl = matchingIcon && matchingIcon.url;

  if (!iconUrl) {
    log.debug('No se pudo inferir el ícono de la tienda');
    return null;
  }
  return downloadFile(iconUrl);
}

export async function inferIcon(
  targetUrl: string,
  platform: string,
): Promise<string> {
  log.debug(`Inferir icono para ${targetUrl} em ${platform}`);
  const tmpDirPath = getTempDir('iconinfer');

  let icon: { ext: string; data: Buffer } = await inferIconFromStore(
    targetUrl,
    platform,
  );
  if (!icon) {
    const ext = platform === 'win32' ? '.ico' : '.png';
    log.debug(`Tratando de extraer un ${ext} icono de la página.`);
    icon = await pageIcon(targetUrl, { ext });
  }
  if (!icon) {
    return null;
  }
  log.debug(`Obtuve un ícono de la página.`);

  const iconPath = path.join(tmpDirPath, `/icon${icon.ext}`);
  log.debug(
    `Escribiendo ${(icon.data.length / 1024).toFixed(1)} kb icon a ${iconPath}`,
  );
  await writeFileAsync(iconPath, icon.data);
  return iconPath;
}
