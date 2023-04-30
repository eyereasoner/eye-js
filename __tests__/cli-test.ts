import path from 'path';
import mockConsole from 'jest-mock-console';
import { query, data, result } from '../data/socrates';

import { mainFunc } from '../lib/bin/main';

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
