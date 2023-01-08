import { SWIPL, loadEye, queryOnce } from '../dist';
import { query, data } from '../data/socrates';

// The results recorded using DELL XPS 15 9520 (32GB RAM) on commit 563f3cfc663b8d746d653e90337002eec74d246e are
// Initialise SWIPL        : 103.505ms
// Load and consult EYE    : 464.449ms
// Load data.n3            : 0.07ms
// Load query.n3           : 0.021ms
// Execute query           : 7.207ms
async function main() {
  console.log('Testing performance of socrates query using eye.pl')

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

  console.time('Execute query\t\t');
  queryOnce(Module, 'main', ['--nope', '--quiet', './data.n3', '--query', './query.n3']);
  console.timeEnd('Execute query\t\t');

  console.log()
}

main();
