
// This is a workaround for https://github.com/rdfjs/N3.js/issues/316
import { Quad, Term } from '@rdfjs/types';
import { DataFactory as DF, Store, Writer } from 'n3';

function isQuoted(term: Term, store: Store) {
  return term.termType === 'BlankNode' && store.getQuads(null, null, null, term).length > 0;
}

export class N3Writer {
  private _writer: any = new Writer();

  _encodePredicate(term: Term): string {
    if (term.termType === 'NamedNode') {
      switch (term.value) {
        case 'http://www.w3.org/2000/10/swap/log#implies':
          return '=>';
        case 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type':
          return 'a'
      }
    }
    return this._writer._encodeIriOrBlank(term);
  }

  _encodeSubject(entity: Term, store: Store): string {
    if (isQuoted(entity, store)) {
      return `{${this.quadsStoreToString(store, entity)}}`
    }
    return this._writer._encodeSubject(entity)
  }

  _encodeObject(entity: Term, store: Store): string {
    if (isQuoted(entity, store)) {
      return `{${this.quadsStoreToString(store, entity)}}`
    }
    return this._writer._encodeObject(entity)
  }

  // ### `quadToString` serializes a quad as a string
  quadToString(t: Quad, store: Store): string {
    return `${
        this._encodeSubject(t.subject, store)
      } ${
        this._encodePredicate(t.predicate as any)
      } ${
        this._encodeObject(t.object, store)
      }`;
  }

  // ### `quadsToString` serializes an array of quads as a string
  quadsStoreToString(store: Store, graph: Term = DF.defaultGraph()): string {
    return store.getQuads(null, null, null, graph)
      .map(t => this.quadToString(t, store))
      .join(' . ') + ' . ';
  }

  quadsToString(quads: Quad[] | Store): string {
    return this.quadsStoreToString(Array.isArray(quads) ? new Store(quads) : quads)
  }
}

export function write(quads: Quad[] | Store) {
  return (new N3Writer).quadsToString(quads);
}
