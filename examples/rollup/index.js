import { n3reasoner } from 'eyereasoner';

document.getElementById('execute').addEventListener("click", async () => {
      
  document.getElementById("result").innerHTML = (await n3reasoner(
    document.getElementById("data").value,
    undefined,
    { output: 'derivations' }
  )).replaceAll('\n', '<br>');

});
