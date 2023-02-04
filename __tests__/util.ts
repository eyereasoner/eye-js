/* eslint-disable default-case */
import { Quad } from '@rdfjs/types';
import 'jest-rdf';
import { DataFactory, Parser } from 'n3';
import { data, query, result } from '../data/socrates';
import { basicQuery } from '../dist';

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
    it('should execute the basicQuery [quad input quad output]', () => expect<Promise<Quad[]>>(
      basicQuery(dataQuads, queryQuads),
    ).resolves.toBeRdfIsomorphic(resultQuads));

    it('should execute the basicQuery [quad input explicit quad output]', () => expect<Promise<Quad[]>>(
      basicQuery(dataQuads, queryQuads, { outputType: 'quads' }),
    ).resolves.toBeRdfIsomorphic(resultQuads));

    it('should execute the basicQuery [quad input explicit string output]', async () => {
      const resultStr: string = await basicQuery(dataQuads, queryQuads, { outputType: 'string' });
      const quads = (new Parser({ format: 'text/n3' })).parse(resultStr);
      expect<Quad[]>(quads).toBeRdfIsomorphic(quads);
    });

    it('should execute the basicQuery [string quad string output]', async () => {
      const resultStr: string = await basicQuery(data, query);
      const quads = (new Parser({ format: 'text/n3' })).parse(resultStr);
      expect<Quad[]>(quads).toBeRdfIsomorphic(quads);
    });

    it('should execute the basicQuery [string quad explicit string output]', async () => {
      const resultStr: string = await basicQuery(data, query, { outputType: 'string' });
      const quads = (new Parser({ format: 'text/n3' })).parse(resultStr);
      expect<Quad[]>(quads).toBeRdfIsomorphic(quads);
    });

    it('should execute the basicQuery [string quad explicit quad output]', () => expect<Promise<Quad[]>>(
      basicQuery(data, query, { outputType: 'quads' }),
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
