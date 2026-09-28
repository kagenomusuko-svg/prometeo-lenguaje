import { strict as assert } from "node:assert";
import { registerLanguageProposals } from "../src/proposals.mjs";

const result = registerLanguageProposals({
  document: { id: "document-contract", fragments: [{ id: "fragment-contract" }] },
  context: {
    mapVersion: "f1-contract",
    contextStatus: "map-locators-only",
    requiresSourceReading: true,
    matches: [{ id: "node-contract", category: "nodes", locator: { workId: "w", section: "s" }, evidenceStatus: "explicit" }],
    provenance: {
      kind: "deterministic-system",
      actorId: "prometeo-contexto",
      recordedAt: "2026-09-28T19:59:00Z",
      sourceObjectId: "kagenomusuko-svg/Paradigma@contract-map",
      sourceVersion: "f1-contract",
    },
  },
  propositions: [{ id: "proposition-contract", fragmentId: "fragment-contract", text: "Se observa X." }],
  candidates: [{ id: "candidate-contract", propositionId: "proposition-contract", category: "relation", label: "X podría relacionarse con Y" }],
  hypotheses: [{ id: "hypothesis-contract", caseId: "case-contract", label: "H1", candidateIds: ["candidate-contract"] }],
  recordedAt: "2026-09-28T20:00:00Z",
});

assert.equal(result.requiresHumanConfirmation, true);
assert.equal(result.provenance.kind, "language-agent");
for (const collection of [result.propositions, result.candidates, result.hypotheses]) {
  for (const item of collection) {
    assert.equal(item.provenance.kind, "language-agent");
    assert.ok(["proposed"].includes(item.state ?? item.status));
  }
}
for (const field of ["id", "category", "locator", "evidenceStatus", "mapVersion", "sourceRef"]) {
  assert.ok(Object.hasOwn(result.contextReferences[0], field), "ContextReference field: " + field);
}

console.log("PASS: lenguaje conserva propuestas y exige confirmación humana");
