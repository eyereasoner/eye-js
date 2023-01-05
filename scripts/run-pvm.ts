import fs from 'fs';
import path from 'path';
import { SWIPLModule } from 'swipl-wasm/dist/common';
// @ts-ignore
import SWIPL from '../lib/swipl-bundled.temp';

(async () => {
  const Module: SWIPLModule = await SWIPL({
    arguments: ['-t', '-x', './eye.pvm', '-t', '--', '"$@"'],
    preRun: (module: SWIPLModule) => {
      module.FS.writeFile('eye.pvm', fs.readFileSync(path.join(__dirname, '..', 'eye', 'eye.pvm')).toString());
    },
  });
  return !!Module;
})();
