/* eslint-disable default-case */
import type { Quad } from '@rdfjs/types';
import 'jest-rdf';
import { DataFactory, Parser, Store } from 'n3';
import { data, query, queryAll, result } from '../data/socrates';
import { n3reasoner } from '../dist';
import { data as blogicData, result as blogicResult } from '../data/blogic';

const parser = new Parser({ format: 'text/n3' });

export const queryQuads = parser.parse(query);
export const queryAllQuads = parser.parse(queryAll)
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
  describe('testing n3reasoner', () => {
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

    it('should execute the n3reasoner without query quads [output: deductive closure]', () => expect(
      n3reasoner(dataQuads, queryAllQuads),
    ).resolves.toBeRdfIsomorphic([...resultQuads, DataFactory.quad(
      DataFactory.namedNode('http://example.org/socrates#Human'),
      DataFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
      DataFactory.namedNode('http://example.org/socrates#Mortal'),
    )]));

    it('should execute the n3reasoner without query quads [output: deductive closure and rules]', async () => {
      const res: Quad[] = await n3reasoner(dataQuads, undefined, { output: 'deductive_closure_plus_rules' });
      const closure: Quad[] = [...resultQuads, DataFactory.quad(
        DataFactory.namedNode('http://example.org/socrates#Human'),
        DataFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
        DataFactory.namedNode('http://example.org/socrates#Mortal'),
      )];

      const store = new Store(res);
      
      expect(new Store(res)).toBeRdfDatasetContaining(...closure);
      // 4 For the rule
      expect(store.size).toEqual(closure.length + 4);
    });

    it('should execute the n3reasoner without query quads [output: grounded deductive closure and rules]', async () => {
      const res: Quad[] = await n3reasoner(dataQuads, undefined, { output: 'grounded_deductive_closure_plus_rules' });

      const store = new Store(res);
      
      expect(new Store(res)).toBeRdfDatasetContaining(DataFactory.quad(
        DataFactory.namedNode('http://example.org/socrates#Human'),
        DataFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
        DataFactory.namedNode('http://example.org/socrates#Mortal'),
      ),
      DataFactory.quad(
        DataFactory.namedNode('http://example.org/socrates#Socrates'),
        DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        DataFactory.namedNode('http://example.org/socrates#Human'),
      ));
      // 4 for the rule
      expect(store.size).toEqual(2 + 4);
    });

    it('should reject n3reasoner on invalid output', async () => {
      // @ts-expect-error
      const res = n3reasoner(dataQuads, undefined, { output: '' });
      
      expect(res).rejects.toThrowError()
    });

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

    it('should throw error when eye cannot process the query', async () => {
      expect(n3reasoner('invalid', 'invalid')).rejects.toThrowError();
    });
  });

  describe('testing basicQuery', () => {
    it('should execute the basicQuery', () => expect(
      n3reasoner(dataQuads, queryQuads),
    ).resolves.toBeRdfIsomorphic(resultQuads));

    it('should execute the basicQuery without query quads', () => expect(
      n3reasoner(dataQuads),
    ).resolves.toBeRdfIsomorphic([...resultQuads, DataFactory.quad(
      DataFactory.namedNode('http://example.org/socrates#Human'),
      DataFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
      DataFactory.namedNode('http://example.org/socrates#Mortal'),
    )]));

    it('should execute the basicQuery without query quads', () => expect(
      n3reasoner(dataQuads, undefined, undefined),
    ).resolves.toBeRdfIsomorphic([...resultQuads, DataFactory.quad(
      DataFactory.namedNode('http://example.org/socrates#Human'),
      DataFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
      DataFactory.namedNode('http://example.org/socrates#Mortal'),
    )]));

    it('should execute the basicQuery [quad input quad output]', () => expect<Promise<Quad[]>>(
      n3reasoner(dataQuads, queryQuads),
    ).resolves.toBeRdfIsomorphic(resultQuads));

    it('should execute the basicQuery [quad input quad output]', () => expect<Promise<Quad[]>>(
      n3reasoner(dataQuads, queryQuads),
    ).resolves.toBeRdfIsomorphic(resultQuads));

    it('should execute the basicQuery [quad input explicit quad output]', () => expect<Promise<Quad[]>>(
      n3reasoner(dataQuads, queryQuads, { outputType: 'quads' }),
    ).resolves.toBeRdfIsomorphic(resultQuads));

    it('should execute the basicQuery [quad input explicit string output]', async () => {
      const resultStr: string = await n3reasoner(dataQuads, queryQuads, { outputType: 'string' });
      const quads = (new Parser({ format: 'text/n3' })).parse(resultStr);
      expect<Quad[]>(quads).toBeRdfIsomorphic(resultQuads);
    });

    it('should execute the basicQuery [string input string output]', async () => {
      const resultStr: string = await n3reasoner(data, query);
      const quads = (new Parser({ format: 'text/n3' })).parse(resultStr);
      expect<Quad[]>(quads).toBeRdfIsomorphic(resultQuads);
    });

    it('should execute the basicQuery [string input explicit string output]', async () => {
      const resultStr: string = await n3reasoner(data, query, { outputType: 'string' });
      const quads = (new Parser({ format: 'text/n3' })).parse(resultStr);
      expect<Quad[]>(quads).toBeRdfIsomorphic(resultQuads);
    });

    it('should execute the basicQuery [string input explicit quad output]', () => expect<Promise<Quad[]>>(
      n3reasoner(data, query, { outputType: 'quads' }),
    ).resolves.toBeRdfIsomorphic(resultQuads));

    it('should execute the basicQuery without query quads [output: undefined]', () => expect(
      n3reasoner(dataQuads, undefined, { output: undefined }),
    ).resolves.toBeRdfIsomorphic([]));

    it('should execute the basicQuery without query quads [output: derivations]', () => expect(
      n3reasoner(dataQuads, undefined, { output: 'derivations' }),
    ).resolves.toBeRdfIsomorphic([DataFactory.quad(
      DataFactory.namedNode('http://example.org/socrates#Socrates'),
      DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
      DataFactory.namedNode('http://example.org/socrates#Mortal'),
    )]));

    it('should execute the basicQuery without query quads [output: deductive closure]', () => expect(
      n3reasoner(dataQuads, undefined, { output: 'deductive_closure' }),
    ).resolves.toBeRdfIsomorphic([...resultQuads, DataFactory.quad(
      DataFactory.namedNode('http://example.org/socrates#Human'),
      DataFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
      DataFactory.namedNode('http://example.org/socrates#Mortal'),
    )]));
  });
}
