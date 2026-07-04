# W3C N3 reasoning spec tests

This directory contains a hermetic jest runner for the reasoning part of the
[W3C N3 test suite](https://github.com/w3c/N3/tree/master/tests) (issue #336).

```
npm run test:spec
```

It is a **separate jest project** (`jest.spec.config.json`) so that it does not
interfere with the coverage-thresholded unit test suite, and it needs `dist`
to be built first (`npm run build`).

## How it works

- `w3c-n3-tests/` is a vendored snapshot of `tests/N3Tests/manifest-reasoner.ttl`
  plus every file it references (`mf:action` / `mf:result`) from
  [`w3c/N3`](https://github.com/w3c/N3), so the suite runs fully offline.
  See "Updating the snapshot" below for provenance.
- `spec-test.ts` parses the manifest with the `n3` parser, runs each
  `test:TestN3Reason` entry through `n3reasoner`, and compares the derived
  graph against the reference result with RDF isomorphism (`jest-rdf` /
  `rdf-isomorphic`).
- The cwm-style `test:options` are mapped onto EYE output modes:

  | options | `n3reasoner` output |
  |---|---|
  | `test:conclusions` | `derivations` (`--pass-only-new`) |
  | `test:data` | `deductive_closure` (`--pass`) |
  | neither | `deductive_closure_plus_rules` (`--pass-all`) |

  `test:think` (fixpoint) vs `test:rules` (single pass) cannot be
  distinguished — EYE always reasons to fixpoint.

## Skip list

`skip-list.json` records every known deviation between EYE and the reference
results, keyed by manifest entry id, with a reason. Skipped entries show up as
skipped (not failed) so CI stays green while deviations are triaged. To triage
one: remove it from the skip list, run `npm run test:spec`, and inspect the
diff.

## Updating the snapshot

The snapshot was taken from [`w3c/N3`](https://github.com/w3c/N3) at commit
`97653d42da0cd272289ce86f79208d4f0febdde9`. To refresh it, clone `w3c/N3` and
copy `tests/N3Tests/manifest-reasoner.ttl`, every file referenced by an
`mf:action`/`mf:result` in it, and `tests/LICENSE.md` into `w3c-n3-tests/`
(preserving relative paths), then update this commit reference.

### Local patches

The snapshot carries one deliberate deviation from upstream:

- `manifest-reasoner.ttl` line 24: inserted the missing whitespace in
  `:cwm_includes_t4:cwm_includes_t6` (upstream typo — Turtle allows `:` in
  local names, so the two entries otherwise parse as a single unknown entry
  and neither test runs).

The tests are used under the
[W3C Test Suite License](https://www.w3.org/Consortium/Legal/2008/04-testsuite-license)
/ [W3C Software and Document License](https://www.w3.org/Consortium/Legal/copyright-software)
— see `w3c-n3-tests/LICENSE.md`.
