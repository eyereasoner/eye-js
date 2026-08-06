# W3C N3 reasoning spec tests

This directory contains a jest runner for the reasoning part of the
[W3C N3 test suite](https://github.com/w3c/N3/tree/master/tests) (issue #336).

```
npm run test:spec
```

It is a **separate jest project** (`jest.spec.config.json`) so that it does not
interfere with the coverage-thresholded unit test suite, and it needs `dist`
to be built first (`npm run build`).

## How it works

- The upstream test suite is **not committed to this repo**. `npm run test:spec`
  first runs `npm run spec:fetch` (`scripts/fetch-n3-tests.ts`), which downloads
  `tests/N3Tests` from [`w3c/N3`](https://github.com/w3c/N3) at a **pinned
  commit** into the git-ignored `__tests__/spec/.w3c-n3-tests/`. Fetching is a
  no-op once the directory is present, and in CI that directory is persisted
  with `actions/cache` (keyed on `scripts/fetch-n3-tests.ts`, which holds the
  pin) so runs are deterministic and cache-hit fast.
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

## Updating the pinned version

Bump `N3_TESTS_COMMIT` in `scripts/fetch-n3-tests.ts`. That value both drives
the download and is hashed into the CI cache key, so a new pin refreshes the
cache automatically. Delete `__tests__/spec/.w3c-n3-tests/` locally to force a
re-fetch.

## Known upstream manifest typo

The pinned manifest concatenates two entries without whitespace in its
`mf:entries` list — `:cwm_includes_t4:cwm_includes_t6` — which Turtle parses as
a single, undefined prefixed name (`:` is legal in local names), so both tests
would silently vanish. `spec-test.ts` applies a small, self-healing in-code
patch (insert the missing space) before parsing the fetched manifest; it
becomes a no-op once upstream fixes it. Filed upstream as
[w3c-cg/N3#232](https://github.com/w3c-cg/N3/issues/232).

## License

The fetched tests are used under the
[W3C Test Suite License](https://www.w3.org/Consortium/Legal/2008/04-testsuite-license)
/ [W3C Software and Document License](https://www.w3.org/Consortium/Legal/copyright-software).
They are downloaded at test time, not redistributed in this repository.
