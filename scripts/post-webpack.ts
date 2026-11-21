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

  // Publish a .nojekyll marker at the root of the pages site so GitHub skips
  // the Jekyll build (which copies the whole multi-GB site on the runner and
  // has been failing with "No space left on device").
  // See https://github.com/eyereasoner/eye-js/issues/1845
  fs.writeFileSync(path.join(__dirname, '..', version[0], '.nojekyll'), '');
}
