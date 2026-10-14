/**
 * W3C N3 reasoning spec tests.
 *
 * Runs every entry of `manifest-reasoner.ttl` from the W3C N3 test suite
 * (https://github.com/w3c/N3) through `n3reasoner` and compares the derived
 * graph against the reference results using RDF isomorphism.
 *
 * The test suite is NOT committed to this repo — it is fetched at a pinned
 * commit into a git-ignored cache directory by `scripts/fetch-n3-tests.ts`
 * (run via `npm run spec:fetch`, which `npm run test:spec` invokes first, and
 * cached in CI with actions/cache). If the suite is missing, this file throws
 * with a pointer to that script.
 *
 * Known deviations between EYE and the reference results are recorded in
 * ./skip-list.json (with a reason each) so that this suite stays green while
 * deviations are triaged individually.
 */
import * as fs from 'fs';
import * as path from 'path';
import { DataFactory, Parser, Store } from 'n3';
import type { Quad, Term } from '@rdfjs/types';
import 'jest-rdf';
import { n3reasoner } from '../../dist';
import type { ICoreQueryOptions } from '../../dist';
import { cacheDir } from '../../scripts/fetch-n3-tests';

const { namedNode, quad } = DataFactory;

const TESTS_DIR = cacheDir;
const MANIFEST = 'manifest-reasoner.ttl';
// The base against which the manifest is published; used to resolve the
// mf:action / mf:result IRIs back to files in the fetched suite.
const MANIFEST_BASE = 'https://w3c.github.io/N3/tests/N3Tests/';
// `n3reasoner` loads string input into the reasoner as `data_0.n3s`, so this
// is the base that EYE resolves relative IRIs in the input against. Parsing
// the expected results against the same base keeps the two graphs aligned.
const REASONER_BASE = 'file:///data_0.n3s';

const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const MF = 'http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#';
const TEST = 'https://w3c.github.io/N3/tests/test.n3#';

/**
 * Rewrites every IRI starting with `from` so that it starts with `to`
 * instead (recursing into quoted triples). The reasoner sees its input as
 * `data_0.n3s` while the reference results resolve relative IRIs against the
 * original file name of the test input, so the two graphs only align after
 * rebasing one onto the other.
 */
function rebaseTerm(term: Term, from: string, to: string): Term {
  if (term.termType === 'NamedNode' && term.value.startsWith(from)) {
    return namedNode(`${to}${term.value.slice(from.length)}`);
  }
  if (term.termType === 'Quad') {
    const q = term as Quad;
    return quad(
      rebaseTerm(q.subject, from, to) as Quad['subject'],
      rebaseTerm(q.predicate, from, to) as Quad['predicate'],
      rebaseTerm(q.object, from, to) as Quad['object'],
      rebaseTerm(q.graph, from, to) as Quad['graph'],
    );
  }
  return term;
}

const skipList: Record<string, string> = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'skip-list.json'), 'utf-8'),
).skip;

interface SpecTest {
  id: string;
  name: string;
  action: string;
  result: string;
  output: ICoreQueryOptions['output'];
}

function loadManifest(): SpecTest[] {
  const manifestPath = path.join(TESTS_DIR, MANIFEST);
  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `W3C N3 test suite not found at ${TESTS_DIR}. `
      + 'Run `npm run spec:fetch` first (`npm run test:spec` does this automatically).',
    );
  }

  let manifestText = fs.readFileSync(manifestPath, 'utf-8');
  // Upstream typo (filed as w3c-cg/N3#232): two entries are concatenated
  // without whitespace in the mf:entries list — `:cwm_includes_t4:cwm_includes_t6`
  // — which Turtle parses as a single, undefined prefixed name rather than two
  // list items, so both tests silently vanish. Patch it here on the fetched
  // copy until upstream lands the fix; self-healing (a no-op once fixed).
  manifestText = manifestText.replace(
    ':cwm_includes_t4:cwm_includes_t6',
    ':cwm_includes_t4 :cwm_includes_t6',
  );

  const store = new Store(new Parser({
    format: 'text/n3',
    baseIRI: `${MANIFEST_BASE}${MANIFEST}`,
  }).parse(manifestText));

  function one(subject: Term | undefined, predicate: string): Term | undefined {
    return subject && store.getObjects(subject as Parameters<Store['getObjects']>[0], namedNode(predicate), null)[0];
  }

  // Walk the rdf:List of mf:entries
  const entries: Term[] = [];
  let head = one(namedNode(`${MANIFEST_BASE}${MANIFEST}`), `${MF}entries`);
  while (head && head.value !== `${RDF}nil`) {
    const first = one(head, `${RDF}first`);
    if (first) {
      entries.push(first);
    }
    head = one(head, `${RDF}rest`);
  }

  return entries.map((entry) => {
    const options = one(entry, `${TEST}options`);
    const flag = (name: string): boolean => one(options, `${TEST}${name}`)?.value === 'true';

    // Map the cwm-style test options onto the EYE output modes:
    //  - test:conclusions ("replace store with conclusions") -> derivations
    //  - test:data ("remove all except plain RDF triples")   -> deductive_closure
    //  - neither (full store, rules included)                -> deductive_closure_plus_rules
    // test:think (fixpoint) vs test:rules (single pass) cannot be
    // distinguished: EYE always reasons to fixpoint.
    let output: ICoreQueryOptions['output'];
    if (flag('conclusions')) {
      output = 'derivations';
    } else if (flag('data')) {
      output = 'deductive_closure';
    } else {
      output = 'deductive_closure_plus_rules';
    }

    return {
      id: entry.value.replace(`${MANIFEST_BASE}${MANIFEST}#`, ''),
      name: one(entry, `${MF}name`)?.value ?? '(unnamed)',
      action: one(entry, `${MF}action`)?.value.replace(MANIFEST_BASE, '') ?? '',
      result: one(entry, `${MF}result`)?.value.replace(MANIFEST_BASE, '') ?? '',
      output,
    };
  });
}

describe('W3C N3 reasoning spec tests (manifest-reasoner.ttl)', () => {
  const tests = loadManifest();

  it('loads all test entries from the manifest', () => {
    expect(tests.length).toBeGreaterThan(0);
  });

  for (const test of tests) {
    const runner = test.id in skipList ? it.skip : it;
    // eslint-disable-next-line no-loop-func
    runner(`${test.id} — ${test.name}`, async () => {
      const action = fs.readFileSync(path.join(TESTS_DIR, test.action), 'utf-8');
      const expectedText = fs.readFileSync(path.join(TESTS_DIR, test.result), 'utf-8');

      // The reference results resolve relative IRIs against the original
      // name of the input file (they were generated by running the reasoner
      // on e.g. `reflexive.n3` in its own directory), while `n3reasoner`
      // loads its input as `data_0.n3s`. Parse the reference against the
      // input's file name and rebase the actual output onto the same base.
      const expectedBase = `file:///${path.basename(test.action)}`;

      const actual = await n3reasoner(action, undefined, {
        output: test.output,
        outputType: 'quads',
      });
      const expected = new Parser({
        format: 'text/n3',
        baseIRI: expectedBase,
      }).parse(expectedText);

      const rebased = actual.map((q) => rebaseTerm(q, REASONER_BASE, expectedBase) as Quad);

      expect(rebased).toBeRdfIsomorphic(expected);
    });
  }
});
