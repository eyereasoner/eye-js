import fs from 'fs';
import path from 'path';
import { generateImageFile } from 'swipl-wasm/dist/generateImage';
import { fetchRetry } from './util';

const nm = process.argv.find((name) => name.startsWith('--name='))?.slice(7).split('.')[0] ?? 'eye';

async function main() {
  const EYE_URL = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json')).toString()).config[nm].url;
  const releaseInfo = (await (await fetchRetry(EYE_URL)).json());
  return generateImageFile(
    `https://raw.githubusercontent.com/eyereasoner/${nm}/${releaseInfo.tag_name}/${nm}.pl`,
    path.join(__dirname, '..', 'lib', `${nm}.ts`),
  );
}

main();
