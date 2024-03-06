const { Parser } = require('n3');

const data = `@prefix : <file:///data_0.n3s#>.
@prefix lingua: <http://www.w3.org/2000/10/swap/lingua#>.
@prefix var: <http://www.w3.org/2000/10/swap/var#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
:rdfs_subclass_rule lingua:premise _:node_1.
:rdfs_subclass_rule lingua:conclusion _:node_2.
:rdfs_subclass_rule lingua:bindings ((var:A :Human) (var:B :Mortal) (var:S :Socrates)).
:socrates_query lingua:question _:node_3.
:socrates_query lingua:answer _:node_3.
:socrates_query lingua:bindings ((var:S :Socrates)).
:Socrates a :Mortal.
_:node_1 {
    var:A rdfs:subClassOf var:B.
    var:S a var:A.
}
_:node_2 {
    var:S a var:B.
}
_:node_3 {
    var:S a :Mortal.
}`

console.log((new Parser({ format: 'trig' }).parse)(data));
