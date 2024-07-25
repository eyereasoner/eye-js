// A set of functions that take a SWIPLModule as input, apply
// a transformation, and then return the same module
import { Quad } from '@rdfjs/types';
import {
  BaseQuad, Parser, Store, Writer,
} from 'n3';
import SWIPL, { type SWIPLModule } from 'swipl-wasm/dist/swipl/swipl-bundle-no-data';
import strToBuffer from 'swipl-wasm/dist/strToBuffer';
import { write } from './n3Writer.temp';
import EYE_PVM from './eye';
import SEE_PVM from './lingua';
import { qaQuery, queryOnce } from './query';

export type ICoreQueryOptions = {
  /**
   * Whether or not to perform bnodeRelabeling
   * @default true
   */
  bnodeRelabeling?: boolean;
  output?: 'derivations' | 'deductive_closure' | 'deductive_closure_plus_rules' | 'grounded_deductive_closure_plus_rules' | 'none';
}

export type Options = ICoreQueryOptions & {
  outputType?: 'string' | 'quads';
  SWIPL?: typeof SWIPL;
  cb?: (res: string) => Promise<string>;
}

type IOptions = Options & {
  /* eslint-disable-next-line max-len */
  imageLoader?(swipl: typeof SWIPL): (options?: Partial<EmscriptenModule> | undefined) => Promise<SWIPLModule>;
}

type IData = (string | { data: string; triplesOnly: boolean })[]

export function loadImage(image: string) {
  return (swipl: typeof SWIPL) => (options?: Partial<EmscriptenModule> | undefined) => swipl({
    ...options,
    arguments: ['-q', '-x', 'eye.pvm'],
    // @ts-ignore
    preRun: (module: SWIPLModule) => module.FS.writeFile('eye.pvm', strToBuffer(image)),
  });
}

export const loadEyeImage = loadImage(EYE_PVM);

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
 *  - cb: An EXPERIMENTAL callback to be used for question/answering (default: undefined)
 * @returns The same SWIPL module
 */
export function runQuery(
  Module: SWIPLModule,
  data: IData,
  queryString: string | undefined,
  options: Options & { cb?: undefined },
  noOptions?: boolean,
): SWIPLModule
export function runQuery(
  Module: SWIPLModule,
  data: IData,
  queryString?: string,
  options?: Options, // eslint-disable-line default-param-last
  noOptions?: boolean,
): SWIPLModule | Promise<SWIPLModule>
export function runQuery(
  Module: SWIPLModule,
  data: IData,
  queryString?: string,
  { output, cb, bnodeRelabeling }: Options = {}, // eslint-disable-line default-param-last
  noOptions?: boolean,
): SWIPLModule | Promise<SWIPLModule> {
  const args = noOptions ? [] : ['--nope', '--quiet'];

  for (let i = 0; i < data.length; i += 1) {
    const elem = data[i];
    const turtle = typeof elem === 'object' && elem.triplesOnly;
    if (turtle) {
      args.push('--turtle');
    }
    args.push(`data_${i}.n3s`);
    Module.FS.writeFile(`data_${i}.n3s`, typeof elem === 'object' ? elem.data : elem);
  }

  if (queryString) {
    if (output) {
      throw new Error('Cannot use explicit output with explicit query');
    }
    Module.FS.writeFile('query.n3s', queryString);
    args.push('--query', './query.n3s');
  } else if (!noOptions) {
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
      case 'none':
        break;
      default:
        throw new Error(`Unknown output option: ${output}`);
    }
  }

  if (bnodeRelabeling === false) {
    args.push('--no-bnode-relabeling');
  }

  if (cb) {
    return qaQuery(Module, 'main', args, cb).then(() => Module);
  }
  queryOnce(Module, 'main', args);

  return Module;
}

function parse(res: string) {
  const parser = new Parser({ format: 'text/n3' });
  // Workaround for https://github.com/rdfjs/N3.js/issues/324
  // @ts-expect-error
  // eslint-disable-next-line no-underscore-dangle
  parser._supportsRDFStar = true;
  try {
    return parser.parse(res);
  } catch (e) {
    throw new Error(`Error while parsing query result: [${e}]. Query result: [${res}]`);
  }
}

export type Data = Quad[] | string
export type InputData = Data | [string, ...string[]]
export type Query = Data | undefined

function inputDataToStrings(data: InputData): IData {
  if (typeof data === 'string') {
    return [data];
  }
  if (typeof data[0] === 'string') {
    return data as [string, ...string[]];
  }
  const triples = [];
  const quads = new Store();

  for (const elem of (data as BaseQuad[])) {
    if (elem.graph.termType === 'DefaultGraph'
        && elem.subject.termType === 'NamedNode'
        && elem.predicate.termType === 'NamedNode'
        && elem.object.termType === 'NamedNode') {
      triples.push(elem as Quad);
    } else {
      quads.addQuad(elem as Quad);
    }
  }

  const strings: IData = [];
  if (triples.length > 0) {
    strings.push({ triplesOnly: true, data: (new Writer()).quadsToString(triples) });
  }
  if (data.length > 0 && triples.length !== data.length) {
    strings.push(write(quads));
  }

  return strings;
}

/**
 * Executes a basic query using the EYE Reasoner and default build of SWIPL
 * @param data The data for the query as RDF/JS quads
 * @param query The query as RDF/JS quads
 * @param options The reasoner options
 *  - output: What to output with implicit queries (default: undefined)
 *  - outputType: The type of output, either 'string' or 'quads' (default: type of input data)
 *  - SWIPL: The SWIPL module to use (default: bundled SWIPL)
 * @returns The result of the query as a string or RDF/JS quads
 */
/* eslint-disable max-len */
export async function executeBasicEyeQuery(swipl: typeof SWIPL, data: InputData, query: Query, options: { outputType: 'string' } & IOptions): Promise<string>
export async function executeBasicEyeQuery(swipl: typeof SWIPL, data: InputData, query: Query, options: { outputType: 'quads' } & IOptions): Promise<Quad[]>
export async function executeBasicEyeQuery(swipl: typeof SWIPL, data: Quad[], query?: Query, options?: { outputType?: undefined } & IOptions): Promise<Quad[]>
export async function executeBasicEyeQuery(swipl: typeof SWIPL, data: string | [string, ...string[]], query?: Query, options?: { outputType?: undefined } & IOptions): Promise<string>
export async function executeBasicEyeQuery(swipl: typeof SWIPL, data: InputData, query?: Query, options?: IOptions): Promise<Quad[] | string>;
export async function executeBasicEyeQuery(swipl: typeof SWIPL, data: InputData, query?: Query, options?: IOptions): Promise<Quad[] | string> {
/* eslint-enable max-len */
  const outputType = options?.outputType;

  let res = '';
  const err: string[] = [];
  const Module = await (options?.imageLoader ?? loadEyeImage)(swipl)({
    print: (str: string) => { res += `${str}\n`; },
    printErr: (str: string) => { err.push(str); },
  });
  await runQuery(
    Module,
    inputDataToStrings(data),
    query && (typeof query === 'string' ? query : write(query)),
    options,
    !!options?.imageLoader,
  );

  if (err.length > 0) {
    throw new Error(`Error while executing query: ${err.join('\n')}`);
  }

  // eslint-disable-next-line no-nested-ternary
  return (outputType === 'quads' || (typeof data !== 'string' && typeof data[0] !== 'string' && outputType !== 'string'))
    ? (options?.imageLoader ? ((new Parser({ format: 'trig' })).parse(res)) : parse(res))
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
 * @returns The result of the query as a string or RDF/JS quads
 */
/* eslint-disable max-len */
export async function n3reasoner(data: InputData, query: Query, options: { outputType: 'string' } & Options): Promise<string>
export async function n3reasoner(data: InputData, query: Query, options: { outputType: 'quads' } & Options): Promise<Quad[]>
export async function n3reasoner(data: Quad[], query?: Query, options?: { outputType?: undefined } & Options): Promise<Quad[]>
export async function n3reasoner(data: string | [string, ...string[]], query?: Query, options?: { outputType?: undefined } & Options): Promise<string>
export async function n3reasoner(data: InputData, query?: Query, options?: Options): Promise<Quad[] | string>;
export async function n3reasoner(data: InputData, query?: Query, options?: Options): Promise<Quad[] | string> {
/* eslint-enable max-len */
  return executeBasicEyeQuery(options?.SWIPL || SWIPL, data, query, options);
}

/**
 * Executes a basic lingua query using the SEE Reasoner and default build of SWIPL
 * @param swipl The base SWIPL module to use
 * @param data The data for the query as RDF/JS quads
 * @param query The query as RDF/JS quads
 * @param options The reasoner options
 *  - output: What to output with implicit queries (default: undefined)
 *  - outputType: The type of output, either 'string' or 'quads' (default: type of input data)
 * @returns The result of the query as a string or RDF/JS quads
 */
/* eslint-disable max-len */
export async function linguareasoner(data: InputData, query: Query, options: { outputType: 'string' } & Options): Promise<string>
export async function linguareasoner(data: InputData, query: Query, options: { outputType: 'quads' } & Options): Promise<Quad[]>
export async function linguareasoner(data: Quad[], query?: Query, options?: { outputType?: undefined } & Options): Promise<Quad[]>
export async function linguareasoner(data: string | [string, ...string[]], query?: Query, options?: { outputType?: undefined } & Options): Promise<string>
export async function linguareasoner(data: InputData, query?: Query, options?: Options): Promise<Quad[] | string>;
export async function linguareasoner(data: InputData, query?: Query, options?: Options): Promise<Quad[] | string> {
  return executeBasicEyeQuery(options?.SWIPL || SWIPL, data, query, { ...options, imageLoader: loadImage(SEE_PVM) });
}
/* eslint-enable max-len */
