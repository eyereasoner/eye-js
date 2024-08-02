import fs from 'fs';
import path from 'path';
import { generateImageFile } from 'swipl-wasm/dist/generateImage';

const nm = process.argv.find((name) => name.startsWith('--name='))?.slice(7).split('.')[0] ?? 'eye';

async function main() {
  const EYE_URL = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json')).toString()).config[nm].url;
  const releaseInfo = (await (await fetch(EYE_URL)).json());
  return generateImageFile(
    `https://raw.githubusercontent.com/eyereasoner/${nm}/${releaseInfo.tag_name}/${nm.split('-')[0]}.pl`,
    path.join(__dirname, '..', 'lib', `${nm}.ts`),
  );
}

main();
