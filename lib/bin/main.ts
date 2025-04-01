import path from 'path';
import fs from 'fs';
import readline from 'readline';
import { SwiplEye } from '..';
import { qaQuery } from '../query';

/**
 * Creates any subdirectories needed for a file path in the virtual filesystem
 * @param Module The SWIPL module with FS access
 * @param filePath The file path that may contain subdirectories
 */
function createAnySubdirs(Module: any, filePath: string): void {
  const dirname = path.dirname(filePath);

  // No need to create directories if the file is in the root
  if (dirname === '.' || dirname === '/') {
    return;
  }

  // Split the directory path and create each level
  const dirs = dirname.split('/');
  let currentPath = '';

  for (const dir of dirs) {
    if (dir !== '') {
      currentPath += (currentPath ? '/' : '') + dir;
      try {
        Module.FS.stat(currentPath);
      } catch {
        // Directory doesn't exist, create it
        Module.FS.mkdir(currentPath);
      }
    }
  }
}

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
      createAnySubdirs(Module, arg);

      // Now write the file to the correct path
      Module.FS.writeFile(arg, fs.readFileSync(p));
    }
  }

  await qaQuery(Module, 'main', proc.argv.slice(2), (q) => rl.question(`${q}\n|: `));
  rl.close();
}
