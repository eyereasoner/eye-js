# EYE JS
Distributing the [EYE](https://github.com/josd/eye) reasoner for browser and node using WebAssembly.

[![GitHub license](https://img.shields.io/github/license/eyereasoner/eye-js.svg)](https://github.com/eyereasoner/eye-js/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/@eyereasoner/eye-js.svg)](https://www.npmjs.com/package/@eyereasoner/eye-js)
[![build](https://img.shields.io/github/workflow/status/eyereasoner/eye-js/Node.js%20CI)](https://github.com/eyereasoner/eye-js/tree/main/)
[![Dependabot](https://badgen.net/badge/Dependabot/enabled/green?icon=dependabot)](https://dependabot.com/)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

## Usage

The simplest way to use this package is to execute a query over a dataset and get the results

```ts
import { basicQuery } from 'eyereasoner';

async function main() {
  const resultQuads = await basicQuery(dataQuads, queryQuads);
}

main();
```

## Advanced usage

To have more granular control once can also use this module as follows

```ts
import { SWIPL, loadEye } from 'eyereasoner';

async function main() {
  // Instantiate a new SWIPL module and log any results it produces to the console
  const Module = await SWIPL({ print: (str: string) => { console.log(str) }, arguments: ['-q'] });

  // Load EYE into the SWIPL Module and run consule("eye.pl").
  loadEye(MODULE)

  // Load the the strings data and query as files data.n3 and query.n3 into the module
  Module.FS.writeFile('data.n3', data);
  Module.FS.writeFile('query.n3', query);

  // Execute main(['--quiet', './data.n3', '--query', './query.n3']).
  queryOnce(Module, 'main', ['--quiet', './data.n3', '--query', './query.n3']);
}
```

## License
©2022–present
[Jesse Wright](https://github.com/jeswr),
[Jos De Roo](https://github.com/josd/),
[MIT License](https://github.com/eyereasoner/eye-js/blob/master/LICENSE).
