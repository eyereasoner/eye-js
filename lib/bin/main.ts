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
      // For the Emscripten FS, we need to ensure posix separators
      // for any relative sub-path that may have been typed in
      // on w32 as subdir\socrates.n3
      const posixPath = arg.replace(path.sep, path.posix.sep);

      // Create any subdirectories needed for this file path
      const dirname = path.dirname(posixPath);
      // @ts-ignore: mkdirTree exists in Emscripten FS but is not typed.
      Module.FS.mkdirTree(dirname);

      // Now write the file to the correct path
      Module.FS.writeFile(posixPath, fs.readFileSync(p));
    }
  }

  await qaQuery(Module, 'main', proc.argv.slice(2), (q) => rl.question(`${q}\n|: `));
  rl.close();
}
