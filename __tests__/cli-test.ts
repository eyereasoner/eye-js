import path from 'path';
import mockConsole from 'jest-mock-console';
import { query, data, result } from '../data/socrates';

import { mainFunc } from '../dist/bin/main';

const files = {
  [path.join(__dirname, 'socrates.n3')]: data,
  [path.join(__dirname, 'socrates-query.n3')]: query,
  [path.join(__dirname, 'strings.n3')]: `
  @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
  @prefix log: <http://www.w3.org/2000/10/swap/log#> .
  @prefix : <http://example.org/>.
  
  :Let :output "abc" .
  
  { :Let :output ?out } => { 1 log:outputString ?out } .
  `,
  [path.join(__dirname, 'calc.n3')]: `
  @prefix log: <http://www.w3.org/2000/10/swap/log#>.
  @prefix : <#>.

  {
      "calc 1+1" log:shell ?Y.
  } log:query {
      :result :is ?Y.
  }.
  `,
};

jest.mock('fs', () => ({
  existsSync: (pth: string) => pth in files,
  readFileSync: (pth: string) => Buffer.from(files[pth]),
}));

async function getConsoleOutput(args: string[]) {
  const restoreConsole = mockConsole();
  await mainFunc({
    argv: ['/bin/node', 'eyereasoner', ...args],
    cwd: () => __dirname,
  } as NodeJS.Process);

  // @ts-ignore
  // eslint-disable-next-line no-console
  const { calls }: { calls: string[][] } = console.log.mock;
  restoreConsole();

  return calls.map((call) => call.join(' ')).join('\n');
}

describe('Testing CLI', () => {
  it('Should run', async () => {
    const output = await getConsoleOutput(['--nope', '--quiet', './socrates.n3', '--query', './socrates-query.n3']);
    expect(`\n${output}`).toEqual(result);
  });

  it('Should get output for strings query', async () => {
    expect(await getConsoleOutput(['--quiet', '--strings', './strings.n3'])).toEqual('abc');
  });
});

const calcOutput = `@prefix : <file:///home/jdroo/temp/calc.n3#>.

:result :is "   2
".`;

describe('Testing CLI with Q/A loop', () => {
  it('Should run', async () => {
    const output = await getConsoleOutput(['--nope', '--quiet', './calc.n3']);
    expect(`\n${output}`).toEqual(calcOutput);
  });
});
