export const askQuery = `
@prefix log: <http://www.w3.org/2000/10/swap/log#> .
@prefix : <http://example.org#> .

{
    "calc 1+1" log:ask ?Y .
    "calc 1+3" log:ask ?Y2 .
    "calc 1+4" log:ask ?Y3 .
} log:query {
    :result :is ?Y, ?Y2, ?Y3 .
} .`

export const askCallback = async (arg: string) => String(parseInt(arg.slice(5, 6)) + parseInt(arg.slice(7, 8)))
export const askResult = "<http://example.org#result> <http://example.org#is> '2', '4', '5'.";
