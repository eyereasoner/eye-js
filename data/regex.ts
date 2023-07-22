export const data = `
@prefix : <urn:example:> .
@prefix string: <http://www.w3.org/2000/10/swap/string#>.

{"abracadabra" string:matches "(a|b|r|c|d)+"} => {:test1 :is :ok}.
{"2023" string:matches "[0-9]{4}"} => {:test2 :is :ok}.
`;

export const result = `@prefix : <urn:example:>.
@prefix string: <http://www.w3.org/2000/10/swap/string#>.

<urn:example:test1> <urn:example:is> <urn:example:ok>.
<urn:example:test2> <urn:example:is> <urn:example:ok>.

`;
