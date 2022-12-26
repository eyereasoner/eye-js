// A set of functions that take a SWIPLModule as input, apply
// a transformation, and then return the same module
import type { SWIPLModule } from 'swipl-wasm/dist/swipl/swipl';
import type SWIPL from 'swipl-wasm/dist/swipl/swipl';
import { Quad } from '@rdfjs/types';
import { DataFactory, Parser, Store } from 'n3';
import { write } from './n3Writer.temp';
import EYE from './eye.pl';

/**
 * Executes a query
 * @param Module The module to execute the query on
 * @param name The name of the query function
 * @param args The arguments of the query function
 * @returns The result of the query
 */
export function query(Module: SWIPLModule, name: string, args: string[] | string) {
  const queryString = `${name}(${
    typeof args === 'string'
      ? `"${args}"`
      : `[${args.map((arg) => `'${arg}'`).join(', ')}]`
  }).`;
  return Module.prolog.query(queryString);
}

export function queryOnce(Module: SWIPLModule, name: string, args: string[] | string) {
  return query(Module, name, args).once();
}

/**
 * A SWIPL transformer that loads and consults eye.pl in the
 * given SWIPL module
 * @param Module A SWIPL Module
 * @returns The same SWIPL module with EYE loaded and consulted
 */
export function loadEye(Module: SWIPLModule): SWIPLModule {
  Module.FS.writeFile('eye.pl', EYE);
  queryOnce(Module, 'consult', 'eye.pl');
  return Module;
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
  const Module = await swipl({ print: (str: string) => { res += `${str}\n`; }, arguments: ['-q'] });
  loadAndRunQuery(Module, data, queryString);
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
