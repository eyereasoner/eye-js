/* eslint-disable import/no-extraneous-dependencies, no-console */
// A script for updating the version reference to eye
import * as fs from 'fs';
import path from 'path';

const nm = process.argv.find((name) => name.startsWith('--name='))?.slice(7).split('.')[0] ?? 'eye';

(async () => {
  const res = (await fetch(`https://api.github.com/repos/eyereasoner/${nm}/releases/latest`));
  if (res.status === 200) {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json')).toString());
    const tag = await res.json();
    pkg.config[nm] = { name: tag.name, url: tag.url };
    fs.writeFileSync(
      path.join(__dirname, '..', 'package.json'),
      `${JSON.stringify(pkg, null, 2)}\n`,
    );
  } else {
    console.error(await res.text());
    process.exit(1);
  }
})();
