import assert from "node:assert/strict";
import { queryParadigma, readParadigmaSources } from "../../prometeo-contexto/src/query.mjs";
import { registerLanguageProposals } from "../src/proposals.mjs";

const mapDocument = {
  map_version: "f1-context-read",
  schema_status: "frozen",
  phase: "F1",
  nodes: [{
    id: "node-r-star",
    label: "R*",
    description: "objeto formal",
    locator: { workId: "metrologia-causal", section: "definición de R*" },
    status: "explicit",
  }],
  works: [],
  evidence: [],
  relations: [],
  routes: [],
};
const mapResult = queryParadigma({
  mapDocument,
  query: "R*",
  sourceRef: "kagenomusuko-svg/Paradigma@map-commit",
  retrievedAt: "2026-09-29T20:00:00Z",
});
const context = await readParadigmaSources({
  mapResult,
  retrievedAt: "2026-09-29T20:00:01Z",
  readSource: async () => ({
    text: "Texto canónico: R* designa una relación formal.",
    sourceRef: "kagenomusuko-svg/Paradigma@corpus-commit",
    sourceVersion: "sha256:canonical-source",
  }),
});
const fragmentId = "source-case:fragment:1";
const result = registerLanguageProposals({
  document: { id: "source-case", fragments: [{ id: fragmentId }] },
  context,
  propositions: [{
    id: "proposal-1",
    fragmentId,
    text: "Se propone examinar la relación formal descrita por el contexto.",
    modality: "possible",
  }],
  candidates: [],
  hypotheses: [],
  recordedAt: "2026-09-29T20:00:02Z",
});

assert.equal(result.contextSources.length, 1);
assert.match(result.contextSources[0].text, /Texto canónico/);
assert.equal(result.contextSources[0].contextOnly, true);
assert.equal(result.contextReferences[0].sourceRef, "kagenomusuko-svg/Paradigma@corpus-commit");
assert.equal(result.contextReferences[0].sourceVersion, "sha256:canonical-source");
assert.equal(result.propositions[0].state, "proposed");
assert.equal(result.requiresHumanConfirmation, true);
assert.equal(Object.hasOwn(result, "evidence"), false);
assert.equal(Object.hasOwn(result, "confirmedModel"), false);
assert.equal(Object.hasOwn(result, "motorRequest"), false);
console.log("PASS: texto canónico disponible para propuesta y segregado de evidencia del caso");
