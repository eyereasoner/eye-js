/**
 * @jest-environment node
 */
import type { Quad } from '@rdfjs/types';
import 'jest-rdf';
import { DataFactory, Parser } from 'n3';
import { universalTests } from '../__test_utils__/util';
import { n3reasoner } from '../dist';

universalTests();

// Regression tests for https://github.com/eyereasoner/eye-js/issues/1642
// (parse error when the query result contains quads / named graphs)
describe('testing n3reasoner with quad (named graph) results', () => {
  const quadData = '<http://dbpedia.org/resource/Belgium> <http://dbpedia.org/ontology/PopulatedPlace/areaTotal> "30528.189856530433"^^<http://dbpedia.org/datatype/squareKilometre> <http://example.com/graph>.';
  const quadRule = '{ ?s ?p ?o ?g } => { ?s ?p ?o ?g }.';
  const expectedQuads = [
    DataFactory.quad(
      DataFactory.namedNode('http://dbpedia.org/resource/Belgium'),
      DataFactory.namedNode('http://dbpedia.org/ontology/PopulatedPlace/areaTotal'),
      DataFactory.literal('30528.189856530433', DataFactory.namedNode('http://dbpedia.org/datatype/squareKilometre')),
      DataFactory.namedNode('http://example.com/graph'),
    ),
  ];

  it('should preserve the graph term [outputType: quads]', async () => {
    const quads: Quad[] = await n3reasoner(quadData, quadRule, { outputType: 'quads' });
    expect(quads).toHaveLength(1);
    expect(quads[0].graph.termType).toEqual('NamedNode');
    expect(quads[0].graph.value).toEqual('http://example.com/graph');
    expect(quads).toBeRdfIsomorphic(expectedQuads);
  });

  it('should preserve the graph term [outputType: string]', async () => {
    const resultStr: string = await n3reasoner(quadData, quadRule, { outputType: 'string' });
    expect<Quad[]>(new Parser().parse(resultStr)).toBeRdfIsomorphic(expectedQuads);
  });
});
