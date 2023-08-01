/* eslint-disable import/no-extraneous-dependencies */
import path from 'path';
import fs from 'fs-extra';

let version = process.argv.find((name) => name.startsWith('--name='))?.slice(8).split('.');

if (version) {
  version = ['bundle', ...version];

  fs.writeFileSync(
    path.join(__dirname, '..', ...version, 'dynamic-import.js'),
    fs.readFileSync(
      path.join(__dirname, '..', ...version, 'index.js'),
    ).toString().replace('var eyereasoner;', 'export var eyereasoner;'),
  );

  for (let i = 1; i < version.length; i += 1) {
    const destDir = path.join(__dirname, '..', ...version.slice(0, i), 'latest');

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copySync(path.join(__dirname, '..', ...version), destDir);
  }
}
