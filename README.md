# EYE JS
Distributing the [EYE](https://github.com/josd/eye) reasoner for browser and node using WebAssembly.

[![GitHub license](https://img.shields.io/github/license/eyereasoner/eye-js.svg)](https://github.com/eyereasoner/eye-js/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/eyereasoner.svg)](https://www.npmjs.com/package/eyereasoner)
[![build](https://img.shields.io/github/actions/workflow/status/eyereasoner/eye-js/nodejs.yml?branch=main)](https://github.com/eyereasoner/eye-js/tree/main/)
[![Dependabot](https://badgen.net/badge/Dependabot/enabled/green?icon=dependabot)](https://dependabot.com/)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

## Usage

The simplest way to use this package is to execute a query over a dataset and get the results

```ts
import { basicQuery } from 'eyereasoner';

async function main() {
  const {
    // The result of the query (as an array of quads)
    result,
    // The proof of the results (as an array of quads)
    proof
  } = await basicQuery(dataQuads, queryQuads);
}

main();
```

Here the inputs and outputs are both arrays of RDF/JS Quads; for instance

```ts
const queryQuads = [
  DF.quad(
    DF.namedNode('http://example.org/socrates#Socrates'),
    DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
    DF.variable('WHAT'),
    DF.blankNode('b1')
  ),
  DF.quad(
    DF.namedNode('http://example.org/socrates#Socrates'),
    DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
    DF.variable('WHAT'),
    DF.blankNode('b2')
  ),
  DF.quad(
    DF.blankNode('b1'),
    DF.namedNode('http://www.w3.org/2000/10/swap/log#implies'),
    DF.blankNode('b2')
  )
]

const dataQuads = [
  DF.quad(
    DF.namedNode('http://example.org/socrates#Socrates'),
    DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
    DF.namedNode('http://example.org/socrates#Human'),
  ),
  DF.quad(
    DF.namedNode('http://example.org/socrates#Human'),
    DF.namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
    DF.namedNode('http://example.org/socrates#Mortal'),
  ),
  DF.quad(
    DF.variable('A'),
    DF.namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
    DF.variable('B'),
    DF.blankNode('b1')
  ),
  DF.quad(
    DF.variable('S'),
    DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
    DF.variable('A'),
    DF.blankNode('b1')
  ),
  DF.quad(
    DF.variable('S'),
    DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
    DF.variable('B'),
    DF.blankNode('b2')
  ),
  DF.quad(
    DF.blankNode('b1'),
    DF.namedNode('http://www.w3.org/2000/10/swap/log#implies'),
    DF.blankNode('b2')
  ),
]
```

## Advanced usage

To have more granular control one can also use this module as follows

```ts
import { SWIPL, loadEye, queryOnce } from 'eyereasoner';

const query = `
@prefix : <http://example.org/socrates#>.

{:Socrates a ?WHAT} => {:Socrates a ?WHAT}.
`

const data = `
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix : <http://example.org/socrates#>.

:Socrates a :Human.
:Human rdfs:subClassOf :Mortal.

{?A rdfs:subClassOf ?B. ?S a ?A} => {?S a ?B}.
`

async function main() {
  // Instantiate a new SWIPL module and log any results it produces to the console
  const Module = await SWIPL({ print: (str: string) => { console.log(str) }, arguments: ['-q'] });

  // Load EYE into the SWIPL Module and run consule("eye.pl").
  loadEye(Module)

  // Load the the strings data and query as files data.n3 and query.n3 into the module
  Module.FS.writeFile('data.n3', data);
  Module.FS.writeFile('query.n3', query);

  // Execute main(['--nope', '--quiet', './data.n3', '--query', './query.n3']).
  queryOnce(Module, 'main', ['--nope', '--quiet', './data.n3', '--query', './query.n3']);
}

main();

```

## License
©2022–present
[Jesse Wright](https://github.com/jeswr),
[Jos De Roo](https://github.com/josd/),
[MIT License](https://github.com/eyereasoner/eye-js/blob/master/LICENSE).
