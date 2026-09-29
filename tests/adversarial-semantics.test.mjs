import { strict as assert } from "node:assert";
import { LanguageError, registerLanguageProposals } from "../src/proposals.mjs";

const document = {
  id: "document-semantics-001",
  fragments: [{ id: "document-semantics-001:fragment:1" }],
};
const context = {
  mapVersion: "f1-semantics",
  contextStatus: "map-locators-only",
  requiresSourceReading: true,
  matches: [{ id: "r-star", category: "nodes", locator: { workId: "metrologia-causal", section: "R*" }, evidenceStatus: "explicit" }],
  provenance: {
    kind: "deterministic-system",
    actorId: "prometeo-contexto",
    recordedAt: "2026-09-29T18:00:00Z",
    sourceObjectId: "Paradigma@map",
    sourceVersion: "f1-semantics",
  },
};
const modalities = ["asserted", "reported", "inferred", "possible", "obligatory", "denied", "unknown"];
const input = {
  document,
  context,
  propositions: modalities.map((modality, index) => ({
    id: "p-" + index,
    fragmentId: document.fragments[0].id,
    text: "Proposición con modalidad " + modality,
    modality,
  })),
  candidates: [{
    id: "candidate-relation",
    propositionId: "p-0",
    category: "relation",
    label: "relación candidata",
  }],
  hypotheses: [
    { id: "hypothesis-a", caseId: "case-1", label: "H1: alternativa A", candidateIds: ["candidate-relation"] },
    { id: "hypothesis-b", caseId: "case-1", label: "H2: alternativa incompatible B", candidateIds: [] },
  ],
  recordedAt: "2026-09-29T18:01:00Z",
};

const result = registerLanguageProposals(input);
assert.deepEqual(result.propositions.map((item) => item.modality), modalities);
assert.equal(result.propositions.every((item) => item.state === "proposed"), true);
assert.deepEqual(result.hypotheses.map((item) => item.label), ["H1: alternativa A", "H2: alternativa incompatible B"]);
assert.equal(result.requiresHumanConfirmation, true);
assert.equal(result.contextReferences[0].id, "r-star");
assert.equal(Object.hasOwn(result, "evidence"), false);
assert.equal(Object.hasOwn(result, "confirmedModel"), false);
assert.equal(Object.hasOwn(result, "MotorRequest"), false);

function expectError(build, code) {
  assert.throws(build, (error) => error instanceof LanguageError && error.code === code);
}

expectError(() => registerLanguageProposals({
  ...input,
  context: { ...context, contextStatus: "source-text-read", requiresSourceReading: false },
}), "INVALID_CONTEXT");

expectError(() => registerLanguageProposals({
  ...input,
  candidates: [{ ...input.candidates[0], state: "confirmed" }],
}), "IMPLICIT_PROMOTION");

expectError(() => registerLanguageProposals({
  ...input,
  hypotheses: [{ ...input.hypotheses[0], status: "accepted" }],
}), "IMPLICIT_PROMOTION");

expectError(() => registerLanguageProposals({
  ...input,
  propositions: [{ ...input.propositions[0], modality: "certain" }],
}), "INVALID_MODALITY");

console.log("PASS: batería adversarial sustantiva de modalidades, alternativas y abstención");
