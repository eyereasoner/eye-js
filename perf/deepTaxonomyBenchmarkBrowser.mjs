// You can test the performance of eye in the browser by visitng https://eulersharp.sourceforge.net/
// and then executing this script in the console.
// The reason for visiting the site is to avoid CORS issues when fetching the test files.

const { eyereasoner } = await import('https://eyereasoner.github.io/eye-js/latest/dynamic-import.js');
const { queryOnce, SwiplEye } = eyereasoner

for (let i = 1; i < 6; i++) {
  const Module = await SwiplEye({ print: () => {} });
  Module.FS.writeFile(`test-relations-${10 ** i}.n3`, await (await fetch(`https://eulersharp.sourceforge.net/2009/12dtb/test-relations-${10 ** i}.n3`)).text());
  Module.FS.writeFile(`test-query.n3`, await (await fetch(`https://eulersharp.sourceforge.net/2009/12dtb/test-query.n3`)).text());
  Module.FS.writeFile(`test-facts.n3`, await (await fetch(`https://eulersharp.sourceforge.net/2009/12dtb/test-facts.n3`)).text());
  const time2 = Date.now();
  await queryOnce(Module, 'main', ['--quiet', '--nope', 'test-facts.n3', `test-relations-${10 ** i}.n3`, '--query', 'test-query.n3']);
  console.log(`[Extended: ${extended}] Time for deep taxonomy benchmark ${10 ** i} with SWIPL:\t${Date.now() - time2}ms`);
}
