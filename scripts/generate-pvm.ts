/* eslint-disable no-await-in-loop, no-console */
import fs from 'fs';
import path from 'path';
// This rule should not be triggered anyway since the scripts are not part of the build...
// eslint-disable-next-line import/no-extraneous-dependencies
import type { SWIPLModule } from 'swipl-wasm/dist/common';
import SWIPL from 'swipl-wasm/dist/swipl/swipl-bundle';
import { queryOnce } from '../lib/query';

function Uint8ToString(u8a: any) {
  const CHUNK_SZ = 0x8000;
  const c: string[] = [];
  for (let i = 0; i < u8a.length; i += CHUNK_SZ) {
    c.push(String.fromCharCode.apply(null, u8a.subarray(i, i + CHUNK_SZ)));
  }
  return c.join('');
}

async function main() {
  const eye = fs.readFileSync(path.join(__dirname, '..', 'eye', 'eye.pl')).toString();

  const Module: SWIPLModule = await SWIPL({
    arguments: ['-q', '-f', 'eye.pl'],
    // @ts-ignore
    preRun: (module: SWIPLModule) => module.FS.writeFile('eye.pl', eye),
  });

  queryOnce(Module, 'main', ['--image', 'eye.pvm']);

  fs.writeFileSync(
    path.join(__dirname, '..', 'lib', 'eye.ts'),
    `export default "${btoa(Uint8ToString(Module.FS.readFile('eye.pvm')))}"`,
  );
}

main();
