import EYE from './eye.pl';
// @ts-ignore
import SWIPL from './swipl-bundled.temp';

const data = `
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix : <http://example.org/socrates#>.

:Socrates a :Human.
:Human rdfs:subClassOf :Mortal.

{?A rdfs:subClassOf ?B. ?S a ?A} => {?S a ?B}.

`;

const query = `
@prefix : <http://example.org/socrates#>.

{:Socrates a ?WHAT} => {:Socrates a ?WHAT}.

`;

export default async function eye() {
  const Module = await SWIPL({
    print: (e: string) => {
      console.log(e);
    },
    arguments: ['-q'],
  });
  Module.FS.writeFile('eye.pl', EYE);
  // Module.FS.writeFile('eye.pl', EYE_PL );
  Module.FS.writeFile('data.n3', data);
  Module.FS.writeFile('query.n3', query);

  Module.prolog.query("consult('eye.pl').").once();
  Module.prolog.query("main(['--quiet', './data.n3', '--query', './query.n3']).").once();
}
