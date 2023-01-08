import fs from 'fs';
import path from 'path';
import { SWIPLModule } from 'swipl-wasm/dist/common';
import { queryOnce } from '../lib/query';
// @ts-ignore
import SWIPL from '../lib/swipl-bundled.temp';

(async () => {
  const Module: SWIPLModule = await SWIPL({
    arguments: ['-q', '-f', 'eye.pl'],
    preRun: (module: SWIPLModule) => {
      module.FS.writeFile('eye.pl', fs.readFileSync(path.join(__dirname, '..', 'eye', 'eye.pl')));
    },
  });
  queryOnce(Module, 'main', ['--image', 'eye.pvm']);

  // Since the .pvm file is *not* utf-8 we encounter issues
  // if we try and just to `.toString()` in particular
  // see <https://github.com/eyereasoner/eye-js/issues/20>
  let s = '';
  for (const code of Module.FS.readFile('eye.pvm')) {
    s += String.fromCharCode(code);
  }

  fs.writeFileSync(path.join(__dirname, '..', 'eye', 'eye.pvm'), s);
})();
