import { Parser, DataFactory as DF, Writer } from 'n3';
import { mapTerms } from 'rdf-terms';
import { write } from './dist/n3Writer.temp'
import { n3reasoner } from './dist';

const parser = new Parser({ format: 'text/n3' });
const writer = new Writer({ format: 'text/n3' })

// function transform(s: string) {
//   return writer.quadsToString(
//     parser.parse(s)
//     .map((quad) => mapTerms(quad, (term) => (term.termType === 'BlankNode' ? DF.blankNode(term.value.replace( /^(n3-\d+)?\./, '')) : term)))
//   )
//   // return write(parser.parse(s)
//   // .map((quad) => mapTerms(quad, (term) => (term.termType === 'BlankNode' ? DF.blankNode(term.value.replace( /^(n3-\d+)?\./, '')) : term)))
//   // )
// }

// let input = `@prefix log: <http://www.w3.org/2000/10/swap/log#>.
// @prefix : <http://example.org/ns#>.

// (_:A _:B) :p {
//     () log:onQuerySurface {
//         _:A :pair (_:B).
//     }.
// }.`

// const quads = parser.parse(input)
//   .map((quad) => mapTerms(quad, (term) => (term.termType === 'BlankNode' ? DF.blankNode(term.value.replace( /^(n3-\d+)?\./, '')) : term)))

// // input = transform(input)

let input = `
@prefix log: <http://www.w3.org/2000/10/swap/log#>.
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix : <http://example.org/ns#>.

(_:A _:B) log:onNegativeSurface {
  () log:onQuerySurface {
    _:A :pair [ rdf:first _:B; rdf:rest rdf:nil ] .
    _:A :pair (_:B) .
  } . 
} .
`

// console.log(write(quads))

n3reasoner(input, undefined, { blogic: true })
// 