// A set of functions that take a SWIPLModule as input, apply
// a transformation, and then return the same module
import type { SWIPLModule } from 'swipl-wasm/dist/swipl/swipl';
import { Quad } from '@rdfjs/types';
import { Parser } from 'n3';
import type SWIPL_TYPE from 'swipl-wasm/dist/common';
// @ts-ignore
import SWIPL from './swipl-bundled.temp';
import { write } from './n3Writer.temp';
import EYE_PVM from './eye';
import { queryOnce } from './query';
import { strToBuffer } from './strToBuffer';

export type ICoreQueryOptions = {
  blogic: true;
  output?: undefined;
} | {
  blogic?: false;
  output?: 'derivations' | 'deductive_closure' | 'deductive_closure_plus_rules' | 'grounded_deductive_closure_plus_rules';
}

export type IQueryOptions = ICoreQueryOptions & {
  outputType?: 'string' | 'quads';
}

export function loadEyeImage(swipl: typeof SWIPL_TYPE) {
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
 * @param options The reasoner options
 *  - output: What to output with implicit queries (default: undefined)
 *  - blogic: Whether to use blogic (default: false)
 * @returns The same SWIPL module
 */
export function runQuery(
  Module: SWIPLModule,
  data: string,
  queryString?: string,
  { blogic, output }: IQueryOptions = {},
): SWIPLModule {
  const args: string[] = ['--quiet', 'data.nq'];

  if (blogic) {
    if (output || queryString) {
      throw new Error('Cannot use blogic with explicit output or query');
    }
    args.push('--blogic');
  } else {
    args.push('--nope');

    if (queryString) {
      if (output) {
        throw new Error('Cannot use explicit output with explicit query');
      }
      Module.FS.writeFile('query.nq', queryString);
      args.push('--query', './query.nq');
    } else {
      switch (output) {
        case undefined:
        case 'derivations':
          args.push('--pass-only-new');
          break;
        case 'deductive_closure':
          args.push('--pass');
          break;
        case 'deductive_closure_plus_rules':
          args.push('--pass-all');
          break;
        case 'grounded_deductive_closure_plus_rules':
          args.push('--pass-all-ground');
          break;
        default:
          throw new Error(`Unknown output option: ${output}`);
      }
    }
  }

  Module.FS.writeFile('data.nq', data);

  queryOnce(Module, 'main', args);
  return Module;
}

/**
 * @param swipl The base SWIPL module to use
 * @param data The data for the query (in N3 format)
 * @param query The query (in N3 format)
 * @param options The reasoner options
 *  - output: What to output with implicit queries (default: undefined)
 *  - blogic: Whether to use blogic (default: false)
 *  - outputType: The type of output, either 'string' or 'quads' (default: 'string')
 * @returns The result of the query
 */
export async function executeBasicEyeQuery(
  swipl: typeof SWIPL_TYPE,
  data: Quad[] | string,
  query: Quad[] | string | undefined,
  options: { outputType: 'string' } & IQueryOptions,
): Promise<string>
export async function executeBasicEyeQuery(
  swipl: typeof SWIPL_TYPE,
  data: Quad[] | string,
  query: Quad[] | string | undefined,
  options: { outputType: 'quads' } & IQueryOptions,
): Promise<Quad[]>
export async function executeBasicEyeQuery(
  swipl: typeof SWIPL_TYPE,
  data: Quad[],
  query?: Quad[] | string | undefined,
  options?: { outputType?: undefined } & IQueryOptions,
): Promise<Quad[]>
export async function executeBasicEyeQuery(
  swipl: typeof SWIPL_TYPE,
  data: string,
  query?: Quad[] | string | undefined,
  options?: { outputType?: undefined } & IQueryOptions,
): Promise<string>
export async function executeBasicEyeQuery(
  swipl: typeof SWIPL_TYPE,
  data: Quad[] | string,
  query?: Quad[] | string | undefined,
  options?: IQueryOptions,
): Promise<Quad[] | string>;
export async function executeBasicEyeQuery(
  swipl: typeof SWIPL_TYPE,
  data: Quad[] | string,
  query?: Quad[] | string | undefined,
  options?: IQueryOptions,
): Promise<Quad[] | string> {
  const outputType = options?.outputType;

  let res = '';
  const err: string[] = [];
  const Module = await loadEyeImage(swipl)({
    print: (str: string) => { res += `${str}\n`; },
    printErr: (str: string) => { err.push(str); },
  });
  runQuery(
    Module,
    typeof data === 'string' ? data : write(data),
    query && (typeof query === 'string' ? query : write(query)),
    options,
  );

  if (err.length > 0) {
    throw new Error(`Error while executing query: ${err.join('\n')}`);
  }

  return (outputType === 'quads' || (typeof data !== 'string' && outputType !== 'string'))
    ? (new Parser({ format: 'text/n3' })).parse(res)
    : res;
}
