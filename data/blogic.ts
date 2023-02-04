export const data = `
@prefix : <urn:example:> .
@prefix log: <http://www.w3.org/2000/10/swap/log#> .

:Alice a :Person .

(_:x) log:onNegativeSurface {
    _:x a :Person .
   () log:onNegativeSurface {
       _:x a :Human .
   } .
} .

(_:x _:y) log:onQuerySurface {
   _:x a _:y .
} .
`;

export const result = `
@prefix : <urn:example:>.
@prefix log: <http://www.w3.org/2000/10/swap/log#>.

<urn:example:Alice> a <urn:example:Person>.
<urn:example:Alice> a <urn:example:Human>.
`;
