/**
 * @see https://github.com/eyereasoner/eye-js/pull/1107
 */
export const query = `
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix log: <http://www.w3.org/2000/10/swap/log#> .
@prefix : <urn:example:> .

:Socrates a :Man.
:Man rdfs:subClassOf :Mortal.

(_:A _:B _:S) log:onNegativeSurface {
    _:A rdfs:subClassOf _:B.
    _:S a _:A.
    () log:onNegativeSurface {
        _:S a _:B.
    }.
}.

# question
(_:S) log:onNegativeSurface {
    _:S a :Mortal.
    () log:onNegativeSurface {
        :test :is true.
    }.
}.

() log:onNegativeSurface { 
    :test :is true. 
    () log:onNegativeAnswerSurface { 
        :test :is true 
    } 
} .
`;

export const queryResult = `
@prefix : <urn:example:> .

:test :is true.
`
