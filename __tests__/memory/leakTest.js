const { n3reasoner } = require('../../dist');

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

  console.log(`Starting with usage of: ${toMb(initial)}MB`)

  for (let i = 0; i < 200; i++) {
    // Allow for GC
    await new Promise(res => setTimeout(res, 0));

    maxStart = Math.max(process.memoryUsage().heapUsed, maxStart)
    await n3reasoner(data, query)
  }

  if ((maxStart - initial) > 50 * (1024 ** 2)) {
    throw new Error(`Exceeded initial memory consumption of ${toMb(initial)}MB by more than 50MB, reaching ${toMb(maxStart)}MB in the first 200 iterations`)
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

      if ((maxCont - maxStart) > 5 * (1024 ** 2)) {
        throw new Error(`${toMb(maxCont - maxStart)}MB increase encountered after ${i} iterations, max allowed: 5MB`)
      }
    }

    await n3reasoner(data, query)
  }

  if ((maxCont - initial) > 50 * (1024 ** 2)) {
    throw new Error(`Exceeded initial memory consumption of ${toMb(initial)}MB by more than 50MB, reaching ${toMb(maxCont)}MB`)
  }
}

main()
