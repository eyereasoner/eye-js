import { Parser, DataFactory as DF, Writer } from 'n3';
import { mapTerms } from 'rdf-terms';
import { write } from './dist/n3Writer.temp'
import { n3reasoner } from './dist';
import * as fs from 'fs';
import * as path from 'path';

const parser = new Parser({ format: 'text/n3' });

const data = fs.readFileSync(path.join(__dirname, 'gps.n3')).toString();

console.log(
  write(parser.parse(data)
.map((quad) => mapTerms(quad, (term) => (term.termType === 'BlankNode' ? DF.blankNode(term.value.replace( /^(n3-\d+)?\./, '')) : term))))
)

n3reasoner(write(parser.parse(data)
.map((quad) => mapTerms(quad, (term) => (term.termType === 'BlankNode' ? DF.blankNode(term.value.replace( /^(n3-\d+)?\./, '')) : term))))
, undefined, { blogic: true });
