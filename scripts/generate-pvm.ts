import fs from 'fs';
import path from 'path';
import { queryOnce, SWIPL } from '..';
import EYE from '../eye/eye.pl';

(async () => {
  const Module = await SWIPL({ arguments: ['-q', '-f', 'eye.pl'], preRun: (module) => { module.FS.writeFile('eye.pl', EYE); } });
  queryOnce(Module, 'main', ['--image', 'eye.pvm']);
  fs.writeFileSync(path.join(__dirname, '..', 'eye', 'eye.pvm'), Module.FS.readFile('eye.pvm'));
})();
