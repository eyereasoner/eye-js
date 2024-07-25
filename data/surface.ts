/**
 * @see https://github.com/eyereasoner/eye-js/pull/1107
 */
export const query = `
@prefix : <https://example.org/ns#> .
@prefix log: <http://www.w3.org/2000/10/swap/log#> .

 :ABC a :DepartmentPreference .
 :ABC a :ResearcherPreference .

() log:onNegativeSurface {
    :ABC a :DepartmentPreference .
    :ABC a :ResearcherPreference .
} .
`

/**
 * @see https://github.com/eyereasoner/eye-js/pull/1107#issuecomment-2133460498
 */
export const relabelingQuery = `
@prefix : <https://example.org/ns#> .
@prefix log: <http://www.w3.org/2000/10/swap/log#> .

:ABC a :DepartmentPreference .
:ABC a :ResearcherPreference .

(_:WHAT) log:onNegativeSurface {
    _:WHAT a :DepartmentPreference .
    _:WHAT a :ResearcherPreference .
} .
`

export const relabelingResult = `
@prefix : <https://example.org/ns#>.
@prefix log: <http://www.w3.org/2000/10/swap/log#>.

{
    _:WHAT a :DepartmentPreference.
} => {
    ([]) log:onNegativeSurface {
        [] a :ResearcherPreference.
    }.
}.

{
    _:WHAT a :ResearcherPreference.
} => {
    ([]) log:onNegativeSurface {
        [] a :DepartmentPreference.
    }.
}.
`
