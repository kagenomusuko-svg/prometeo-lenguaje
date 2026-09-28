import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { registerLanguageProposals } from "../src/proposals.mjs";

if (!process.env.PROMETEO_CONTEXTO_PATH) {
  throw new Error("PROMETEO_CONTEXTO_PATH es obligatorio para la integración contexto→lenguaje");
}

const { queryParadigma } = await import(pathToFileURL(process.env.PROMETEO_CONTEXTO_PATH).href);
const mapDocument = {
  map_version: "f1-test",
  schema_status: "frozen",
  phase: "F1",
  nodes: [{
    id: "node-r-star",
    label: "R*",
    description: "objeto formal de metrología causal",
    locator: { workId: "metrologia-causal", section: "definición de R*" },
    status: "explicit",
  }],
  works: [],
  evidence: [],
  relations: [],
  routes: [],
};
const context = queryParadigma({
  mapDocument,
  query: "R*",
  sourceRef: "kagenomusuko-svg/Paradigma@map-commit",
  retrievedAt: "2026-09-28T19:00:00Z",
});
const languageProposal = registerLanguageProposals({
  document: { id: "document-context-001", caseId: "case-context-001", fragments: [{ id: "fragment-001" }] },
  context,
  propositions: [{
    id: "proposition-context-001",
    fragmentId: "fragment-001",
    text: "Se propone examinar la relación entre X y Y.",
    modality: "reported",
  }],
  candidates: [{
    id: "candidate-context-001",
    propositionId: "proposition-context-001",
    category: "relation",
    label: "X podría relacionarse con Y",
  }],
  hypotheses: [{
    id: "hypothesis-context-001",
    caseId: "case-context-001",
    label: "H1",
    candidateIds: ["candidate-context-001"],
  }],
  recordedAt: "2026-09-28T19:01:00Z",
});

assert.equal(languageProposal.requiresHumanConfirmation, true);
assert.equal(languageProposal.propositions[0].state, "proposed");
assert.equal(languageProposal.candidates[0].state, "proposed");
assert.equal(languageProposal.hypotheses[0].status, "proposed");
assert.deepEqual(languageProposal.contextReferences, [{
  id: "node-r-star",
  category: "nodes",
  locator: { workId: "metrologia-causal", section: "definición de R*" },
  evidenceStatus: "explicit",
  mapVersion: "f1-test",
  sourceRef: "kagenomusuko-svg/Paradigma@map-commit",
}]);
assert.equal(Object.hasOwn(languageProposal, "confirmedModel"), false);
assert.equal(Object.hasOwn(languageProposal, "motorRequest"), false);
assert.equal(Object.hasOwn(languageProposal, "motorResult"), false);

console.log("PASS: contexto externo llega a lenguaje sólo como referencia");
