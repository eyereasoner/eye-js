/* eslint-disable */
// TODO: Remove the above before merging
import fs from 'fs-extra';
import path from 'path';
import { Parser, Store, DataFactory as DF } from 'n3';
import { mapTerms } from 'rdf-terms';
import { execFileSync, exec, execSync } from 'child_process';

import { n3reasoner } from '../dist';
import 'jest-rdf';
import { Quad } from '@rdfjs/types';

const examplesPath = path.join(__dirname, '..', 'eye', 'reasoning');
const expectedStart = 'eye "$@"';
const cacheComponent = ' --wcache http://eyereasoner.github.io/eye/reasoning .. ';
const longStart = expectedStart + cacheComponent;

const ignoreFolders = [
  // n3reasoner does not support extra images
  'dt', 'image',
  // n3reasoner does not support multiquery
  'mq',
];

// These exceptions should eventually be removed
const ignoreOutputs = [
  // This complains because `$` is used as a term
  'bi/biA.n3',
  // This complains because of https://github.com/rdfjs/N3.js/issues/328
  'crypto/crypto-proof.n3',
  // This just states `true .` but it's not a valid N3 file
  'entail/socrates-check.n3',
  // This complains because of https://github.com/rdfjs/N3.js/issues/328
  'preduction/palindrome-proof.n3',
  // This complains because of https://github.com/rdfjs/N3.js/issues/328
  'preduction/palindrome2-proof.n3',
];

function readFile(subPath: string) {
  return fs.readFileSync(path.join(examplesPath, subPath)).toString();
}

function dereference(subPath: string) {
  const parser = new Parser({ format: 'text/n3', baseIRI: `http://eyereasoner.github.io/eye/reasoning${subPath}` });
  // @ts-expect-error
  parser._supportsRDFStar = true;
  return parser.parse(readFile(subPath));
}

function loadFiles(files: string[]) {
  return [...new Store(files.map((file) => dereference(file)).flat())]
    // Workaround for https://github.com/rdfjs/N3.js/issues/332
    .map((quad) => mapTerms(quad, (term) => (term.termType === 'BlankNode' ? DF.blankNode(term.value.replace(/^\./, '')) : term)));
}

const invMapping = {
  derivations: '--pass-only-new',
  deductive_closure: '--pass',
  deductive_closure_plus_rules: '--pass-all',
  grounded_deductive_closure_plus_rules: '--pass-all-ground',
} as const;

describe('Testing examples from eye repository', () => {
  const cases: [string, string[]][] = [];

  for (const folder of fs.readdirSync(examplesPath).filter(folder => fs.statSync(path.join(examplesPath, folder)).isDirectory())) {
    if (ignoreFolders.includes(folder))
      continue;

    try {
      // FIXME: Don't have stderr show in the console
      const tests = execSync(
        fs.readFileSync(path.join(examplesPath, folder, 'test')).toString().replace(/eye /g, 'echo ')
      ).toString().split('\n').slice(0, -1);

      // FIXME: Add a verification to make sure we are only skipping what we want
      if (tests.length > 0) {
        cases.push([folder, tests])
      }
    } catch (e) {
      if (!(e as any).toString().includes('swipl')) {
        throw e;
      }
      // Don't error if the problem is just that the test is trying to test the swipl command
    }
  }

  describe.each(cases)('Testing examples for %s', (folder, args) => {
    it.each(args)('%s', async (args) => {
      let argsArray = args.split(/\ |\=/g)
        // Remove the --turtle flag because it's just a performance optimisation
        .filter((arg) => !['--turtle'].includes(arg))
        //
        .map(arg => arg.replace('http://eyereasoner.github.io/eye/reasoning/', ''));


        if (argsArray[argsArray.length - 2] !== '--output') {
          throw new Error(`Expected --output to be the last argument on [${args}]`);
        }
        
        if (argsArray[0] !== '--wcache' || argsArray[1] !== 'http://eyereasoner.github.io/eye/reasoning' || argsArray[2] !== '..') {
          throw new Error(`Expected --wcache to be the first argument on [${args}]`);
        }
        
        const subPath = path.join(folder, argsArray[argsArray.length - 1]);
        argsArray = argsArray.slice(3, -2);

        let query: Quad[] | undefined = undefined;

        if (argsArray.includes('--query')) {
          const qind = argsArray.indexOf('--query');
          query = loadFiles([argsArray[qind + 1]]);
          argsArray = [...argsArray.slice(0, qind), ...argsArray.slice(qind + 2)];
        }

        const output = (Object.keys(invMapping) as (keyof typeof invMapping)[]).find(key => argsArray.includes(invMapping[key]));

        if (output) {
          argsArray = argsArray.filter(arg => arg !== invMapping[output]);
        }

        if (argsArray.includes('--nope') && !ignoreOutputs.includes(subPath)) {
          await expect(
            n3reasoner(
              loadFiles(argsArray.filter(arg => arg !== '--nope')),
              query,
              { output },
            ),
          )
            .resolves
            .toBeRdfIsomorphic(dereference(subPath));
        }
    });
  });
});
