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
  [path.join(__dirname, 'sub-dir', 'socrates.n3')]: data,
  [path.join(__dirname, 'socrates-query.n3')]: query,
  [path.join(__dirname, 'sub-dir', 'socrates-query.n3')]: query,
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
  // @ts-ignore
  // eslint-disable-next-line no-console
  const stderrCalls: string[][] = console.error.mock.calls || [];

  restoreConsole();

  const stdout = calls.map((call) => call.join(' ')).join('\n');
  const stderr = stderrCalls.map((call) => call.join(' ')).join('\n');

  return { stdout, stderr };
}

describe('Testing CLI', () => {
  it('Should run', async () => {
    const { stdout } = await getConsoleOutput(['--nope', '--quiet', './socrates.n3', '--query', './socrates-query.n3']);
    expect(`\n${stdout}`).toEqual(result);
  });

  it('Should handle files in other directories', async () => {
    const { stdout, stderr } = await getConsoleOutput(['--nope', '--quiet', './sub-dir/socrates.n3', '--query', './sub-dir/socrates-query.n3']);

    expect(stderr).toEqual('');
    expect(`\n${stdout}`).toEqual(result);
  });

  it('Should get output for strings query', async () => {
    const { stdout } = await getConsoleOutput(['--quiet', '--strings', './strings.n3']);
    expect(stdout).toEqual('abc');
  });

  it('Should get output for strings ask', async () => {
    const { stdout } = await getConsoleOutput(['--nope', '--quiet', './ask.n3']);
    expect(new Parser().parse(stdout)).toBeRdfIsomorphic(new Parser().parse(askResult));
  });
});
