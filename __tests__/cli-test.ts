import path from 'path';
import mockConsole from 'jest-mock-console';
import { query, data, result } from '../data/socrates';

import { mainFunc } from '../dist/bin/main';

const files = {
  [path.join(__dirname, 'socrates.n3')]: data,
  [path.join(__dirname, 'socrates-query.n3')]: query,
};

jest.mock('fs', () => ({
  existsSync: (pth: string) => pth in files,
  readFileSync: (pth: string) => Buffer.from(files[pth]),
}));

describe('Testing CLI', () => {
  it('Should run', async () => {
    const restoreConsole = mockConsole();
    await mainFunc({
      argv: ['/bin/node', 'eyereasoner', '--nope', '--quiet', './socrates.n3', '--query', './socrates-query.n3'],
      cwd: () => __dirname,
    } as NodeJS.Process);

    // @ts-ignore
    // eslint-disable-next-line no-console
    const { calls }: { calls: string[][] } = console.log.mock;
    restoreConsole();

    expect(`\n${calls.map((call) => call.join(' ')).join('\n')}`).toEqual(result);
  });
});
