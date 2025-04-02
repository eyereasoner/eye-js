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
      // Create any subdirectories needed for this file path
      const dirname = path.dirname(arg);
      // @ts-ignore: mkdirTree exists in Emscripten FS but is not typed.
      // Note that the implementation of mkdirTree looks for `/` path separators
      // so we need to convert it to a posix path first for use
      // in the emscripten FS module.
      Module.FS.mkdirTree(dirname);

      // Now write the file to the correct path
      Module.FS.writeFile(arg, fs.readFileSync(p));
    }
  }

  await qaQuery(Module, 'main', proc.argv.slice(2), (q) => rl.question(`${q}\n|: `));
  rl.close();
}
