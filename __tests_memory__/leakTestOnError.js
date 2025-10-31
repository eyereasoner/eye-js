const { n3reasoner } = require('../dist');

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

    await n3reasoner('invalid', 'invalid').catch(() => {})
  }

  for (let i = 0; i < 200; i++) {
    // Allow for GC
    await new Promise(res => setTimeout(res, 0));

    maxStart = Math.max(process.memoryUsage().heapUsed, maxStart)
    await n3reasoner('invalid', 'invalid').catch(() => {});
  }

  if ((maxStart - initial) > 50 * (1024 ** 2)) {
    throw new Error(`Exceeded initial memory consumption of ${toMb(initial)}MB by more than 50MB, reaching ${toMb(maxStart)}MB in the first 100 iterations`)
  }

  console.log(`Maximum memory usage in first 200 iterations: ${toMb(maxStart)}MB`)

  console.log('\nNow testing for long term memory increase')

  let maxCont = 0;

  for (let i = 0; i <= 500; i++) {
    // Allow for GC
    await new Promise(res => setTimeout(res, 0));

    maxCont = Math.max(process.memoryUsage().heapUsed, maxCont);

    if (i !== 0 && (i % 50 === 0)) {
      console.log(`Max usage after ${i} iterations: ${toMb(maxCont)}MB`);
    }

    await n3reasoner('invalid', 'invalid').catch(() => {});;
  }

  let minTail = maxCont;

  // To avoid test flakiness from general variability in tests
  // compare the highest value on the first 50 tests to the lowest value
  // in the last 50 tests
  for (let i = 0; i <= 50; i++) {
    await new Promise(res => setTimeout(res, 0));

    minTail = Math.min(process.memoryUsage().heapUsed, minTail);
    await n3reasoner('invalid', 'invalid').catch(() => {});;
  }

  console.log(`The minimum value found in the tail was ${toMb(minTail)}MB`)

  if ((minTail - maxStart) > 1 * (1024 ** 2)) {
    throw new Error(`${toMb(minTail - maxStart)}MB increase encountered, max allowed: 1MB`)
  }

  if ((maxCont - initial) > 50 * (1024 ** 2)) {
    throw new Error(`Exceeded initial memory consumption of ${toMb(initial)}MB by more than 50MB, reaching ${toMb(minTail)}MB`)
  }
}

main()
