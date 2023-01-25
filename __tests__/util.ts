/* eslint-disable default-case */
import { DataFactory, Parser } from 'n3';
import { basicQuery } from '../dist';
import 'jest-rdf';
import { query, data, result } from '../data/socrates';

const parser = new Parser({ format: 'text/n3' });

export const queryQuads = parser.parse(query);
export const dataQuads = parser.parse(data);
export const resultQuads = parser.parse(result);

export function mockFetch(...args: Parameters<typeof fetch>): ReturnType<typeof fetch> {
  switch (args[0]) {
    case 'http://example.org/data.n3':
      return {} as any; // Promise.resolve(new Response(data))
    case 'http://example.org/result.n3':
      return {} as any; // Promise.resolve(new Response(data))
  }
  throw new Error(`Unexpected URL: ${args[0]}`);
}

export function universalTests() {
  describe('testing basic module utilities', () => {
    it('should execute the basicQuery', () => expect(
      basicQuery(dataQuads, queryQuads),
    ).resolves.toBeRdfIsomorphic(resultQuads));

    it('should execute the basicQuery without query quads', () => expect(
      basicQuery(dataQuads),
    ).resolves.toBeRdfIsomorphic([...resultQuads, DataFactory.quad(
      DataFactory.namedNode('http://example.org/socrates#Human'),
      DataFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
      DataFactory.namedNode('http://example.org/socrates#Mortal'),
    )]));
  });
}
