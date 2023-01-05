import fs from 'fs';
import path from 'path';
import { SWIPLModule } from 'swipl-wasm/dist/common';
import { queryOnce } from '../lib/query';
// @ts-ignore
import SWIPL from '../lib/swipl-bundled.temp';

(async () => {
  const Module = await SWIPL({
    arguments: ['-q', '-f', 'eye.pl'],
    preRun: (module: SWIPLModule) => {
      module.FS.writeFile('eye.pl', fs.readFileSync(path.join(__dirname, '..', 'eye', 'eye.pl')).toString());
    },
  });
  queryOnce(Module, 'main', ['--image', 'eye.pvm']);
  fs.writeFileSync(path.join(__dirname, '..', 'eye', 'eye.pvm'), Module.FS.readFile('eye.pvm'));
})();
