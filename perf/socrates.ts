import { data, query } from '../data/socrates';
import { queryOnce, SwiplEye, n3reasoner } from '../dist';
import { generateDeepTaxonomy } from 'deep-taxonomy-benchmark';
import { Parser } from 'n3';

// The results recorded using DELL XPS 15 9520 (32GB RAM)
// Initialise SWIPL        : 110.441ms (averages about 50-60ms on subsequent loads in the same session)
// Load data.n3            : 0.081ms
// Load query.n3           : 0.03ms
// Execute query           : 10.882ms
// Run socrates query 100 times with n3reasoner    : 4.596s
// Run deep taxonomy benchmark                     : 5.486s
async function main() {
  console.log('Testing performance of socrates query using eye.pvm')

  // Instantiate a new SWIPL module and log any results it produces to the console
  console.time(`Initialise SWIPL with EYE image\t`);
  const Module = await SwiplEye({ print: () => {} });
  console.timeEnd(`Initialise SWIPL with EYE image\t`);

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

  console.time('Run socrates query 100 times with n3reasoner\t');
  for (let i = 0; i < 100; i++) {
    await n3reasoner(data, query)
  }
  console.timeEnd('Run socrates query 100 times with n3reasoner\t');

  const dtb = [
    ...generateDeepTaxonomy(45, true),
    ...(new Parser({ format: 'n3' })).parse('{ ?s a ?o . ?o <http://www.w3.org/2000/01/rdf-schema#subClassOf> ?o2 . } => { ?s a ?o2 . } .'),
  ]

  console.time('Run deep taxonomy benchmark\t\t\t');
  for (let i = 0; i < 5; i++) {
    await n3reasoner(dtb)
  }
  console.timeEnd('Run deep taxonomy benchmark\t\t\t');

  console.log()
}

main();
