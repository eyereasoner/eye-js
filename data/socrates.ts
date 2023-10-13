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
