/// <reference types="emscripten" />

import { Quad } from '@rdfjs/types';
import type { SWIPLModule } from 'swipl-wasm/dist/common';
// @ts-ignore
import SWIPL_BUNDLE from './swipl-bundled.temp';

import { executeBasicEyeQuery, executeBasicEyeQueryQuads } from './transformers';

export * from './query';
export * from './transformers';
// eslint-disable-next-line no-unused-vars
export const SWIPL: (options?: Partial<EmscriptenModule>) => Promise<SWIPLModule> = SWIPL_BUNDLE;

export { default as EYE_PVM } from './eye';

/**
 * Executes a basic query using the EYE Reasoner and default build of SWIPL
 * @param data The data for the query as RDF/JS quads
 * @param query The query as RDF/JS quads
 * @returns The result of the query as RDF/JS quads
 */
export function basicQuery(
  data: Quad[],
  query?: Quad[],
): Promise<Quad[]> {
  return executeBasicEyeQueryQuads(SWIPL_BUNDLE, data, query) as Promise<Quad[]>;
}

export async function n3reasoner(
  data: Quad[] | string,
  query?: Quad[] | string,
  options = { output: 'derivations', blogic: false, outputType: 'string' },
): Promise<Quad[] | string> {
  return executeBasicEyeQuery(SWIPL_BUNDLE, data, query, options);
}
