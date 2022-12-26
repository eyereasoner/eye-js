import { Quad } from '@rdfjs/types';
// @ts-ignore
import SWIPL from './swipl-bundled.temp';

import { executeBasicEyeQueryQuads } from './transformers';

export * from './transformers';
// @ts-ignore
export { default as SWIPL } from './swipl-bundled.temp';

/**
 * Executes a basic query using the EYE Reasoner and default build of SWIPL
 * @param data The data for the query as RDF/JS quads
 * @param query The query as RDF/JS quads
 * @returns The result of the query as RDF/JS quads
 */
export function basicQuery(
  data: Quad[],
  query: Quad[],
): Promise<{ result: Quad[], proof: Quad[] }> {
  return executeBasicEyeQueryQuads(SWIPL, data, query);
}
