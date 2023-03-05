
// This is a workaround for https://github.com/rdfjs/N3.js/issues/316
import { Quad, Term } from '@rdfjs/types';
import { DataFactory as DF, Store, Writer } from 'n3';

function isQuoted(term: Term, store: Store) {
  return term.termType === 'BlankNode' && store.getQuads(null, null, null, term).length > 0;
}

export class N3Writer {
  private _writer: any = new Writer();

  _encodeTerm(entity: Term, store: Store): string {
    if (isQuoted(entity, store)) {
      return `{${this.quadsStoreToString(store, entity)}}`
    }
    return this._writer._encodeTerm(entity)
  }

  // ### `quadToString` serializes a quad as a string
  quadToString(t: Quad, store: Store): string {
    return `${
        this._encodeTerm(t.subject, store)
      } ${
        this._encodeTerm(t.predicate, store)
      } ${
        this._encodeTerm(t.object, store)
      }`;
  }

  // ### `quadsToString` serializes an array of quads as a string
  quadsStoreToString(store: Store, graph: Term = DF.defaultGraph()): string {
    return store.getQuads(null, null, null, graph)
      .map(t => this.quadToString(t, store))
      .join(' . ') + ' . ';
  }

  quadsToString(quads: Quad[]): string {
    return this.quadsStoreToString(new Store(quads))
  }
}

export function write(quads: Quad[]) {
  return (new N3Writer).quadsToString(quads);
}
