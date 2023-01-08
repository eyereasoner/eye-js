import fs from 'fs';
import path from 'path';
import type { SWIPLModule } from 'swipl-wasm/dist/common';
import { queryOnce } from '../lib/query';
// @ts-ignore
import SWIPL from '../lib/swipl-bundled.temp';

function Uint8ToString(u8a: any) {
  const CHUNK_SZ = 0x8000;
  const c: string[] = [];
  for (let i = 0; i < u8a.length; i += CHUNK_SZ) {
    c.push(String.fromCharCode.apply(null, u8a.subarray(i, i + CHUNK_SZ)));
  }
  return c.join('');
}

(async () => {
  const Module: SWIPLModule = await SWIPL({
    arguments: ['-q', '-f', 'eye.pl'],
    preRun: (module: SWIPLModule) => {
      module.FS.writeFile('eye.pl', fs.readFileSync(path.join(__dirname, '..', 'eye', 'eye.pl')));
    },
  });
  queryOnce(Module, 'main', ['--image', 'eye.pvm']);

  const eyeBuffer = Module.FS.readFile('eye.pvm');

  fs.writeFileSync(path.join(__dirname, '..', 'eye', 'eye.pvm'), btoa(Uint8ToString(eyeBuffer)));
})();
