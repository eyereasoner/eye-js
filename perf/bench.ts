import Benchmark, { type Event } from 'benchmark';
import { data, query } from '../data/socrates';
import { queryOnce, SwiplEye, n3reasoner } from '../dist';
import { generateDeepTaxonomy } from 'deep-taxonomy-benchmark/dist';
import { Parser } from 'n3';

const suite = new Benchmark.Suite;

const deepTaxonomyBenchmark10 = [
  ...generateDeepTaxonomy(10, true),
  ...(new Parser({ format: 'n3' })).parse('{ ?s a ?o . ?o <http://www.w3.org/2000/01/rdf-schema#subClassOf> ?o2 . } => { ?s a ?o2 . } .'),
]

const deepTaxonomyBenchmark50 = [
  ...generateDeepTaxonomy(50, true),
  ...(new Parser({ format: 'n3' })).parse('{ ?s a ?o . ?o <http://www.w3.org/2000/01/rdf-schema#subClassOf> ?o2 . } => { ?s a ?o2 . } .'),
]

const deepTaxonomyBenchmark100 = [
  ...generateDeepTaxonomy(100, true),
  ...(new Parser({ format: 'n3' })).parse('{ ?s a ?o . ?o <http://www.w3.org/2000/01/rdf-schema#subClassOf> ?o2 . } => { ?s a ?o2 . } .'),
]

const deepTaxonomyBenchmark1000 = [
  ...generateDeepTaxonomy(1000, true),
  ...(new Parser({ format: 'n3' })).parse('{ ?s a ?o . ?o <http://www.w3.org/2000/01/rdf-schema#subClassOf> ?o2 . } => { ?s a ?o2 . } .'),
]

const deepTaxonomyBenchmark10000 = [
  ...generateDeepTaxonomy(10000, true),
  ...(new Parser({ format: 'n3' })).parse('{ ?s a ?o . ?o <http://www.w3.org/2000/01/rdf-schema#subClassOf> ?o2 . } => { ?s a ?o2 . } .'),
]

function deferred(fn: () => Promise<any>): Benchmark.Options {
  return {
    defer: true,
    fn: (deferred: { resolve: () => void }) => fn().then(() => deferred.resolve())
  }
}

// For performance testing prior to migrating to benchmark.js see
// https://github.com/eyereasoner/eye-js/blob/87147784aa1c91f1d42092d703ff554c1a7c5a34/perf/socrates.ts#L6-L12
async function main() {
  const Module = await SwiplEye({ print: () => { } });

  const LoadedModule = await SwiplEye({ print: () => { } });
  LoadedModule.FS.writeFile('data.n3', data);
  LoadedModule.FS.writeFile('query.n3', query);

  // add tests
  suite
    .add(
      'Initialise SWIPL with EYE image',
      deferred(() => SwiplEye({ print: () => { } })),
    ).add(
      'Run socrates query',
      deferred(() => n3reasoner(data, query)),
    ).add(
      'Load data into a module',
      () => Module.FS.writeFile('data.n3', data),
    ).add(
      'Load query into a module',
      () => Module.FS.writeFile('query.n3', query),
    ).add(
      'Executing the socrates query',
      () => queryOnce(LoadedModule, 'main', ['--nope', '--quiet', './data.n3', '--query', './query.n3']),
    ).add(
      'Run deep taxonomy benchmark [10]',
      deferred(() => n3reasoner(deepTaxonomyBenchmark10)),
    ).add(
      'Run deep taxonomy benchmark [50]',
      deferred(() => n3reasoner(deepTaxonomyBenchmark50)),
    ).add(
      'Run deep taxonomy benchmark [100]',
      deferred(() => n3reasoner(deepTaxonomyBenchmark100)),
    ).add(
      'Run deep taxonomy benchmark [1000]',
      deferred(() => n3reasoner(deepTaxonomyBenchmark1000)),
    ).add(
      'Run deep taxonomy benchmark [10000]',
      deferred(() => n3reasoner(deepTaxonomyBenchmark10000)),
    ).on('cycle', (event: Event) => {
      console.log(event.target.toString());
    }).run();
}

main();
