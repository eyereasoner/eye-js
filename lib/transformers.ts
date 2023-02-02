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
 *  - output: What to output (default: 'derivations')
 *  - blogic: Whether to use blogic (default: false)
 * @returns The same SWIPL module
 */
export function runQuery(Module: SWIPLModule, data: string, queryString?: string, options = { output: 'derivations', blogic: false }): SWIPLModule {
  // Check options
  const unknownOptions = Object.keys(options).filter(
    (key) => !['output', 'blogic', 'outputType'].includes(key),
  );
  if (unknownOptions.length > 0) {
    throw new Error(
      `Unknown options: ${unknownOptions.join(', ')}`,
    );
  }
  const { output = 'derivations', blogic = false } = options;

  const passMap: {[index: string]:string} = {
    derivations: '--pass-only-new',
    deductive_closure: '--pass',
    deductive_closure_plus_rules: '--pass-all',
    grounded_deductive_closure_plus_rules: '--pass-all-ground',
  };
  // Check if output is valid
  if (!(output in passMap)) {
    throw new Error(`Unknown output option: ${output}`);
  }
  const pass = passMap[output];

  Module.FS.writeFile('data.nq', data);
  if (queryString && !blogic) {
    Module.FS.writeFile('query.nq', queryString);
  }
  queryOnce(Module, 'main', [blogic ? '--blogic' : '--nope', '--quiet', pass, ...(queryString && !blogic ? ['data.nq', '--query', './query.nq'] : ['--pass', 'data.nq'])]);
  return Module;
}

/**
 * @deprecated Use n3reasoner instead
 *
 * @param swipl The base SWIPL module to use
 * @param data The data for the query (in N3 format)
 * @param query The query (in N3 format)
 * @param options The reasoner options
 *  - output: What to output (default: 'derivations')
 *  - blogic: Whether to use blogic (default: false)
 *  - outputType: The type of output, either 'string' or 'quads' (default: 'string')
 * @returns The result of the query
 */
export async function executeBasicEyeQuery(
  swipl: typeof SWIPL_TYPE,
  data: Quad[] | string,
  query?: Quad[] | string,
  options = { output: 'derivations', blogic: false, outputType: 'string' },
): Promise<Quad[] | string> {
  const { outputType = 'string' } = options;

  // Check if outputType is valid
  if (!['string', 'quads'].includes(outputType)) {
    throw new Error(`Invalid outputType: ${outputType}`);
  }

  let res = '';
  const Module = await loadEyeImage(swipl)({ print: (str: string) => { res += `${str}\n`; }, arguments: ['-q'] });
  runQuery(
    Module,
    typeof data === 'string' ? data : write(data),
    typeof query === 'string' ? query : query && write(query),
    options,
  );

  if (outputType === 'quads') {
    const parser = new Parser({ format: 'text/n3' });
    return parser.parse(res);
  }
  return res;
}

/**
 * @deprecated Use n3reasoner instead
 *
 * @param swipl The base SWIPL module to use
 * @param data The data for the query (in N3 format)
 * @param query The query (in N3 format)
 * @param options The reasoner options
 *  - output: What to output (default: 'derivations')
 *  - blogic: Whether to use blogic (default: false)
 *  - outputType: The type of output, either 'string' or 'quads' (default: 'quads')
 * @returns The result of the query
 */
export async function executeBasicEyeQueryQuads(
  swipl: typeof SWIPL_TYPE,
  data: Quad[] | string,
  query?: Quad[] | string,
  options = { output: 'derivations', blogic: false, outputType: 'quads' },
): Promise<Quad[] | string> {
  return executeBasicEyeQuery(swipl, data, query, options);
}
