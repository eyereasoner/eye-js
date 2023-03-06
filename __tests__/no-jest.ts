/* eslint-disable */
// TODO: Remove the above before merging
import fs from 'fs';
import path from 'path';
import { Parser, Store, DataFactory as DF } from 'n3';
import { mapTerms } from 'rdf-terms';
import { n3reasoner } from '../dist';
import type * as RDF from "@rdfjs/types";
import { isomorphic } from 'rdf-isomorphic';
import { write } from '../dist/n3Writer.temp';
import { write as writePretty } from '@jeswr/pretty-turtle';
// import 'jest-rdf';

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

let i = 0, j = 0;

function readFile(subPath: string) {
  return fs.readFileSync(path.join(examplesPath, subPath)).toString();
}

function dereference(subPath: string) {
  const parser = new Parser({ format: 'text/n3', baseIRI: `http://eyereasoner.github.io/eye/reasoning${subPath}` });
  // @ts-expect-error
  parser._supportsRDFStar = true;
  return parser.parse(readFile(subPath));
}

async function main() {
  for (const folder of fs.readdirSync(examplesPath)) {
    if (fs.statSync(path.join(examplesPath, folder)).isDirectory()) {
        for (const testCase of fs.readFileSync(path.join(examplesPath, folder, 'test')).toString().split('\n').slice(1)
          .filter((x) => x !== '')) {

            // console.log('a')
          // eslint-disable-next-line no-loop-func

          if (ignoreFolders.includes(folder)) {
            continue
          } else if (!testCase.startsWith(expectedStart)) {
            throw new Error(`Found more test case without the expected start of ${expectedStart}`);
          }

          let args_ = testCase.slice(testCase.startsWith(longStart) ? longStart.length : expectedStart.length);

          if (testCase.startsWith(longStart)) {
            args_ = args_.replace(/http\:\/\/eyereasoner\.github\.io\/eye\/reasoning\//g, '');
            args_ = args_.replace(/ --turtle/g, '');
          }

          let argsArray = args_.trim().split(' ');

          if (argsArray[argsArray.length - 2] !== '--output') {
            throw new Error(`Expected --output to be the last argument on ${args_}`);
          }

          const subPath = path.join(folder, argsArray[argsArray.length - 1]);

          argsArray = argsArray.slice(0, -2);

          // Skip if the output is not a valid N3 file
          if (ignoreOutputs.includes(subPath) || !subPath.endsWith('n3')) {
            // eslint-disable-next-line no-loop-func
            continue
          }

            // it('using string i/o', () => {

            // });

            // (argsArray[0] === '--blogic' && !argsArray.includes('blogic/socrates-star.n3') ? it : it.skip)('using string i/o', () => {
            //   return expect(n3reasoner(argsArray.slice(1).map(file => readFile(file)).join('\n'), undefined, { blogic: true, outputType: 'quads' }))
            //     .resolves
            //     .toBeRdfIsomorphic(dereference(subPath));
            // });

            const args = argsArray.filter((arg) => arg.startsWith('--'));

            function descopeQuad(quad: RDF.Quad, descope = false): RDF.Quad {
              return mapTerms(quad, (term) => {
                if (term.termType === 'BlankNode') {
                  return DF.blankNode(term.value.replace(descope ? /^(n3-\d+)?\./ : /^\./, ''));
                }
                if (term.termType === 'Quad') {
                  return descopeQuad(term as RDF.Quad, descope);
                }
                return term;
              });
            }
            
            // Workaround for https://github.com/rdfjs/N3.js/issues/332
            function normalize(quad: RDF.Quad[], descope = false): RDF.Quad[] {
              return quad
                .map((quad) => descopeQuad(quad, descope));
            }

            function loadFiles(files: string[], descope = false) {
              return normalize([...new Store(files.map((file) => dereference(file)).flat())], descope)
                // Workaround for https://github.com/rdfjs/N3.js/issues/332
                // .map((quad) => mapTerms(quad, (term) => (term.termType === 'BlankNode' ? DF.blankNode(term.value.replace(descope ? /^(n3-\d+)?\./ : /^\./, '')) : term)));
            }

            // console.log('b', args.)

            

            if (args.length === 1 && args[0] === '--blogic'
            // Skip socrates-star because it contains '{|' and the PR to support that has not been merged in N3.js
            && !argsArray.includes('blogic/socrates-star.n3')
            && !argsArray.includes('blogic/bmt.n3')
            && !argsArray.includes('lubm/facts.ttl')
            // && subPath === 'blogic/equal-answer.n3'
            ) {
              i += 1;
              let input: RDF.Quad[] | undefined
              try {
                input = loadFiles(argsArray.slice(1), true);
                const output = await n3reasoner(loadFiles(argsArray.slice(1), true), undefined, { blogic: true }).then(quads => normalize(quads, true));
                const expected = normalize(dereference(subPath), true);
                const res = isomorphic(
                  output,
                  expected
                )

                if (res) {
                  j += 1;
                } else {
                  console.log(`Expected ${output.length} quads recieved ${expected.length} for ${subPath}`)
                  // console.log('expected', await writePretty(expected!, { format: 'text/n3' }))
                  // console.log('recieved', await writePretty(output!, { format: 'text/n3' }))
                }
              } catch (e) {
                console.log('error on input', write(input!))
                console.error(e)
              }
              
            }
        }
    }
  }

  console.log(`${j}/${i}`)
}

main();
