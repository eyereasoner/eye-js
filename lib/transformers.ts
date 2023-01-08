// A set of functions that take a SWIPLModule as input, apply
// a transformation, and then return the same module
import type { SWIPLModule } from 'swipl-wasm/dist/swipl/swipl';
import SWIPL from 'swipl-wasm/dist/swipl/swipl';
import { Quad } from '@rdfjs/types';
import { DataFactory, Parser, Store } from 'n3';
import { write } from './n3Writer.temp';
import EYE from './eye.pl';
import EYE_PVM from './eye.pvm';
import { queryOnce } from './query';

/**
 * A function that converts a string into a buffer.
 * This is required *only* for the conversion of the inlined
 * EYE_PVM string into a buffer
 * @param string The string to convert
 * @returns A Uint8Array Buffer
 */
export function strToBuffer(string: string) {
  const arrayBuffer = new ArrayBuffer(string.length * 1);
  const newUint = new Uint8Array(arrayBuffer);
  newUint.forEach((_, i) => {
    newUint[i] = string.charCodeAt(i);
  });
  return newUint;
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
 * Writes eye.pl to the Module
 * @param Module A SWIPL Module
 * @returns A SWIPL Module
 * @deprecated
 */
export function writeEye(Module: SWIPLModule): SWIPLModule {
  Module.FS.writeFile('eye.pl', EYE);
  return Module;
}

/**
 * Consults the eye.pl Module
 * @param Module A SWIPL Module
 * @returns A SWIPL Module
 * @deprecated
 */
export function consultEye(Module: SWIPLModule): SWIPLModule {
  queryOnce(Module, 'consult', 'eye.pl');
  return Module;
}

/**
 * A SWIPL transformer that loads and consults eye.pl in the
 * given SWIPL module
 * @param Module A SWIPL Module
 * @returns The same SWIPL module with EYE loaded and consulted
 * @deprecated
 */
export function loadEye(Module: SWIPLModule): SWIPLModule {
  return consultEye(writeEye(Module));
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
  queryOnce(Module, 'main', ['--quiet', './data.nq', '--query', './query.nq']);
  return Module;
}

/**
 * @param Module A SWIPL Module
 * @param data The data as N3
 * @param queryString The query as N3
 * @returns
 * @deprecated
 */
export function loadAndRunQuery(Module: SWIPLModule, data: string, queryString: string) {
  return runQuery(loadEye(Module), data, queryString);
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
): Promise<{ result: Quad[], proof: Quad[] }> {
  const parser = new Parser({ format: 'text/n3' });
  const queryResult = await executeBasicEyeQuery(swipl, write(data), write(queryString));
  const proof = parser.parse(queryResult);
  const store = new Store(proof);

  const proofNode = store.getSubjects(
    'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
    'http://www.w3.org/2000/10/swap/reason#Proof',
    DataFactory.defaultGraph(),
  );

  if (proofNode.length !== 1) {
    throw new Error(`Expected exactly one proof: received ${proofNode.length}`);
  }

  const results = store.getObjects(
    proofNode[0],
    'http://www.w3.org/2000/10/swap/reason#gives',
    DataFactory.defaultGraph(),
  );

  if (results.length !== 1) {
    throw new Error(`Expected exactly one triple giving inference results from proof: received ${results.length}`);
  }

  const result = store.getQuads(null, null, null, results[0])
    .map((res) => DataFactory.quad(res.subject, res.predicate, res.object));

  return {
    proof,
    result,
  };
}
