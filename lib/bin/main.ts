import path, { PlatformPath } from 'path';
import fs from 'fs';
import readline from 'readline';
import { SwiplEye } from '..';
import { qaQuery } from '../query';

export function convertToPosixPath(filePath: string, pathLib: PlatformPath = path): string {
  // For the Emscripten FS, we need to ensure posix separators
  // for any relative sub-path that may have been typed in
  // on w32 as subdir\socrates.n3

  // First normalize the path to handle any path oddities
  const normalizedPath = pathLib.normalize(filePath);

  // Then split by platform-specific separator and join with POSIX separator
  return normalizedPath.split(pathLib.sep).join(pathLib.posix.sep);
}

export async function mainFunc(proc: NodeJS.Process) {
  const rl = readline.promises.createInterface({
    input: proc.stdin,
    output: proc.stdout,
  });

  const Module = await SwiplEye();

  const posixArgv: string[] = [];
  // Make any local files available to the reasoner
  for (const arg of proc.argv.slice(2)) {
    const p = path.join(proc.cwd(), arg);
    if (fs.existsSync(p)) {
      const posixPath = convertToPosixPath(arg);
      posixArgv.push(posixPath);

      // Create any subdirectories needed for this file path
      const dirname = path.dirname(posixPath);
      // @ts-ignore: mkdirTree exists in Emscripten FS but is not typed.
      // https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/72434
      Module.FS.mkdirTree(dirname);

      // Now write the file to the correct path
      Module.FS.writeFile(posixPath, fs.readFileSync(p));
    } else {
      // For non-filepath arguments, keep them as-is
      posixArgv.push(arg);
    }
  }

  await qaQuery(Module, 'main', posixArgv, (q) => rl.question(`${q}\n|: `));
  rl.close();
}
