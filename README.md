# EYE JS
Distributing the [EYE](https://github.com/eyereasoner/eye) reasoner for browser and node using WebAssembly.

[![GitHub license](https://img.shields.io/github/license/eyereasoner/eye-js.svg)](https://github.com/eyereasoner/eye-js/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/eyereasoner.svg)](https://www.npmjs.com/package/eyereasoner)
[![build](https://img.shields.io/github/actions/workflow/status/eyereasoner/eye-js/nodejs.yml?branch=main)](https://github.com/eyereasoner/eye-js/tree/main/)
[![Dependabot](https://badgen.net/badge/Dependabot/enabled/green?icon=dependabot)](https://dependabot.com/)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![bundlephobia](https://img.shields.io/bundlephobia/min/eyereasoner.svg)](https://www.npmjs.com/package/eyereasoner)
[![DOI](https://zenodo.org/badge/581706557.svg)](https://zenodo.org/doi/10.5281/zenodo.12211023)

## Usage

The simplest way to use this package is to use the `n3reasoner` to execute a query over a dataset and get the results. The input `data` should include the data and any inference rules that you wish to apply to the dataset; the optional `query` should match the pattern of data you wish the engine to return; if left undefined, all new inferred facts will be returned. For example:

```ts
import { n3reasoner } from 'eyereasoner';

export const queryString = `
@prefix : <http://example.org/socrates#>.

{:Socrates a ?WHAT} => {:Socrates a ?WHAT}.
`;

export const dataString = `
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix : <http://example.org/socrates#>.

:Socrates a :Human.
:Human rdfs:subClassOf :Mortal.

{?A rdfs:subClassOf ?B. ?S a ?A} => {?S a ?B}.
`;

// The result of the query (as a string)
const resultString = await n3reasoner(dataString, queryString);

// All inferred data
const resultString = await n3reasoner(dataString);
```

*Note:* One can also supply an array of `dataString`s rather than a single `dataString` if one has multiple input data files.

The `n3reasoner` accepts both `string`s (formatted in Notation3 syntax) and `quad`s as input. The output will be of the same type as the input `data`. This means that we can use `n3reasoner` with RDF/JS quads as follows:

```ts
import { Parser } from 'n3';

const parser = new Parser({ format: 'text/n3' });
export const queryQuads = parser.parse(queryString);
export const dataQuads = parser.parse(dataString);

// The result of the query (as an array of quads)
const resultQuads = await n3reasoner(dataQuads, queryQuads);
```

### Options

The `n3reasoner` function allows one to optionally pass along a set of options

```ts
import { n3reasoner } from 'eyereasoner';

const data = `
@prefix : <urn:example.org:> .
:Alice a :Person .
{ ?S a :Person } => { ?S a :Human } .
`;

const result = await n3reasoner(data, undefined, {
  output: 'derivations',
  outputType: 'string'
});
```

The `options` parameter can be used to configure the reasoning process. The following options are available:
- `output`: What to output with implicit queries.
    - `derivations`: output only new derived triples, a.k.a `--pass-only-new` (default)
    - `deductive_closure`: output deductive closure, a.k.a `--pass`
    - `deductive_closure_plus_rules`: output deductive closure plus rules, a.k.a `--pass-all`
    - `grounded_deductive_closure_plus_rules`: ground the rules and output deductive closure plus rules, a.k.a `--pass-all-ground`
    - `none`: provides no `-pass-*` arguments to eye, often used when doing RDF Surface reasoning
- `outputType`: The type of output (if different from the input)
    - `string`: output as string
    - `quads`: output as array of RDF/JS Quads

## Advanced usage

To have more granular control one can also use this module as follows

```ts
import { SwiplEye, queryOnce } from 'eyereasoner';

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
  const Module = await SwiplEye({ print: (str: string) => { console.log(str) }, arguments: ['-q'] });

  // Load the the strings data and query as files data.n3 and query.n3 into the module
  Module.FS.writeFile('data.n3', data);
  Module.FS.writeFile('query.n3', query);

  // Execute main(['--nope', '--quiet', './data.n3', '--query', './query.n3']).
  queryOnce(Module, 'main', ['--nope', '--quiet', './data.n3', '--query', './query.n3']);
}

main();
```

## Selecting the `SWIPL` module

The `SWIPL` module exported from this library is a build that inlines WebAssembly and data strings in order to be
isomorphic across browser and node without requiring any bundlers. Some users may wish to have more fine-grained control
over their SWIPL module; for instance in order to load the `.wasm` file separately for performance. In these cases
see the `SWIPL` modules exported by [npm swipl wasm](https://github.com/rla/npm-swipl-wasm/).

An example usage of the node-specific swipl-wasm build is as follows:
```ts
import { loadEyeImage, queryOnce } from 'eyereasoner';
import SWIPL from 'swipl-wasm/dist/swipl-node';

async function main() {
  const SwiplEye = loadEyeImage(SWIPL);

  // Instantiate a new SWIPL module and log any results it produces to the console
  const Module = await SwiplEye({ print: (str: string) => { console.log(str) }, arguments: ['-q'] });

  // Load the the strings data and query as files data.n3 and query.n3 into the module
  Module.FS.writeFile('data.n3', data);
  Module.FS.writeFile('query.n3', query);

  // Execute main(['--nope', '--quiet', './data.n3', '--query', './query.n3']).
  queryOnce(Module, 'main', ['--nope', '--quiet', './data.n3', '--query', './query.n3']);
}

main();
```

## CLI Usage

This package also exposes a CLI interface for using the reasoner. It can be used via `npx`

```bash
# Run the command using the latest version of eyereasoner on npm
npx eyereasoner --nope --quiet ./socrates.n3 --query ./socrates-query.n3
```

or by globally installing `eyereasoner`

```bash
# Gloablly install eyereasoner
npm i -g eyereasoner
# Run a command with eyereasoner
eyereasoner --nope --quiet ./socrates.n3 --query ./socrates-query.n3
```

## Browser Builds

`eyereasoner` can be used directly in the browser — with no build step and no self-hosting — straight from a public ESM CDN such as [esm.sh](https://esm.sh) or [jsDelivr](https://www.jsdelivr.com/). See [this example](https://github.com/eyereasoner/eye-js/tree/main/examples/prebuilt/index.html), which is also [deployed on github pages](https://eyereasoner.github.io/eye-js/example/index.html).

There are two ways to load it:

- **Separate WebAssembly assets (recommended).** The SWI-Prolog engine is fetched as a real `.wasm` binary (plus its `.data` archive) next to a small JS driver: the browser compiles the WebAssembly while it streams from the network, the binaries are cached independently of the `eyereasoner` release, and the main thread never parses a multi-megabyte JavaScript file with the WASM inlined as a string.
- **Zero-config single URL.** The npm package is fully self-contained — the SWI-Prolog WASM and the EYE image are inlined in the JavaScript — so a single `import` works with no further setup, at the cost of shipping the WebAssembly inside JavaScript.

Measured over the wire (brotli-compressed): the single-URL graph transfers ≈1.9 MB of JavaScript; the separate-asset delivery transfers ≈2.7 MB in total (the split `.wasm` itself is ~0.4 MB *smaller* than its JS-inlined form, but the split SWIPL build also downloads the 1.6 MB SWI-Prolog `.data` archive, which the inlined `no-data` build replaces with the EYE image). The separate-asset delivery trades those extra bytes for streaming compilation, less main-thread JS parsing, and cross-release caching.

### Separate WebAssembly assets (recommended)

The package's own `SWIPL` build inlines the WASM, so this recipe does two things: an [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) swaps that inlined dependency for `swipl-wasm`'s split web build (`?external=swipl-wasm` is what makes the dependency mappable), and a small wrapper tells the split build where its `.wasm`/`.data` live on the CDN:

```html
<script type="importmap">
  {
    "imports": {
      "swipl-wasm/dist/swipl/swipl-bundle-no-data": "https://esm.sh/swipl-wasm@7.0.10/dist/swipl/swipl-web.js",
      "swipl-wasm/dist/strToBuffer": "https://esm.sh/swipl-wasm@7.0.10/dist/strToBuffer.js"
    }
  }
</script>
<script type="module">
  import SWIPL from 'https://esm.sh/swipl-wasm@7.0.10/dist/swipl/swipl-web.js';
  import { n3reasoner } from 'https://esm.sh/eyereasoner@21.1.10?external=swipl-wasm';

  // swipl-web.wasm (streaming-compiled) and swipl-web.data are fetched from here
  const assets = 'https://cdn.jsdelivr.net/npm/swipl-wasm@7.0.10/dist/swipl/';
  const SwiplWeb = (options) => SWIPL({
    ...options,
    preRun: [options.preRun].flat().filter(Boolean), // this build needs preRun to be an array
    locateFile: (file) => assets + file,
  });

  const result = await n3reasoner(
    ':Socrates a :Man. {?s a :Man} => {?s a :Mortal}.',
    undefined,
    { SWIPL: SwiplWeb },
  );
  console.log(result); // :Socrates a :Mortal.
</script>
```

> **Keep the versions in lockstep.** The EYE image inside each `eyereasoner` release is built against the *exact* `swipl-wasm` version that release pins (`eyereasoner@21.1.10` pins `swipl-wasm@7.0.10` — see the `dependencies` in [its package.json](https://cdn.jsdelivr.net/npm/eyereasoner@21.1.10/package.json)). When you bump `eyereasoner`, update the `swipl-wasm` version in the import map and asset URLs to match.

### Zero-config single URL

```html
<script type="module">
  import { n3reasoner } from 'https://esm.sh/eyereasoner';
  const result = await n3reasoner(':Socrates a :Man. {?s a :Man} => {?s a :Mortal}.');
  console.log(result); // :Socrates a :Mortal.
</script>
```

You can pin a version or version range with the usual npm semver syntax, which the CDN resolves for you:
 - the latest version: `https://esm.sh/eyereasoner`
 - the latest of a major version: `https://esm.sh/eyereasoner@2`
 - the latest of a minor version: `https://esm.sh/eyereasoner@2.3`
 - an exact patch version: `https://esm.sh/eyereasoner@2.3.14`

[jsDelivr](https://www.jsdelivr.com/) works as a drop-in alternative, e.g. `https://cdn.jsdelivr.net/npm/eyereasoner@2/+esm`.

### Classic `<script>` global

No CDN can turn the published CommonJS build of an already-released version into a *synchronous* classic-script global, so a global has to be populated from inside a module script (and is therefore only available asynchronously). Import the exports you need and assign them:

```html
<script type="module">
  import { n3reasoner } from 'https://esm.sh/eyereasoner';
  window.n3reasoner = n3reasoner; // now callable from non-module scripts
</script>
```

This works with either delivery above.

### Migrating from the GitHub Pages bundles

Earlier releases were served as webpack bundles from `https://eyereasoner.github.io/eye-js/vMajor/vMinor/vPatch/index.js` (for instance `https://eyereasoner.github.io/eye-js/2/3/14/index.js`), along with `latest`, `vMajor/latest` and `vMajor/vMinor/latest` shortcuts. **The URLs of already-published versions keep working**: a one-time backfill replaced the bundles with tiny stubs that transparently load the equivalent version from the CDN (the classic `index.js` global becomes *asynchronously* populated — a Proxy keeps `await eyereasoner.n3reasoner(...)` working). New releases do not publish anything to GitHub Pages, so new code should use the CDN URLs above directly. Every published version also remains available forever from the npm package (`dist/` ships with the package).

### Dynamic imports

The CDN modules can also be dynamically imported at runtime:
```ts
const { n3reasoner } = await import('https://esm.sh/eyereasoner@2');
```

The previous `https://eyereasoner.github.io/eye-js/vMajor/latest/dynamic-import.js` URLs keep working too — they redirect to the CDN and re-export the module as `eyereasoner`:
```ts
const { eyereasoner } = await import('https://eyereasoner.github.io/eye-js/2/latest/dynamic-import.js');

// Instantiate a new SWIPL module and log any results it produces to the console
const Module = await eyereasoner.SwiplEye({ print: (str) => { console.log(str) }, arguments: ['-q'] });

// Load the the strings data and query as files data.n3 and query.n3 into the module
Module.FS.writeFile('data.n3', data);
Module.FS.writeFile('query.n3', query);

// Execute main(['--nope', '--quiet', './data.n3', '--query', './query.n3']).
eyereasoner.queryOnce(Module, 'main', ['--nope', '--quiet', './data.n3', '--query', './query.n3']);
```
## Using with Webpack

When bundling `eyereasoner` with Webpack for the browser, the underlying Emscripten-generated code may import Node.js built-in modules using the `node:` scheme (e.g. `node:fs`, `node:crypto`). Webpack does not handle the `node:` scheme by default and will produce errors like:

```
Module build failed: UnhandledSchemeError: Reading from "node:fs" is not handled by plugins (Unhandled scheme).
```

To fix this, add the following to your `webpack.config.js`:

```js
const { NormalModuleReplacementPlugin } = require('webpack');

module.exports = {
  // ...your existing config
  resolve: {
    fallback: {
      path: false,
      fs: false,
      crypto: false,
      perf_hooks: false,
    },
  },
  plugins: [
    new NormalModuleReplacementPlugin(/^node:/, (resource) => {
      resource.request = resource.request.replace(/^node:/, '');
    }),
  ],
};
```

The `NormalModuleReplacementPlugin` strips the `node:` prefix so that the imports are resolved by the `resolve.fallback` entries, which map them to `false` (i.e. empty modules) since they are not needed in the browser.

## Examples

We provide some examples of using `eyereasoner`:
 - Using as an npm package and bundling using webpack ([`./examples/rollup`](https://github.com/eyereasoner/eye-js/tree/main/examples/rollup)).
 - Using a prebuilt version of `eyereasoner` ([`./examples/prebuilt`](https://github.com/eyereasoner/eye-js/tree/main/examples/prebuilt)) - this example is [deployed on github pages](https://eyereasoner.github.io/eye-js/example/index.html).

## Performance

We use [benchmark.js](https://benchmarkjs.com/) to collect the performance results of some basic operations. Those results are published [here](https://eyereasoner.github.io/eye-js/dev/bench/).

## Experimental `linguareasoner`

We have experimental support for RDF Lingua using the `linguareasoner`; similarly to `n3reasoner` it can be used with both string and quad input/output. For instance:

```ts
import { linguareasoner } from 'eyereasoner';

const result = await linguareasoner(`
# ------------------
# Socrates Inference
# ------------------
#
# Infer that Socrates is mortal.

@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix log: <http://www.w3.org/2000/10/swap/log#>.
@prefix var: <http://www.w3.org/2000/10/swap/var#>.
@prefix : <http://example.org/socrates#>.

# facts
:Socrates a :Human.
:Human rdfs:subClassOf :Mortal.

# rdfs subclass
_:ng1 log:implies _:ng2.

_:ng1 {
    var:A rdfs:subClassOf var:B.
    var:S a var:A.
}

_:ng2 {
    var:S a var:B.
}

# query
_:ng3 log:query _:ng3.

_:ng3 {
    var:S a :Mortal.
}`)
```

## Cite

If you are using or extending eye-js as part of a scientific publication, we would appreciate a citation of our [zenodo artefact](https://zenodo.org/doi/10.5281/zenodo.12211023).

## License
©2022–present
[Jesse Wright](https://github.com/jeswr),
[Jos De Roo](https://github.com/josd/),
[MIT License](https://github.com/eyereasoner/eye-js/blob/master/LICENSE).
