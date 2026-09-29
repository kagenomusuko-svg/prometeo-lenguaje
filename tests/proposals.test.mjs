import { strict as assert } from "node:assert";
import { registerLanguageProposals, LanguageError } from "../src/proposals.mjs";

const document = {
  id: "document-001",
  fragments: [{ id: "document-001:fragment:1" }],
};
const context = {
  mapVersion: "f1-test",
  contextStatus: "map-locators-only",
  requiresSourceReading: true,
  matches: [{ id: "node-r-star", category: "nodes", locator: { workId: "metrologia-causal", section: "R*" }, evidenceStatus: "explicit" }],
  provenance: { kind: "deterministic-system", actorId: "prometeo-contexto", recordedAt: "2026-09-28T17:20:00Z", sourceObjectId: "kagenomusuko-svg/Paradigma@map-commit", sourceVersion: "f1-test" },
};
const proposals = registerLanguageProposals({
  document,
  context,
  propositions: [{
    id: "proposition-001",
    fragmentId: "document-001:fragment:1",
    text: "A realizó X y se reporta un resultado Y.",
    modality: "reported",
  }],
  candidates: [{
    id: "candidate-001",
    propositionId: "proposition-001",
    category: "relation",
    label: "X podría relacionarse con Y",
    attributes: { modal: "possible" },
  }],
  hypotheses: [{
    id: "hypothesis-001",
    caseId: "case-001",
    label: "H1: relación propuesta entre X y Y",
    candidateIds: ["candidate-001"],
  }],
  recordedAt: "2026-09-28T17:30:00Z",
});

assert.equal(proposals.propositions[0].state, "proposed");
assert.equal(proposals.candidates[0].state, "proposed");
assert.equal(proposals.hypotheses[0].status, "proposed");
assert.deepEqual(proposals.hypotheses[0].relationIds, []);
assert.equal(proposals.requiresHumanConfirmation, true);
assert.equal(proposals.provenance.kind, "language-agent");
assert.equal(proposals.contextReferences[0].sourceRef, "kagenomusuko-svg/Paradigma@map-commit");
assert.equal(proposals.contextReferences[0].evidenceStatus, "explicit");

assert.throws(
  () => registerLanguageProposals({
    document,
    propositions: [{
      id: "proposition-002",
      fragmentId: "document-001:fragment:1",
      text: "A causó Y.",
      modality: "asserted",
      state: "accepted",
    }],
    recordedAt: "2026-09-28T17:30:00Z",
  }),
  (error) => error instanceof LanguageError && error.code === "IMPLICIT_PROMOTION",
);

assert.throws(
  () => registerLanguageProposals({
    document,
    propositions: [{
      id: "proposition-missing-modality",
      fragmentId: "document-001:fragment:1",
      text: "La modalidad no fue proporcionada.",
    }],
    recordedAt: "2026-09-28T17:30:00Z",
  }),
  (error) => error instanceof LanguageError && error.code === "INVALID_MODALITY",
);

console.log("PASS: lenguaje registra propuestas, exige modalidad y bloquea promoción implícita");
