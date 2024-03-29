export const data = `
@prefix : <urn:example:> .
@prefix log: <http://www.w3.org/2000/10/swap/log#> .
@prefix skolem: <http://eyereasoner.github.io/.well-known/genid/8b98b360-9a70-4845-b52c-c675af60ad01#> .

:Alice a :Person .

(skolem:x) log:onNegativeSurface {
    skolem:x a :Person .
   () log:onNegativeSurface {
       skolem:x a :Human .
   } .
} .

(skolem:x skolem:y) log:onQuerySurface {
   skolem:x a skolem:y .
} .
`;

export const result = `
@prefix : <urn:example:>.
@prefix log: <http://www.w3.org/2000/10/swap/log#>.

<urn:example:Alice> a <urn:example:Human>.
`;
