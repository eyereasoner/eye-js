/* eslint-disable default-case */
import type { Quad } from '@rdfjs/types';
import 'jest-rdf';
import { DataFactory, Parser, Store } from 'n3';
import { data, dataSplit, dataStar, query, queryAll, result, trig as socratesTrig } from '../data/socrates';
import { n3reasoner, linguareasoner } from '../dist';
import { data as blogicData, result as blogicResult } from '../data/blogic';
import { data as regexData, result as regexResult } from '../data/regex';
import { askCallback, askQuery, askResult } from '../data/ask';
import { query as surfaceQuery } from '../data/surface';


const parser = new Parser({ format: 'text/n3' });
// Workaround for https://github.com/rdfjs/N3.js/issues/324
// @ts-expect-error
parser._supportsRDFStar = true;

export const queryQuads = parser.parse(query);
export const queryAllQuads = parser.parse(queryAll)
export const dataQuads = parser.parse(data);
export const dataStarQuads = parser.parse(dataStar);
export const resultQuads = parser.parse(result);
export const resultBlogicQuads = parser.parse(blogicResult);
export const askResultQuads = parser.parse(askResult);
export const surfaceQueryQuads = parser.parse(surfaceQuery);

export function mockFetch(...args: Parameters<typeof fetch>): ReturnType<typeof fetch> {
  switch (args[0]) {
    case 'http://example.org/data.n3':
      return {} as any; // Promise.resolve(new Response(data))
    case 'http://example.org/result.n3':
      return {} as any; // Promise.resolve(new Response(data))
  }
  throw new Error(`Unexpected URL: ${args[0]}`);
}

const socratesMortal = DataFactory.quad(
  DataFactory.namedNode('http://example.org/socrates#Socrates'),
  DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
  DataFactory.namedNode('http://example.org/socrates#Mortal'),
)

const socratesHuman = DataFactory.quad(
  DataFactory.namedNode('http://example.org/socrates#Socrates'),
  DataFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
  DataFactory.namedNode('http://example.org/socrates#Human'),
)

const humanSubclassMortal = DataFactory.quad(
  DataFactory.namedNode('http://example.org/socrates#Human'),
  DataFactory.namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
  DataFactory.namedNode('http://example.org/socrates#Mortal'),
)

export function universalTests() {
  let log: jest.SpyInstance<void, [message?: any, ...optionalParams: any[]], any>;
  let warn: jest.SpyInstance<void, [message?: any, ...optionalParams: any[]], any>;
  let err: jest.SpyInstance<void, [message?: any, ...optionalParams: any[]], any>;

  beforeEach(() => {
    log = jest.spyOn(console, 'log');
    warn = jest.spyOn(console, 'warn');
    err = jest.spyOn(console, 'error');
  });

  afterEach(() => {
    expect(log).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(err).not.toHaveBeenCalled();
  });

  describe('testing linguareasoner', () => {
    it('should execute the socrates example', () => expect<Promise<Store>>(
      linguareasoner(socratesTrig)
        .then(res => new Store(new Parser({ format: 'trig' }).parse(res))),
    ).resolves.toBeRdfDatasetContaining(socratesMortal));
    it('should execute the socrates example with quads', () => expect<Promise<Store>>(
      linguareasoner(socratesTrig, undefined, {  outputType: 'quads' }).then(res => new Store(res)),
    ).resolves.toBeRdfDatasetContaining(socratesMortal));
  });

  describe('testing n3reasoner', () => {
    it('should execute the n3reasoner on rdf-star i/o', () => expect<Promise<Quad[]>>(
      n3reasoner(dataStarQuads),
    ).resolves.toBeRdfIsomorphic(resultQuads));

    it('should execute the n3reasoner on ask queries', () => expect<Promise<Quad[]>>(
      n3reasoner([], askQuery, { cb: askCallback }),
    ).resolves.toBeRdfIsomorphic(askResultQuads));

    it('should execute the n3reasoner [quad input quad output]', () => expect<Promise<Quad[]>>(
      n3reasoner(dataStarQuads, queryQuads),
    ).resolves.toBeRdfIsomorphic(resultQuads));

    it('should execute the n3reasoner [quad input quad output]', () => expect<Promise<Quad[]>>(
      n3reasoner(dataStarQuads, undefined, { output: 'deductive_closure' }),
    ).resolves.toBeRdfIsomorphic([...resultQuads, DataFactory.quad(
      socratesHuman,
      DataFactory.namedNode('http://example.org/socrates#is'),
      DataFactory.literal('true', DataFactory.namedNode('http://www.w3.org/2001/XMLSchema#boolean')),
    ), humanSubclassMortal]));

    it('should execute the n3reasoner [quad input quad output] [output: undefined]', () => expect<Promise<Quad[]>>(
      n3reasoner(dataQuads, queryQuads, { output: undefined }),
    ).resolves.toBeRdfIsomorphic(resultQuads));

    it('should execute the built-in "log:uuid".', async () =>  {
      const queryString = `@prefix : <urn:example:> .
      @prefix log: <http://www.w3.org/2000/10/swap/log#> .
      {   
          :test log:uuid ?Y .
      }
      => 
      { 
          :Result :uuid ?Y .
      } .`

      const output = await n3reasoner('', queryString);
      const outputQuads = parser.parse(output);
      expect(outputQuads.length).toBe(1);
      const createdUUID = outputQuads[0].object.value;
      const uuidRegexMatch = createdUUID.match(/^[0-9a-fA-F]{8}(\b-[0-9a-fA-F]{4}){3}\b-[0-9a-fA-F]{12}$/gm)
      expect(uuidRegexMatch).not.toBe(null)
      expect(uuidRegexMatch![0]).toBe(createdUUID)

    })

    it('should execute the n3reasoner [quad input quad output] [output: deductive_closure]', () => expect<Promise<string>>(
      n3reasoner(dataQuads, '{?S a ?O} => {?S a ?O}.', { output: 'deductive_closure', outputType: 'string' }),
    ).rejects.toThrowError());

    it('should execute the n3reasoner [quad input quad output] [output: derivations]', () => expect<Promise<Quad[]>>(
      n3reasoner(dataQuads, queryQuads, { output: 'derivations' }),
    ).rejects.toThrowError());

    it('should execute the n3reasoner [quad input quad output] [output: deductive_closure_plus_rules]', () => expect<Promise<Quad[]>>(
      n3reasoner(dataQuads, queryQuads, { output: 'deductive_closure_plus_rules' }),
    ).rejects.toThrowError());

    it('should execute the n3reasoner [quad input quad output] [output: grounded_deductive_closure_plus_rules]', () => expect<Promise<Quad[]>>(
      n3reasoner(dataQuads, queryQuads, { output: 'grounded_deductive_closure_plus_rules' }),
    ).rejects.toThrowError());

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

    it('should execute the n3reasoner [string single list input string output]', async () => {
      const resultStr: string = await n3reasoner([data], query);
      const quads = (new Parser({ format: 'text/n3' })).parse(resultStr);
      expect<Quad[]>(quads).toBeRdfIsomorphic(resultQuads);
    });

    it('should execute the n3reasoner [string input explicit string output]', async () => {
      const resultStr: string = await n3reasoner(data, query, { outputType: 'string' });
      const quads = (new Parser({ format: 'text/n3' })).parse(resultStr);
      expect<Quad[]>(quads).toBeRdfIsomorphic(resultQuads);
    });

    it('should execute the n3reasoner [string single list input explicit string output]', async () => {
      const resultStr: string = await n3reasoner(data, query, { outputType: 'string' });
      const quads = (new Parser({ format: 'text/n3' })).parse(resultStr);
      expect<Quad[]>(quads).toBeRdfIsomorphic(resultQuads);
    });

    it('should execute the n3reasoner [string input explicit quad output]', () => expect<Promise<Quad[]>>(
      n3reasoner(data, query, { outputType: 'quads' }),
    ).resolves.toBeRdfIsomorphic(resultQuads));

    it('should execute the n3reasoner [string single list input explicit quad output]', () => expect<Promise<Quad[]>>(
      n3reasoner([data], query, { outputType: 'quads' }),
    ).resolves.toBeRdfIsomorphic(resultQuads));

    it('should execute the n3reasoner [string single list input explicit quad output]', () => expect<Promise<Quad[]>>(
      n3reasoner(dataSplit, query, { outputType: 'quads' }),
    ).resolves.toBeRdfIsomorphic(resultQuads));

    it('should execute the n3reasoner [string single list input including empty files explicit quad output]', () => expect<Promise<Quad[]>>(
      n3reasoner(["\n", ...dataSplit, "\n"], query, { outputType: 'quads' }),
    ).resolves.toBeRdfIsomorphic(resultQuads));

    it('should execute the n3reasoner without query quads', () => expect(
      n3reasoner(dataQuads),
    ).resolves.toBeRdfIsomorphic([socratesMortal]));

    it('should execute the n3reasoner and undefined query quads', () => expect(
      n3reasoner(dataQuads, undefined),
    ).resolves.toBeRdfIsomorphic([socratesMortal]));

    it('should execute the n3reasoner and undefined query quads and undefined options', () => expect(
      n3reasoner(dataQuads, undefined, undefined),
    ).resolves.toBeRdfIsomorphic([socratesMortal]));

    it('should execute the n3reasoner without query quads [output: undefined]', () => expect(
      n3reasoner(dataQuads, undefined, { output: undefined }),
    ).resolves.toBeRdfIsomorphic([socratesMortal]));

    it('should execute the n3reasoner without query quads [output: derivations]', () => expect(
      n3reasoner(dataQuads, undefined, { output: 'derivations' }),
    ).resolves.toBeRdfIsomorphic([socratesMortal]));

    it('should execute the n3reasoner without query quads [output: deductive closure]', () => expect(
      n3reasoner(dataQuads, undefined, { output: 'deductive_closure' }),
    ).resolves.toBeRdfIsomorphic([...resultQuads, humanSubclassMortal]));

    it('should execute the n3reasoner without query quads [output: deductive closure]', () => expect(
      n3reasoner(dataQuads, queryAllQuads),
    ).resolves.toBeRdfIsomorphic([...resultQuads, humanSubclassMortal]));

    it('should execute the n3reasoner without query quads [output: deductive closure and rules]', async () => {
      const res: Quad[] = await n3reasoner(dataQuads, undefined, { output: 'deductive_closure_plus_rules' });
      const closure: Quad[] = [...resultQuads, humanSubclassMortal];

      const store = new Store(res);
      
      expect(new Store(res)).toBeRdfDatasetContaining(...closure);
      // 4 For the rule
      expect(store.size).toEqual(closure.length + 4);
    });

    it('should execute the n3reasoner without query quads [output: grounded deductive closure and rules]', async () => {
      const res: Quad[] = await n3reasoner(dataQuads, undefined, { output: 'grounded_deductive_closure_plus_rules' });

      const store = new Store(res);
      
      expect(new Store(res)).toBeRdfDatasetContaining(humanSubclassMortal, socratesHuman);
      // 4 for the rule
      expect(store.size).toEqual(2 + 4);
    });

    it('should execute the n3reasoner on a query string requiring regex', 
      () => expect(n3reasoner(regexData)).resolves.toEqual(regexResult));

    it('should reject n3reasoner on invalid query', async () => {
      const res = n3reasoner(dataQuads, 'invalid');
      
      expect(res).rejects.toThrowError()
    });

    it('should reject n3reasoner on invalid output', async () => {
      // @ts-expect-error
      const res = n3reasoner(dataQuads, undefined, { output: '' });
      
      expect(res).rejects.toThrowError()
    });

    it('should reject n3reasoner on blogic and any output', async () => {
      // @ts-expect-error
      const res = n3reasoner(dataQuads, undefined, { output: 'dervations' });
      
      expect(res).rejects.toThrowError()
    });


    it('should reject n3reasoner on query string and blogic', async () => {
      const res = n3reasoner(dataQuads, '{?S ?P ?O} => {?S ?P ?O}');
      
      expect(res).rejects.toThrowError()
    });
    it.skip('should execute the n3reasoner using blogic', async () => {
      const resultStr: string = await n3reasoner(blogicData);
      const quads = (new Parser({ format: 'text/n3' })).parse(resultStr);
      expect<Quad[]>(quads).toBeRdfIsomorphic(resultBlogicQuads);
    });

    it('should throw error when eye cannot process the query', async () => {
      await expect(n3reasoner('invalid', 'invalid')).rejects.toThrowError('Error while executing query');
    });

    it('should execute the n3reasoner on surface query', async () => {
      await expect(n3reasoner(surfaceQueryQuads)).rejects.toThrow(/inference_fuse/);
    });

    it('should execute the n3reasoner on surface query [bnodeRelabeling: false]', async () => {
      await expect(n3reasoner(surfaceQueryQuads, undefined, { bnodeRelabeling: false })).rejects.toThrow(/inference_fuse/);
    });
  });
}
