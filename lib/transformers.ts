// A set of functions that take a SWIPLModule as input, apply
// a transformation, and then return the same module
import { Quad } from '@rdfjs/types';
import { Parser } from 'n3';
import SWIPL, { type SWIPLModule } from 'swipl-wasm/dist/swipl/swipl-bundle-no-data';
import strToBuffer from 'swipl-wasm/dist/strToBuffer';
import { write } from './n3Writer.temp';
import EYE_PVM from './eye';
import { queryOnce } from './query';

export type ICoreQueryOptions = {
  output?: 'derivations' | 'deductive_closure' | 'deductive_closure_plus_rules' | 'grounded_deductive_closure_plus_rules';
}

export type Options = ICoreQueryOptions & {
  outputType?: 'string' | 'quads';
  SWIPL?: typeof SWIPL;
}

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
 * @param options The reasoner options
 *  - output: What to output with implicit queries (default: undefined)
 * @returns The same SWIPL module
 */
export function runQuery(
  Module: SWIPLModule,
  data: string,
  queryString?: string,
  { output }: Options = {},
): SWIPLModule {
  const args: string[] = ['--nope', '--quiet', 'data.n3s'];

  if (queryString) {
    if (output) {
      throw new Error('Cannot use explicit output with explicit query');
    }
    Module.FS.writeFile('query.n3s', queryString);
    args.push('--query', './query.n3s');
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

  Module.FS.writeFile('data.n3s', data);

  queryOnce(Module, 'main', args);
  return Module;
}

function parse(res: string) {
  const parser = new Parser({ format: 'text/n3' });
  // Workaround for https://github.com/rdfjs/N3.js/issues/324
  // @ts-expect-error
  // eslint-disable-next-line no-underscore-dangle
  parser._supportsRDFStar = true;
  return parser.parse(res);
}

export type Data = Quad[] | string
export type Query = Data | undefined

/**
 * Executes a basic query using the EYE Reasoner and default build of SWIPL
 * @param data The data for the query as RDF/JS quads
 * @param query The query as RDF/JS quads
 * @param options The reasoner options
 *  - output: What to output with implicit queries (default: undefined)
 *  - outputType: The type of output, either 'string' or 'quads' (default: type of input data)
 *  - SWIPL: The SWIPL module to use (default: bundled SWIPL)
 * @returns The result of the query as RDF/JS quads
 */
/* eslint-disable max-len */
export async function executeBasicEyeQuery(swipl: typeof SWIPL, data: Data, query: Query, options: { outputType: 'string' } & Options): Promise<string>
export async function executeBasicEyeQuery(swipl: typeof SWIPL, data: Data, query: Query, options: { outputType: 'quads' } & Options): Promise<Quad[]>
export async function executeBasicEyeQuery(swipl: typeof SWIPL, data: Quad[], query?: Query, options?: { outputType?: undefined } & Options): Promise<Quad[]>
export async function executeBasicEyeQuery(swipl: typeof SWIPL, data: string, query?: Query, options?: { outputType?: undefined } & Options): Promise<string>
export async function executeBasicEyeQuery(swipl: typeof SWIPL, data: Data, query?: Query, options?: Options): Promise<Quad[] | string>;
export async function executeBasicEyeQuery(swipl: typeof SWIPL, data: Data, query?: Query, options?: Options): Promise<Quad[] | string> {
/* eslint-enable max-len */
  const outputType = options?.outputType;

  let res = '';
  const err: string[] = [];
  const Module = await loadEyeImage(swipl)({
    print: (str: string) => { res += `${str}\n`; },
    printErr: (str: string) => { err.push(str); },
  });
  runQuery(
    Module,
    typeof data === 'string' ? data : await write(data, { format: 'text/n3' }),
    query && (typeof query === 'string' ? query : await write(query, { format: 'text/n3' })),
    options,
  );

  if (err.length > 0) {
    throw new Error(`Error while executing query: ${err.join('\n')}`);
  }

  return (outputType === 'quads' || (typeof data !== 'string' && outputType !== 'string'))
    ? parse(res)
    : res;
}

/**
 * Executes a basic query using the EYE Reasoner and default build of SWIPL
 * @param swipl The base SWIPL module to use
 * @param data The data for the query as RDF/JS quads
 * @param query The query as RDF/JS quads
 * @param options The reasoner options
 *  - output: What to output with implicit queries (default: undefined)
 *  - outputType: The type of output, either 'string' or 'quads' (default: type of input data)
 * @returns The result of the query as RDF/JS quads
 */
/* eslint-disable max-len */
export async function n3reasoner(data: Data, query: Query, options: { outputType: 'string' } & Options): Promise<string>
export async function n3reasoner(data: Data, query: Query, options: { outputType: 'quads' } & Options): Promise<Quad[]>
export async function n3reasoner(data: Quad[], query?: Query, options?: { outputType?: undefined } & Options): Promise<Quad[]>
export async function n3reasoner(data: string, query?: Query, options?: { outputType?: undefined } & Options): Promise<string>
export async function n3reasoner(data: Data, query?: Query, options?: Options): Promise<Quad[] | string>;
export async function n3reasoner(data: Data, query?: Query, options?: Options): Promise<Quad[] | string> {
/* eslint-enable max-len */
  return executeBasicEyeQuery(options?.SWIPL || SWIPL, data, query, options);
}
