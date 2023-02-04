/// <reference types="emscripten" />

import { Quad } from '@rdfjs/types';
import type { SWIPLModule } from 'swipl-wasm/dist/common';
// @ts-ignore
import SWIPL_BUNDLE from './swipl-bundled.temp';

import { executeBasicEyeQuery, IQueryOptions } from './transformers';

export * from './query';
export * from './transformers';
// eslint-disable-next-line no-unused-vars
export const SWIPL: (options?: Partial<EmscriptenModule>) => Promise<SWIPLModule> = SWIPL_BUNDLE;

export { default as EYE_PVM } from './eye';

/**
 * Executes a basic query using the EYE Reasoner and default build of SWIPL
 * @param data The data for the query as RDF/JS quads
 * @param query The query as RDF/JS quads
 * @param options The reasoner options
 *  - output: What to output (default: 'derivations')
 *  - blogic: Whether to use blogic (default: false)
 *  - outputType: The type of output, either 'string' or 'quads' (default: type of input data)
 * @returns The result of the query as RDF/JS quads
 */
export function basicQuery(
  data: Quad[] | string,
  query: Quad[] | string | undefined,
  options: ({ outputType: 'string' } & IQueryOptions),
): Promise<string>
export function basicQuery(
  data: Quad[] | string,
  query: Quad[] | string | undefined,
  options: ({ outputType: 'quads' } & IQueryOptions),
): Promise<Quad[]>
export function basicQuery(
  data: Quad[],
  query: Quad[] | string | undefined,
  options?: ({ outputType?: undefined } & IQueryOptions),
): Promise<Quad[]>
export function basicQuery(
  data: string,
  query: Quad[] | string | undefined,
  options?: ({ outputType?: undefined } & IQueryOptions),
): Promise<string>
export function basicQuery(
  data: Quad[] | string,
  query?: Quad[] | string | undefined,
  options?: IQueryOptions,
): Promise<Quad[] | string>
export function basicQuery(
  data: Quad[] | string,
  query?: Quad[] | string | undefined,
  options?: IQueryOptions,
): Promise<Quad[] | string> {
  return executeBasicEyeQuery(SWIPL_BUNDLE, data, query, options);
}

export { basicQuery as n3reasoner };
