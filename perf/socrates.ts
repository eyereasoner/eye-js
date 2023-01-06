import { SWIPL, loadEye, queryOnce } from '..';
import { query, data } from '../data/socrates';

// The results recorded using DELL XPS 15 9520 (32GB RAM) on commit 2869782798e5b89d0a1f2321321a63dc21e6da1f are
// Initialise SWIPL        : 103.502ms
// Load and consult EYE    : 459.548ms
// Load data.n3            : 0.065ms
// Load query.n3           : 0.022ms
// Execute query           : 6.672ms
async function main() {
  // Instantiate a new SWIPL module and log any results it produces to the console
  console.time('Initialise SWIPL\t');
  const Module = await SWIPL({ print: () => {}, arguments: ['-q'] });
  console.timeEnd('Initialise SWIPL\t');

  // Load EYE into the SWIPL Module and run consule("eye.pl").
  console.time('Load and consult EYE\t');
  loadEye(Module)
  console.timeEnd('Load and consult EYE\t');

  // Load the the strings data and query as files data.n3 and query.n3 into the module
  console.time('Load data.n3\t\t');
  Module.FS.writeFile('data.n3', data);
  console.timeEnd('Load data.n3\t\t');

  console.time('Load query.n3\t\t');
  Module.FS.writeFile('query.n3', query);
  console.timeEnd('Load query.n3\t\t');

  // Execute main(['--nope', '--quiet', './data.n3', '--query', './query.n3']).
  console.time('Execute query\t\t');
  queryOnce(Module, 'main', ['--nope', '--quiet', './data.n3', '--query', './query.n3']);
  console.timeEnd('Execute query\t\t');
}

main();
