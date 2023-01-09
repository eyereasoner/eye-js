#!/usr/bin/env node
import path from 'path';
import fs from 'fs';
import { SwiplEye, queryOnce } from '..';

async function main() {
  const Module = await SwiplEye();

  // Make any local files available to the reasoner
  for (const arg of process.argv.slice(2)) {
    const p = path.join(process.cwd(), arg);
    if (fs.existsSync(p)) {
      Module.FS.writeFile(arg, fs.readFileSync(p));
    }
  }

  queryOnce(Module, 'main', process.argv.slice(2));
}

main();
