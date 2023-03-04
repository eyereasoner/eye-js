/* eslint-disable */
// TODO: Remove the above before merging
import fs from 'fs';
import path from 'path';
import { Parser, Store, DataFactory as DF } from 'n3';
import { mapTerms } from 'rdf-terms';
import { n3reasoner } from '../dist';
import 'jest-rdf';

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

describe('Testing examples from eye repository', () => {
  for (const folder of fs.readdirSync(examplesPath)) {
    if (fs.statSync(path.join(examplesPath, folder)).isDirectory()) {
      describe(`Testing examples for ${folder}`, () => {
        for (const testCase of fs.readFileSync(path.join(examplesPath, folder, 'test')).toString().split('\n').slice(1)
          .filter((x) => x !== '')) {
          // eslint-disable-next-line no-loop-func
          let fn = describe;

          if (ignoreFolders.includes(folder)) {
            fn = describe.skip;
          } else if (!testCase.startsWith(expectedStart)) {
            throw new Error(`Found more test case without the expected start of ${expectedStart}`);
          }

          let args = testCase.slice(testCase.startsWith(longStart) ? longStart.length : expectedStart.length);

          if (testCase.startsWith(longStart)) {
            args = args.replace(/http\:\/\/eyereasoner\.github\.io\/eye\/reasoning\//g, '');
            args = args.replace(/ --turtle/g, '');
          }

          let argsArray = args.trim().split(' ');

          if (argsArray[argsArray.length - 2] !== '--output') {
            throw new Error(`Expected --output to be the last argument on ${args}`);
          }

          const subPath = path.join(folder, argsArray[argsArray.length - 1]);

          argsArray = argsArray.slice(0, -2);

          // Skip if the output is not a valid N3 file
          if (ignoreOutputs.includes(subPath) || !subPath.endsWith('n3')) {
            // eslint-disable-next-line no-loop-func
            fn = describe.skip;
          }

          fn(`should run for [${argsArray.join(' ')}]`, () => {
            // it('using string i/o', () => {

            // });

            // (argsArray[0] === '--blogic' && !argsArray.includes('blogic/socrates-star.n3') ? it : it.skip)('using string i/o', () => {
            //   return expect(n3reasoner(argsArray.slice(1).map(file => readFile(file)).join('\n'), undefined, { blogic: true, outputType: 'quads' }))
            //     .resolves
            //     .toBeRdfIsomorphic(dereference(subPath));
            // });

            const args = argsArray.filter((arg) => arg.startsWith('--'));

            function loadFiles(files: string[]) {
              return [...new Store(files.map((file) => dereference(file)).flat())]
                // Workaround for https://github.com/rdfjs/N3.js/issues/332
                .map((quad) => mapTerms(quad, (term) => (term.termType === 'BlankNode' ? DF.blankNode(term.value.replace(/^\./, '')) : term)));
            }

            if (args.length === 1 && args[0] === '--blogic'
            // Skip socrates-star because it contains '{|' and the PR to support that has not been merged in N3.js
            && !argsArray.includes('blogic/socrates-star.n3')
            ) {
              it('using quad i/o', () => expect(n3reasoner(loadFiles(argsArray.slice(1)), undefined, { blogic: true }))
                .resolves
                .toBeRdfIsomorphic(dereference(subPath)));
            } else if (args.length === 1 && args[0] === '--query' && false) {
              it.skip('using quad i/o', () => expect(
                n3reasoner(
                  loadFiles(argsArray.filter((_, i) => i !== argsArray.indexOf('--query') && i !== argsArray.indexOf('--query') + 1)),
                  loadFiles([argsArray[argsArray.indexOf('--query') + 1]]),
                ),
              )
                .resolves
                .toBeRdfIsomorphic(dereference(subPath)));
            } else if (args.length === 2 && args.includes('--query') && args.includes('--nope')) {
              it('using quad i/o', () => expect(
                n3reasoner(
                  loadFiles(argsArray.filter((_, i) => i !== argsArray.indexOf('--query')
                      && i !== argsArray.indexOf('--nope')
                      && i !== argsArray.indexOf('--query') + 1)),
                  loadFiles([argsArray[argsArray.indexOf('--query') + 1]]),
                ),
              )
                .resolves
                .toBeRdfIsomorphic(dereference(subPath)));
            } else if (args.length === 2 && args.includes('--pass') && args.includes('--nope')) {
              it('using quad i/o', () => expect(
                n3reasoner(
                  loadFiles(argsArray.filter((_, i) => i !== argsArray.indexOf('--pass') && i !== argsArray.indexOf('--nope'))),
                  undefined,
                  { output: 'deductive_closure' },
                ),
              )
                .resolves
                .toBeRdfIsomorphic(dereference(subPath)));
            } else {
              test.todo('using quad i/o');
            }

            // let ifn = it;

            // // Skip socrates-star because it contains '{|' and the PR to support that has not been merged in N3.js
            // if (argsArray.includes('blogic/socrates-star.n3') || argsArray[0] !== '--blogic') {
            //   ifn = it.skip;
            // }

            //   ifn('using quad i/o', async () => {
            //     expect(true).toBeTruthy();
            //     // const quads = [...new Store(argsArray.slice(1).map(file => dereference(file)).flat())]
            //     //   // Workaround for https://github.com/rdfjs/N3.js/issues/332
            //     //   .map(quad => mapTerms(quad, term => term.termType === 'BlankNode' ? DF.blankNode(term.value.replace(/^\./, '')) : term));

          //     // return expect(n3reasoner(quads, undefined, { blogic: true }))
          //     //   .resolves
          //     //   .toBeRdfIsomorphic(dereference(subPath));
          //   });
          });

          // if (argsArray.includes('--pass-only-new')) {
          //   console.log(argsArray, output.length)
          // }

          // console.log(testCase)
          // process.exit()
        }
      });
    }
  }
});
