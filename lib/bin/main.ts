import path from 'path';
import fs from 'fs';
import readline from 'readline';
import { SwiplEye } from '..';
import { qaQuery } from '../query';

export async function mainFunc(proc: NodeJS.Process) {
  const rl = readline.promises.createInterface({
    input: proc.stdin,
    output: proc.stdout,
  });

  const Module = await SwiplEye();

  // Make any local files available to the reasoner
  for (const arg of proc.argv.slice(2)) {
    const p = path.join(proc.cwd(), arg);
    if (fs.existsSync(p)) {
      Module.FS.writeFile(arg, fs.readFileSync(p));
    }
  }

  await qaQuery(Module, 'main', proc.argv.slice(2), (q) => rl.question(`${q}\n|: `));
  rl.close();
}
