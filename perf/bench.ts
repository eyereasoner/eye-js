import Benchmark, { type Event } from 'benchmark';
import { data, query } from '../data/socrates';
import { queryOnce, SwiplEye, n3reasoner } from '../dist';
import { write } from '../dist/n3Writer.temp';
import { generateDeepTaxonomy, getTimblAndFoaf, getOwl, getRdfs, getTimbl } from 'deep-taxonomy-benchmark';
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

// The extended deep taxonomy benchmark in its canonical shape (from the
// deep taxonomy benchmark at https://eulersharp.sourceforge.net/2009/12dtb/,
// see also #337/#338): an individual at the bottom of an N-level
// rdfs:subClassOf chain with 3-way branching, a single *backward* rule, and
// the target class membership asked via --query. EYE proves this in linear
// time, so even N=1000 reasons well under a second and the CI benchmark
// remains bounded.
//
// NOTE: unlike the forward-rule deep taxonomy cases above, this case must
// not reuse a pre-loaded module across runs: re-running main() re-asserts
// the backward rule, and the duplicated rule clauses make the backward
// search explode (a second run on the same module does not terminate in
// minutes, where the first takes <1s). n3reasoner boots a fresh module per
// call, which keeps every iteration independent.
function generateExtendedDeepTaxonomy(size: number): { data: string, query: string } {
  const prefixes = '@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.\n'
    + '@prefix : <http://eulersharp.sourceforge.net/2009/12dtb/test#>.\n';
  const lines = [prefixes, `:i${size} a :N0.`];
  for (let i = 0; i < size; i += 1) {
    lines.push(`:N${i} rdfs:subClassOf :N${i + 1}, :I${i + 1}, :J${i + 1}.`);
  }
  lines.push('{?X a ?D} <= {?C rdfs:subClassOf ?D. ?X a ?C}.');
  return {
    data: lines.join('\n'),
    query: `${prefixes}{:i${size} a :N${size}} => {:i${size} a :N${size}}.\n`,
  };
}

const extendedDeepTaxonomy1000 = generateExtendedDeepTaxonomy(1000);

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

  const timblFoafRdfs = [...await getTimblAndFoaf(), ...await getRdfs()];
  const timblFoafOwl2rl = [...await getTimblAndFoaf(), ...await getOwl()];
  const timblRdfs = [...await getTimbl(), ...await getRdfs()];
  const timblOwl2rl = [...await getTimbl(), ...await getOwl()];

  const timblFoafRdfsString = write(timblFoafRdfs);
  const timblFoafOwl2rlString = write(timblFoafOwl2rl);
  const timblRdfsString = write(timblRdfs);
  const timblOwl2rlString = write(timblOwl2rl);
 
  const LoadedDeep10 = await SwiplEye({ print: () => { } });
  LoadedDeep10.FS.writeFile('data.n3', write(deepTaxonomyBenchmark10));
  const LoadedDeep50 = await SwiplEye({ print: () => { } });
  LoadedDeep50.FS.writeFile('data.n3', write(deepTaxonomyBenchmark50));
  const LoadedDeep100 = await SwiplEye({ print: () => { } });
  LoadedDeep100.FS.writeFile('data.n3', write(deepTaxonomyBenchmark100));

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
      'Run deep taxonomy benchmark [10] [reasoning only]',
      () => queryOnce(LoadedDeep10, 'main', ['--nope', '--quiet', './data.n3', '--pass-only-new']),
    ).add(
      'Run deep taxonomy benchmark [50] [reasoning only]',
      () => queryOnce(LoadedDeep50, 'main', ['--nope', '--quiet', './data.n3', '--pass-only-new']),
    ).add(
      'Run deep taxonomy benchmark [100] [reasoning only]',
      () => queryOnce(LoadedDeep100, 'main', ['--nope', '--quiet', './data.n3', '--pass-only-new']),
    ).add(
      'Run extended deep taxonomy benchmark [1000]',
      deferred(() => n3reasoner(extendedDeepTaxonomy1000.data, extendedDeepTaxonomy1000.query)),
    ).add(
      'Run timbl + foaf + rdfs rules',
      deferred(() => n3reasoner(timblFoafRdfs,  undefined, { outputType: 'string' })),
    ).add(
      'Run timbl + foaf + owl2rl rules',
      deferred(() => n3reasoner(timblFoafOwl2rl, undefined, { outputType: 'string' })),
    ).add(
      'Run timbl + rdfs rules',
      deferred(() => n3reasoner(timblRdfs,  undefined, { outputType: 'string' })),
    ).add(
      'Run timbl + owl2rl rules',
      deferred(() => n3reasoner(timblOwl2rl, undefined, { outputType: 'string' })),
    ).add(
      'Run timbl + foaf + rdfs rules [string]',
      deferred(() => n3reasoner(timblFoafRdfsString,  undefined, { outputType: 'string' })),
    ).add(
      'Run timbl + foaf + owl2rl rules [string]',
      deferred(() => n3reasoner(timblFoafOwl2rlString, undefined, { outputType: 'string' })),
    ).add(
      'Run timbl + rdfs rules [string]',
      deferred(() => n3reasoner(timblRdfsString,  undefined, { outputType: 'string' })),
    ).add(
      'Run timbl + owl2rl rules [string]',
      deferred(() => n3reasoner(timblOwl2rlString, undefined, { outputType: 'string' })),
    ).on('cycle', (event: Event) => {
      console.log(event.target.toString());
    }).run();
}

main();
