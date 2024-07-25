import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory
fs.writeFileSync(path.join(__dirname, 'dynamic.mjs'), await (await fetch('https://eyereasoner.github.io/eye-js/latest/dynamic-import.js')).text());

const { eyereasoner } = await import('./dynamic.mjs');
const { queryOnce, SwiplEye } = eyereasoner

for (let i = 1; i < 6; i++) {
  const Module = await SwiplEye({ print: () => {} });
  Module.FS.writeFile(`test-relations-${10 ** i}.n3`, await (await fetch(`https://eulersharp.sourceforge.net/2009/12dtb/test-relations-${10 ** i}.n3`)).text());
  Module.FS.writeFile(`test-query.n3`, await (await fetch(`https://eulersharp.sourceforge.net/2009/12dtb/test-query.n3`)).text());
  Module.FS.writeFile(`test-facts.n3`, await (await fetch(`https://eulersharp.sourceforge.net/2009/12dtb/test-facts.n3`)).text());
  const time2 = Date.now();
  await queryOnce(Module, 'main', ['--quiet', '--nope', 'test-facts.n3', `test-relations-${10 ** i}.n3`, '--query', 'test-query.n3']);
  console.log(`Time for deep taxonomy benchmark ${10 ** i} with SWIPL:\t${Date.now() - time2}ms`);
}
