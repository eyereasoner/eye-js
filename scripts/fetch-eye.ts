/* eslint-disable import/no-extraneous-dependencies, no-console */
// A script for fetching the eye.pl file from the core eye reasoner package
import { fetch } from 'cross-fetch';
import * as fs from 'fs';
import path from 'path';

const EYE_COMMIT = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json')).toString()).config.eye.sha;

(async () => {
  const res = (await fetch(`https://raw.githubusercontent.com/eyereasoner/eye/${EYE_COMMIT}/eye.pl`));
  if (res.status === 200) {
    fs.writeFileSync(path.join(__dirname, '..', 'eye', 'eye.pl'), await res.text());
  } else {
    console.error(await res.text());
    process.exit(1);
  }
})();
