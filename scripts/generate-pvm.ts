import fs from 'fs';
import path from 'path';
import type { SWIPLModule } from 'swipl-wasm/dist/common';
import { queryOnce } from '../lib/query';
// @ts-ignore
import SWIPL from './swipl-bundled.temp';

function Uint8ToString(u8a: any) {
  const CHUNK_SZ = 0x8000;
  const c: string[] = [];
  for (let i = 0; i < u8a.length; i += CHUNK_SZ) {
    c.push(String.fromCharCode.apply(null, u8a.subarray(i, i + CHUNK_SZ)));
  }
  return c.join('');
}

async function eyePlString() {
  const EYE_URL = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json')).toString()).config.eye.url;
  const releaseInfo = (await (await fetch(EYE_URL)).json());
  const res = (await fetch(`https://raw.githubusercontent.com/eyereasoner/eye/${releaseInfo.tag_name}/eye.pl`));

  if (res.status !== 200) {
    throw new Error(`Error fetching eye.pl: ${await res.text()}`);
  }

  return res.text();
}

async function main() {
  const eye = await eyePlString();

  const Module: SWIPLModule = await SWIPL({
    arguments: ['-q', '-f', 'eye.pl'],
    preRun: (module: SWIPLModule) => module.FS.writeFile('eye.pl', eye),
  });

  queryOnce(Module, 'main', ['--image', 'eye.pvm']);

  fs.writeFileSync(
    path.join(__dirname, '..', 'lib', 'eye.ts'),
    `export default "${btoa(Uint8ToString(Module.FS.readFile('eye.pvm')))}"`,
  );
}

main();
