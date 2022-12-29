/* eslint-disable import/no-extraneous-dependencies, no-console */
// A script for updating the version reference to eye
import { fetch } from 'cross-fetch';
import * as fs from 'fs';
import path from 'path';

(async () => {
  const res = (await fetch('https://api.github.com/repos/eyereasoner/eye/tags'));
  if (res.status === 200) {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json')).toString());
    const [tag] = await res.json();
    pkg.config.eye = { name: tag.name, sha: tag.commit.sha };
    fs.writeFileSync(
      path.join(__dirname, '..', 'package.json'),
      JSON.stringify(pkg, null, 2) + '\n',
    );
  } else {
    console.error(await res.text());
    process.exit(1);
  }
})();
