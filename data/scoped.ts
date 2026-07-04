// Fixtures for the graph-scoped builtins, which are evaluated by running a
// sub-reasoner over the scope graph (https://github.com/eyereasoner/eye-js/issues/873)
const prefixes = `
@prefix log: <http://www.w3.org/2000/10/swap/log#> .
@prefix : <http://example.org/> .
`;

// The reproduction from https://github.com/eyereasoner/eye-js/issues/873
export const collectAllData = `${prefixes}
{ (?x { ?x a :Test } ?xs) log:collectAllIn { :x a :Test } } => { ?xs a :Result }.
`;
export const collectAllResult = '(:x) a :Result.';

export const conclusionData = `${prefixes}
{
  { :alice :likes :bob. { :alice :likes :bob } => { :bob :likes :alice } } log:conclusion ?closure.
  ?closure log:includes { :bob :likes :alice }.
} => { :test a :Success }.
`;
export const conclusionResult = ':test a :Success.';

// A scoped builtin nested inside a scope graph: computing the deductive
// closure of the outer scope requires a sub-reasoner that itself needs a
// sub-sub-reasoner for the inner log:collectAllIn
export const nestedScopeData = `${prefixes}
{
  (?x { ?x a :Outer } ?xs) log:collectAllIn {
    :seed a :Seed.
    { (?y { ?y a :Seed } ?ys) log:collectAllIn { :seed a :Seed } } => { :found a :Outer }.
  }
} => { ?xs a :Result }.
`;
export const nestedScopeResult = '(:found) a :Result.';

// The unsatisfiable scope makes the sub-reasoner exit with an inference fuse,
// which the bridge reports back as a failing exec/2 - so log:satisfiable
// resolves to false, exactly like the non-zero process exit in native EYE
export const satisfiableData = `${prefixes}
{
  { :a :b :c } log:satisfiable true.
  { :d :e :f. { :d :e :f } => false } log:satisfiable false.
} => { :test a :Success }.
`;
export const satisfiableResult = ':test a :Success.';

// e:exec runs arbitrary shell commands in native EYE and stays unsupported in
// the WASM build; the commands below also exercise the rejection of anything
// that is not a well-formed eye sub-reasoner command line
export const execData = (command: string) => `${prefixes}
@prefix e: <http://eulersharp.sourceforge.net/2003/03swap/log-rules#> .
{ "${command}" e:exec ?exit } => { :test a :Failure }.
`;
