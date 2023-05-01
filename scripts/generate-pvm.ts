import fs from 'fs';
import path from 'path';
import { generateImageFile } from 'swipl-wasm/dist/generateImage';
import { fetchRetry } from './util';

async function main() {
  const EYE_URL = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json')).toString()).config.eye.url;
  const releaseInfo = (await (await fetchRetry(EYE_URL)).json());
  return generateImageFile(
    `https://raw.githubusercontent.com/eyereasoner/eye/${releaseInfo.tag_name}/eye.pl`,
    path.join(__dirname, '..', 'lib', 'eye.ts'),
  );
}

main();
