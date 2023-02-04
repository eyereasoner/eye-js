/* eslint-disable default-case */
import type { Quad } from '@rdfjs/types';
import 'jest-rdf';
import { DataFactory, Parser } from 'n3';
import { data, query, result } from '../data/socrates';
import { basicQuery } from '../dist';
import { data as blogicData, result as blogicResult } from '../data/blogic';

const parser = new Parser({ format: 'text/n3' });

export const queryQuads = parser.parse(query);
export const dataQuads = parser.parse(data);
export const resultQuads = parser.parse(result);
export const resultBlogicQuads = parser.parse(blogicResult);

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
      expect<Quad[]>(quads).toBeRdfIsomorphic(resultQuads);
    });

    it('should execute the basicQuery [string input string output]', async () => {
      const resultStr: string = await basicQuery(data, query);
      const quads = (new Parser({ format: 'text/n3' })).parse(resultStr);
      expect<Quad[]>(quads).toBeRdfIsomorphic(resultQuads);
    });

    it('should execute the basicQuery [string input explicit string output]', async () => {
      const resultStr: string = await basicQuery(data, query, { outputType: 'string' });
      const quads = (new Parser({ format: 'text/n3' })).parse(resultStr);
      expect<Quad[]>(quads).toBeRdfIsomorphic(resultQuads);
    });

    it('should execute the basicQuery [string input explicit quad output]', () => expect<Promise<Quad[]>>(
      basicQuery(data, query, { outputType: 'quads' }),
    ).resolves.toBeRdfIsomorphic(resultQuads));

    it('should execute the basicQuery without query quads', () => expect(
      basicQuery(dataQuads),
    ).resolves.toBeRdfIsomorphic([]));

    it('should execute the basicQuery without query quads [output: none]', () => expect(
      basicQuery(dataQuads, undefined, { output: 'none' }),
    ).resolves.toBeRdfIsomorphic([]));

    it('should execute the basicQuery without query quads [output: derivations]', () => expect(
      basicQuery(dataQuads, undefined, { output: 'derivations' }),
    ).resolves.toBeRdfIsomorphic([DataFactory.quad(
      DataFactory.namedNode('http://example.org/socrates#Socrates'),
      DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
      DataFactory.namedNode('http://example.org/socrates#Mortal'),
    )]));

    it('should execute the basicQuery without query quads [output: deductive closure]', () => expect(
      basicQuery(dataQuads, undefined, { output: 'deductive_closure' }),
    ).resolves.toBeRdfIsomorphic([...resultQuads, DataFactory.quad(
      DataFactory.namedNode('http://example.org/socrates#Human'),
      DataFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
      DataFactory.namedNode('http://example.org/socrates#Mortal'),
    )]));

    it('should execute the basicQuery using blogic', async () => {
      const resultStr: string = await basicQuery(blogicData, undefined, { blogic: true });
      const quads = (new Parser({ format: 'text/n3' })).parse(resultStr);
      expect<Quad[]>(quads).toBeRdfIsomorphic(resultBlogicQuads);
    });

    it('should fail executing blogic using the basicQuery without blogic enabled', async () => {
      const resultStr: string = await basicQuery(blogicData, undefined, { blogic: false });
      const quads = (new Parser({ format: 'text/n3' })).parse(resultStr);
      expect<Quad[]>(quads).not.toBeRdfIsomorphic(resultBlogicQuads);
    });
  });
}
