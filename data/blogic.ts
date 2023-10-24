export const data = `
@prefix : <urn:example:> .
@prefix log: <http://www.w3.org/2000/10/swap/log#> .

:Alice a :Person .

(_x) log:onNegativeSurface {
    _x a :Person .
   () log:onNegativeSurface {
       _x a :Human .
   } .
} .

(_x _y) log:onQuerySurface {
   _x a _y .
} .
`;

export const result = `
@prefix : <urn:example:>.
@prefix log: <http://www.w3.org/2000/10/swap/log#>.

<urn:example:Alice> a <urn:example:Human>.
`;
