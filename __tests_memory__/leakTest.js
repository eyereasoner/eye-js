const { n3reasoner } = require('../dist');

const query = `
@prefix : <http://example.org/socrates#>.

{:Socrates a ?WHAT} => {:Socrates a ?WHAT}.
`;

const data = `
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix : <http://example.org/socrates#>.

:Socrates a :Human.
:Human rdfs:subClassOf :Mortal.

{?A rdfs:subClassOf ?B. ?S a ?A} => {?S a ?B}.
`;

function toMb(value) {
  return Math.floor(value / 1024 / 1024)
}

// This test is run with --expose-gc so that a full garbage collection can be
// forced before taking each memory sample. Without this, the samples mostly
// measure garbage that is merely awaiting collection (e.g. discarded SWIPL
// WASM instances), rather than memory that is actually retained, which makes
// the thresholds below flaky.
async function sampleMemory() {
  // Allow for GC
  await new Promise(res => setTimeout(res, 0));

  if (typeof global.gc === 'function') {
    // Two passes with a small delay in between, so that any finalizers queued
    // by the first pass have run before the second one.
    global.gc();
    await new Promise(res => setTimeout(res, 5));
    global.gc();
  }
  return process.memoryUsage();
}

async function main() {
  const { heapUsed: initial } = await sampleMemory();
  let maxStart = 0;
  let maxStartExternal = 0;

  // Warmup
  for (let i = 0; i < 100; i++) {
    // Allow for GC
    await new Promise(res => setTimeout(res, 0));

    await n3reasoner(data, query)
  }

  for (let i = 0; i < 200; i++) {
    const { heapUsed, external } = await sampleMemory();
    maxStart = Math.max(heapUsed, maxStart)
    maxStartExternal = Math.max(external, maxStartExternal)
    await n3reasoner(data, query)
  }

  if ((maxStart - initial) > 50 * (1024 ** 2)) {
    throw new Error(`Exceeded initial memory consumption of ${toMb(initial)}MB by more than 50MB, reaching ${toMb(maxStart)}MB in the first 100 iterations`)
  }

  console.log(`Maximum memory usage in first 200 iterations: ${toMb(maxStart)}MB (external: ${toMb(maxStartExternal)}MB)`)

  console.log('\nNow testing for long term memory increase')

  let maxCont = 0;

  for (let i = 0; i <= 500; i++) {
    maxCont = Math.max((await sampleMemory()).heapUsed, maxCont);

    if (i !== 0 && (i % 50 === 0)) {
      console.log(`Max usage after ${i} iterations: ${toMb(maxCont)}MB`);
    }

    await n3reasoner(data, query);
  }

  let minTail = maxCont;
  let minTailExternal = Infinity;

  // To avoid test flakiness from general variability in tests
  // compare the highest value on the first 50 tests to the lowest value
  // in the last 50 tests
  for (let i = 0; i <= 50; i++) {
    const { heapUsed, external } = await sampleMemory();
    minTail = Math.min(heapUsed, minTail);
    minTailExternal = Math.min(external, minTailExternal);
    await n3reasoner(data, query);
  }

  console.log(`The minimum value found in the tail was ${toMb(minTail)}MB (external: ${toMb(minTailExternal)}MB)`)

  if ((minTail - maxStart) > 1 * (1024 ** 2)) {
    throw new Error(`${toMb(minTail - maxStart)}MB increase encountered, max allowed: 1MB`)
  }

  if ((maxCont - initial) > 50 * (1024 ** 2)) {
    throw new Error(`Exceeded initial memory consumption of ${toMb(initial)}MB by more than 50MB, reaching ${toMb(minTail)}MB`)
  }

  // External memory covers the ArrayBuffers backing the SWIPL WASM instances,
  // which heapUsed cannot see; after a forced GC it should return to its
  // baseline, so sustained growth here means instances are actually retained.
  if ((minTailExternal - maxStartExternal) > 25 * (1024 ** 2)) {
    throw new Error(`${toMb(minTailExternal - maxStartExternal)}MB increase in external (WASM) memory encountered, max allowed: 25MB`)
  }
}

main()
