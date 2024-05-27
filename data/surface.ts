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
