export const querySemantics = `
@prefix : <http://ex.org/> .
@prefix log: <http://www.w3.org/2000/10/swap/log#> .

{ :test :people ?people } => { :test :people ?people } .
`;

export const dataSemantics = `
@prefix : <http://ex.org/> .
@prefix log: <http://www.w3.org/2000/10/swap/log#> .

{
    <https://raw.githubusercontent.com/w3c/N3/master/tests/N3Tests/people.n3> log:semantics ?people .
}
=>
{
    :test :people ?people
}
.
`;

export const resultSemantics = `
@prefix : <http://ex.org/>.
@prefix log: <http://www.w3.org/2000/10/swap/log#>.
@prefix ns1: <http://example.com/>.

:test :people {
    ns1:william a ns1:Person.
    ns1:doerthe a ns1:Person.
    ns1:gregg a ns1:Person.
}.
`;
