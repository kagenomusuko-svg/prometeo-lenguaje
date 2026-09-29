import { strict as assert } from "node:assert";
import { LanguageError, registerLanguageProposals } from "../src/proposals.mjs";

const document = {
  id: "document-adversarial-001",
  fragments: [{ id: "document-adversarial-001:fragment:1" }],
};

const context = {
  mapVersion: "f1-adversarial",
  contextStatus: "map-locators-only",
  requiresSourceReading: true,
  matches: [{
    id: "node-r-star",
    category: "nodes",
    locator: { workId: "metrologia-causal", section: "R*" },
    evidenceStatus: "explicit",
  }],
  provenance: {
    kind: "deterministic-system",
    actorId: "prometeo-contexto",
    recordedAt: "2026-09-29T17:00:00Z",
    sourceObjectId: "kagenomusuko-svg/Paradigma@map-commit",
    sourceVersion: "f1-adversarial",
  },
};

const validInput = {
  document,
  context,
  propositions: [{
    id: "proposition-adversarial-001",
    fragmentId: document.fragments[0].id,
    text: "A realizó X y se reporta Y.",
    modality: "reported",
  }],
  candidates: [{
    id: "candidate-adversarial-001",
    propositionId: "proposition-adversarial-001",
    category: "relation",
    label: "X podría relacionarse con Y",
  }],
  hypotheses: [{
    id: "hypothesis-adversarial-001",
    caseId: "case-adversarial-001",
    label: "H1",
    candidateIds: ["candidate-adversarial-001"],
  }],
  recordedAt: "2026-09-29T17:01:00Z",
};

const valid = registerLanguageProposals(validInput);
assert.equal(valid.requiresHumanConfirmation, true);
assert.equal(valid.propositions.every((item) => item.state === "proposed"), true);
assert.equal(valid.candidates.every((item) => item.state === "proposed"), true);
assert.equal(valid.hypotheses.every((item) => item.status === "proposed"), true);
assert.equal(Object.hasOwn(valid, "confirmedModel"), false);

function expectLanguageError(build, code) {
  assert.throws(
    build,
    (error) => error instanceof LanguageError && error.code === code,
  );
}

expectLanguageError(() => registerLanguageProposals({
  ...validInput,
  propositions: [{
    ...validInput.propositions[0],
    state: "accepted",
  }],
}), "IMPLICIT_PROMOTION");

expectLanguageError(() => registerLanguageProposals({
  ...validInput,
  candidates: [{
    ...validInput.candidates[0],
    propositionId: "proposition-unknown",
  }],
}), "UNKNOWN_PROPOSITION");

expectLanguageError(() => registerLanguageProposals({
  ...validInput,
  hypotheses: [{
    ...validInput.hypotheses[0],
    candidateIds: ["candidate-unknown"],
  }],
}), "UNKNOWN_CANDIDATE");

expectLanguageError(() => registerLanguageProposals({
  ...validInput,
  propositions: [
    validInput.propositions[0],
    { ...validInput.propositions[0] },
  ],
}), "DUPLICATE_ID");

expectLanguageError(() => registerLanguageProposals({
  ...validInput,
  context: {
    ...context,
    contextStatus: "resolved-authority",
  },
}), "INVALID_CONTEXT");

expectLanguageError(() => registerLanguageProposals({
  ...validInput,
  context: {
    ...context,
    provenance: { ...context.provenance, kind: "language-agent" },
  },
}), "INVALID_CONTEXT_PROVENANCE");

console.log("PASS: batería adversarial de propuestas lingüísticas");
