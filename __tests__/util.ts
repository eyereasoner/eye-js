/* eslint-disable default-case */
import type { Quad } from '@rdfjs/types';
import 'jest-rdf';
import { DataFactory, Parser } from 'n3';
import { data, query, result } from '../data/socrates';
import { basicQuery, n3reasoner } from '../dist';
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
  // Each instantiation of SWIPL adds a new listener to the global
  // process, see:
  // - https://github.com/rla/npm-swipl-wasm/issues/22
  // - https://github.com/emscripten-core/emscripten/issues/18659
  process.setMaxListeners(100);

  describe('testing n3reasoners', () => {
    it('should execute the n3reasoner [quad input quad output]', () => expect<Promise<Quad[]>>(
      n3reasoner(dataQuads, queryQuads),
    ).resolves.toBeRdfIsomorphic(resultQuads));

    it('should execute the n3reasoner [quad input explicit quad output]', () => expect<Promise<Quad[]>>(
      n3reasoner(dataQuads, queryQuads, { outputType: 'quads' }),
    ).resolves.toBeRdfIsomorphic(resultQuads));

    it('should execute the n3reasoner [quad input explicit string output]', async () => {
      const resultStr: string = await n3reasoner(dataQuads, queryQuads, { outputType: 'string' });
      const quads = (new Parser({ format: 'text/n3' })).parse(resultStr);
      expect<Quad[]>(quads).toBeRdfIsomorphic(resultQuads);
    });

    it('should execute the n3reasoner [string input string output]', async () => {
      const resultStr: string = await n3reasoner(data, query);
      const quads = (new Parser({ format: 'text/n3' })).parse(resultStr);
      expect<Quad[]>(quads).toBeRdfIsomorphic(resultQuads);
    });

    it('should execute the n3reasoner [string input explicit string output]', async () => {
      const resultStr: string = await n3reasoner(data, query, { outputType: 'string' });
      const quads = (new Parser({ format: 'text/n3' })).parse(resultStr);
      expect<Quad[]>(quads).toBeRdfIsomorphic(resultQuads);
    });

    it('should execute the n3reasoner [string input explicit quad output]', () => expect<Promise<Quad[]>>(
      n3reasoner(data, query, { outputType: 'quads' }),
    ).resolves.toBeRdfIsomorphic(resultQuads));

    it('should execute the n3reasoner without query quads', () => expect(
      n3reasoner(dataQuads),
    ).resolves.toBeRdfIsomorphic([]));

    it('should execute the n3reasoner without query quads [output: undefined]', () => expect(
      n3reasoner(dataQuads, undefined, { output: undefined }),
    ).resolves.toBeRdfIsomorphic([]));

    it('should execute the n3reasoner without query quads [output: derivations]', () => expect(
      n3reasoner(dataQuads, undefined, { output: 'derivations' }),
    ).resolves.toBeRdfIsomorphic([DataFactory.quad(
      DataFactory.namedNode('http://example.org/socrates#Socrates'),
      DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
      DataFactory.namedNode('http://example.org/socrates#Mortal'),
    )]));

    it('should execute the n3reasoner without query quads [output: deductive closure]', () => expect(
      n3reasoner(dataQuads, undefined, { output: 'deductive_closure' }),
    ).resolves.toBeRdfIsomorphic([...resultQuads, DataFactory.quad(
      DataFactory.namedNode('http://example.org/socrates#Human'),
      DataFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
      DataFactory.namedNode('http://example.org/socrates#Mortal'),
    )]));

    it('should execute the n3reasoner using blogic', async () => {
      const resultStr: string = await n3reasoner(blogicData, undefined, { blogic: true });
      const quads = (new Parser({ format: 'text/n3' })).parse(resultStr);
      expect<Quad[]>(quads).toBeRdfIsomorphic(resultBlogicQuads);
    });

    it('should fail executing blogic using the n3reasoner without blogic enabled', async () => {
      const resultStr: string = await n3reasoner(blogicData, undefined, { blogic: false });
      const quads = (new Parser({ format: 'text/n3' })).parse(resultStr);
      expect<Quad[]>(quads).not.toBeRdfIsomorphic(resultBlogicQuads);
    });
  });

  describe('testing basicQuery', () => {
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

    it('should execute the basicQuery without query quads', () => expect(
      basicQuery(dataQuads, undefined, undefined),
    ).resolves.toBeRdfIsomorphic([...resultQuads, DataFactory.quad(
      DataFactory.namedNode('http://example.org/socrates#Human'),
      DataFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
      DataFactory.namedNode('http://example.org/socrates#Mortal'),
    )]));

    it('should execute the basicQuery [quad input quad output]', () => expect<Promise<Quad[]>>(
      basicQuery(dataQuads, queryQuads),
    ).resolves.toBeRdfIsomorphic(resultQuads));

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

    it('should execute the basicQuery without query quads [output: undefined]', () => expect(
      basicQuery(dataQuads, undefined, { output: undefined }),
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

    const q = `<<<http://example.org/a> <http://example.org/b> <http://example.org/c>>> <http://example.org/is> true . { ?S <http://example.org/is> true } => { ?S <http://example.org/certainty> 1 } .`;
    const r = "<<<http://example.org/a> <http://example.org/b> <http://example.org/c>>> <http://example.org/is> true.\n" +
    "{?U_0 <http://example.org/is> true} => {?U_0 <http://example.org/certainty> 1}.\n"+
    "<<<http://example.org/a> <http://example.org/b> <http://example.org/c>>> <http://example.org/certainty> 1 .\n\n";

    it('should execute the basicQuery without query quads [output: deductive closure]', () => expect(
      basicQuery(q, undefined, { output: 'deductive_closure_plus_rules' })
    ).resolves.toEqual(r));

    it('should execute the basicQuery without query quads [output: deductive closure]', () => expect(
      basicQuery((new Parser({ format: 'text/n3-star' })).parse(q), undefined, { output: 'deductive_closure_plus_rules' })
    ).resolves.toBeRdfIsomorphic((new Parser({ format: 'text/n3' })).parse(r)));
  });
}
