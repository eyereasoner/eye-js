import { loadEyeImage, SWIPL, queryOnce } from 'eyereasoner';

document.addEventListener('click', async function (event) {
  if (event.target.id === 'execute') {
    let result = '';
    const SwiplEye = loadEyeImage(SWIPL);

    // Instantiate a new SWIPL module and log any results it produces to the console
    const Module = await SwiplEye({ print: (str) => { result += str + '<br>' }, arguments: ['-q'] });
  
    // Load the the strings data and query as files data.n3 and query.n3 into the module
    Module.FS.writeFile('data.n3', document.getElementById("data").value);
    Module.FS.writeFile('query.n3', '{?S ?P ?O} => {?S ?P ?O}.');
  
    queryOnce(Module, 'main', ['--nope', '--quiet', './data.n3', '--query', './query.n3']);
    document.getElementById("result").innerHTML = result;
  }
});
