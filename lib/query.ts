import type { SWIPLModule } from 'swipl-wasm';

interface CallOutput {
  done: boolean;
  resume: (res: string) => void; yield: string;
}

export function buildQuery(name: string, args: string | string[]) {
  return `${name}(${
    /* istanbul ignore next */
    typeof args === 'string'
      ? `"${args}"`
      : `[${args.map((arg) => `'${arg}'`).join(', ')}]`}).`;
}

/**
 * Executes a question/answer query
 * @param Module The module to execute the query on
 * @param name The name of the query function
 * @param args The arguments of the query function
 * @param cb The callback for question/answering
 * @returns The result of the query
 */
export async function qaQuery(
  module: SWIPLModule,
  queryString: string,
  args: string | string[],
  cb: (res: string) => Promise<string>,
) {
  let res = module.prolog.call(buildQuery(queryString, args), { async: true }) as CallOutput;
  while (!res.done) {
    // eslint-disable-next-line no-await-in-loop
    res = res.resume(await cb(res.yield)) as unknown as CallOutput;
  }
}

/**
 * Executes a query
 * @param Module The module to execute the query on
 * @param name The name of the query function
 * @param args The arguments of the query function
 * @returns The result of the query
 */
export function query(Module: SWIPLModule, name: string, args: string[] | string) {
  return Module.prolog.query(buildQuery(name, args));
}

export function queryOnce(Module: SWIPLModule, name: string, args: string[] | string) {
  return query(Module, name, args).once();
}
