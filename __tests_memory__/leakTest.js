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

async function main() {
  const initial = process.memoryUsage().heapUsed;
  let maxStart = 0;
  
  // Warmup
  for (let i = 0; i < 100; i++) {
    // Allow for GC
    await new Promise(res => setTimeout(res, 0));

    await n3reasoner(data, query)
  }

  for (let i = 0; i < 200; i++) {
    // Allow for GC
    await new Promise(res => setTimeout(res, 0));

    maxStart = Math.max(process.memoryUsage().heapUsed, maxStart)
    await n3reasoner(data, query)
  }

  if ((maxStart - initial) > 50 * (1024 ** 2)) {
    throw new Error(`Exceeded initial memory consumption of ${toMb(initial)}MB by more than 50MB, reaching ${toMb(maxStart)}MB in the first 100 iterations`)
  }

  console.log(`Maximum memory usage in first 200 iterations: ${toMb(maxStart)}MB`)

  console.log('\nNow testing for long term memory increase')

  let maxCont = 0;

  for (let i = 0; i <= 1000; i++) {
    // Allow for GC
    await new Promise(res => setTimeout(res, 0));

    maxCont = Math.max(process.memoryUsage().heapUsed, maxCont);

    if (i !== 0 && (i % 50 === 0)) {
      console.log(`Max usage after ${i} iterations: ${toMb(maxCont)}MB`);
    }

    await n3reasoner(data, query);
  }

  let minTail = maxCont;

  // To avoid test flakiness from general variability in tests
  // compare the highest value on the first 50 tests to the lowest value
  // in the last 50 tests
  for (let i = 0; i <= 50; i++) {
    await new Promise(res => setTimeout(res, 0));

    minTail = Math.min(process.memoryUsage().heapUsed, minTail);
    await n3reasoner(data, query);
  }

  console.log(`The minimum value found in the tail was ${toMb(minTail)}MB`)

  if ((minTail - maxStart) > 1 * (1024 ** 2)) {
    throw new Error(`${toMb(maxCont - maxStart)}MB increase encountered after ${i} iterations, max allowed: 1MB`)
  }

  if ((maxCont - initial) > 50 * (1024 ** 2)) {
    throw new Error(`Exceeded initial memory consumption of ${toMb(initial)}MB by more than 50MB, reaching ${toMb(minTail)}MB`)
  }
}

main()
