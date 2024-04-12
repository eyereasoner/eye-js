import path from 'path';
import mockConsole from 'jest-mock-console';
import { Parser } from 'n3';
import { EventEmitter } from 'events';
import 'jest-rdf';
import { query, data, result } from '../data/socrates';
import { mainFunc } from '../dist/bin/main';
import { askCallback, askQuery, askResult } from '../data/ask';

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
  [path.join(__dirname, 'ask.n3')]: askQuery,
};

jest.mock('fs', () => ({
  existsSync: (pth: string) => pth in files,
  readFileSync: (pth: string) => Buffer.from(files[pth]),
}));

class ReadStream extends EventEmitter {
  /* eslint-disable class-methods-use-this */
  setEncoding() {}

  pause() {}

  resume() {}
  /* eslint-enable class-methods-use-this */
}

async function getConsoleOutput(args: string[]) {
  const restoreConsole = mockConsole();
  const stdin = new ReadStream();

  await mainFunc({
    argv: ['/bin/node', 'eyereasoner', ...args],
    cwd: () => __dirname,
    stdin,
    stdout: {
      write: (buffer: string | Uint8Array) => {
        if (typeof buffer === 'string' && buffer.startsWith('calc ')) {
          askCallback(buffer).then((res) => stdin.emit('data', Buffer.from(`${res}\n`)));
        }
      },
    },
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

  it('Should get output for strings ask', async () => {
    expect(new Parser().parse(await getConsoleOutput(['--nope', '--quiet', './ask.n3']))).toBeRdfIsomorphic(new Parser().parse(askResult));
  });
});
