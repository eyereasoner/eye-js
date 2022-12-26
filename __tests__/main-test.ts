import { DataFactory as DF } from 'n3';
import { basicQuery } from '../dist';
import 'jest-rdf';

const query = [
  DF.quad(
    DF.namedNode('http://example.org/socrates#Socrates'),
    DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
    DF.variable('WHAT'),
    DF.blankNode('b1'),
  ),
  DF.quad(
    DF.namedNode('http://example.org/socrates#Socrates'),
    DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
    DF.variable('WHAT'),
    DF.blankNode('b2'),
  ),
  DF.quad(
    DF.blankNode('b1'),
    DF.namedNode('http://www.w3.org/2000/10/swap/log#implies'),
    DF.blankNode('b2'),
  ),
];

const data = [
  DF.quad(
    DF.namedNode('http://example.org/socrates#Socrates'),
    DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
    DF.namedNode('http://example.org/socrates#Human'),
  ),
  DF.quad(
    DF.namedNode('http://example.org/socrates#Human'),
    DF.namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
    DF.namedNode('http://example.org/socrates#Mortal'),
  ),
  DF.quad(
    DF.variable('A'),
    DF.namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
    DF.variable('B'),
    DF.blankNode('b1'),
  ),
  DF.quad(
    DF.variable('S'),
    DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
    DF.variable('A'),
    DF.blankNode('b1'),
  ),
  DF.quad(
    DF.variable('S'),
    DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
    DF.variable('B'),
    DF.blankNode('b2'),
  ),
  DF.quad(
    DF.blankNode('b1'),
    DF.namedNode('http://www.w3.org/2000/10/swap/log#implies'),
    DF.blankNode('b2'),
  ),
];

it('Should execute the basic query', () => expect(basicQuery(data, query).then((r) => r.result)).resolves.toBeRdfIsomorphic([
  DF.quad(
    DF.namedNode('http://example.org/socrates#Socrates'),
    DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
    DF.namedNode('http://example.org/socrates#Mortal'),
  ),
  DF.quad(
    DF.namedNode('http://example.org/socrates#Socrates'),
    DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
    DF.namedNode('http://example.org/socrates#Human'),
  ),
]));
