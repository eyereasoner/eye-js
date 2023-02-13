import path from 'path';
import fs from 'fs';
import { SwiplEye, queryOnce } from '..';

export async function main(proc: NodeJS.Process) {
  const Module = await SwiplEye();

  // Make any local files available to the reasoner
  for (const arg of proc.argv.slice(2)) {
    const p = path.join(proc.cwd(), arg);
    if (fs.existsSync(p)) {
      Module.FS.writeFile(arg, fs.readFileSync(p));
    }
  }

  queryOnce(Module, 'main', proc.argv.slice(2));
}
