export const query = `
@prefix : <http://example.org/socrates#>.

{:Socrates a ?WHAT} => {:Socrates a ?WHAT}.
`;

export const queryAll = `
@prefix : <http://example.org/socrates#>.

{?S ?P ?O} => {?S ?P ?O}.
`;

export const socratesPrefixes = `
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix : <http://example.org/socrates#>.
`

export const socratesHuman = ':Socrates a :Human.';
export const humanMortal = ':Human rdfs:subClassOf :Mortal.';
export const subClassOf = '{?A rdfs:subClassOf ?B. ?S a ?A} => {?S a ?B}.'

export const data = `${socratesPrefixes}
${socratesHuman}
${humanMortal}

${subClassOf}
`;

export const dataSplit: [string, ...string[]] = [
  socratesPrefixes + socratesHuman,
  socratesPrefixes + humanMortal,
  socratesPrefixes + subClassOf,
]

export const result = `
@prefix : <http://example.org/socrates#>.

:Socrates a :Human.
:Socrates a :Mortal.`;

export const dataStar = `
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix : <http://example.org/socrates#>.

<<:Socrates a :Human>> :is true.
:Human rdfs:subClassOf :Mortal.

{<<?S ?P ?O>> :is true} => {?S ?P ?O}.
{?A rdfs:subClassOf ?B. ?S a ?A} => {?S a ?B}.
`;

export const trig = `
# ------------------
# Socrates Inference
# ------------------
#
# Infer that Socrates is mortal.

@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix lingua: <http://www.w3.org/2000/10/swap/lingua#>.
@prefix var: <http://www.w3.org/2000/10/swap/var#>.
@prefix : <#>.

# facts
:Socrates a :Human.
:Human rdfs:subClassOf :Mortal.

# rdfs subclass
:rdfs_subclass_rule lingua:premise _:rdfs_subclass_rule_premise;
    lingua:conclusion _:rdfs_subclass_rule_conclusion.

_:rdfs_subclass_rule_premise {
    var:A rdfs:subClassOf var:B.
    var:S a var:A.
}

_:rdfs_subclass_rule_conclusion {
    var:S a var:B.
}

# query
:socrates_query lingua:question _:socrates_question.

_:socrates_question {
    var:S a :Mortal.
}`
