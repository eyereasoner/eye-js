import fs from 'fs';
import path from 'path';
import { queryOnce, SWIPL, writeEye } from '..';

(async () => {
  const Module = await SWIPL({ arguments: ['-q', '-f', 'eye.pl'], preRun: writeEye });
  queryOnce(Module, 'main', ['--image', 'eye.pvm']);
  fs.writeFileSync(path.join(__dirname, '..', 'eye', 'eye.pvm'), Module.FS.readFile('eye.pvm'));
})();
