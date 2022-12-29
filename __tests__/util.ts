/* eslint-disable default-case */
import { Parser } from 'n3';
import { basicQuery } from '../dist';
import 'jest-rdf';

export const query = `
@prefix : <http://example.org/socrates#>.

{:Socrates a ?WHAT} => {:Socrates a ?WHAT}.
`;

export const data = `
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix : <http://example.org/socrates#>.

:Socrates a :Human.
:Human rdfs:subClassOf :Mortal.

{?A rdfs:subClassOf ?B. ?S a ?A} => {?S a ?B}.
`;

export const result = `
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix : <http://example.org/socrates#>.

:Socrates a :Human.
:Socrates a :Mortal.
`;

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
    it('should execute the basicQuery', () => expect(basicQuery(dataQuads, queryQuads)
      .then((r) => r.result)).resolves.toBeRdfIsomorphic(resultQuads));
  });
}
