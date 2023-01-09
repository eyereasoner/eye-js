// A set of functions that take a SWIPLModule as input, apply
// a transformation, and then return the same module
import type { SWIPLModule } from 'swipl-wasm/dist/swipl/swipl';
import { Quad } from '@rdfjs/types';
import { Parser } from 'n3';
// @ts-ignore
import SWIPL from './swipl-bundled.temp';
import { write } from './n3Writer.temp';
import EYE_PVM from './eye';
import { queryOnce } from './query';
import { strToBuffer } from './strToBuffer';

export function loadEyeImage(swipl: typeof SWIPL) {
  return (options?: Partial<EmscriptenModule> | undefined) => swipl({
    ...options,
    arguments: ['-q', '-x', 'eye.pvm'],
    // @ts-ignore
    preRun: (module: SWIPLModule) => module.FS.writeFile('eye.pvm', strToBuffer(EYE_PVM)),
  });
}

/**
 * Creates default SWIPL image loaded with EYE
 */
export function SwiplEye(options?: Partial<EmscriptenModule> | undefined) {
  return loadEyeImage(SWIPL)(options);
}

/**
 * Execute a query over a given data file
 * @param Module A SWIPL Module
 * @param data The data for the query (in Notation3)
 * @param queryString The query (in Notation3)
 * @returns The same SWIPL module
 */
export function runQuery(Module: SWIPLModule, data: string, queryString: string): SWIPLModule {
  Module.FS.writeFile('data.nq', data);
  Module.FS.writeFile('query.nq', queryString);
  queryOnce(Module, 'main', ['--nope', '--quiet', './data.nq', '--query', './query.nq']);
  return Module;
}

/**
 * @param swipl The base SWIPL module to use
 * @param data The data for the query (in N3 format)
 * @param queryString The query (in N3 format)
 * @returns The result of the query
 */
export async function executeBasicEyeQuery(
  swipl: typeof SWIPL,
  data: string,
  queryString: string,
): Promise<string> {
  let res = '';
  const Module = await loadEyeImage(swipl)({ print: (str: string) => { res += `${str}\n`; }, arguments: ['-q'] });
  runQuery(Module, data, queryString);
  return res;
}

/**
 * @param swipl The base SWIPL module to use
 * @param data The data for the query (in N3 format)
 * @param queryString The query (in N3 format)
 * @returns The result of the query
 */
export async function executeBasicEyeQueryQuads(
  swipl: typeof SWIPL,
  data: Quad[],
  queryString: Quad[],
): Promise<Quad[]> {
  const parser = new Parser({ format: 'text/n3' });
  const queryResult = await executeBasicEyeQuery(swipl, write(data), write(queryString));
  return parser.parse(queryResult);
}
