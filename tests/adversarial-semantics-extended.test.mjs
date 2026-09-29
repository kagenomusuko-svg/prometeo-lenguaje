import { strict as assert } from "node:assert";
import { registerLanguageProposals } from "../src/proposals.mjs";

const document = {
  id: "document-adversarial-semantics-002",
  fragments: [{ id: "document-adversarial-semantics-002:fragment:1" }],
};
const context = {
  mapVersion: "f1-extended",
  contextStatus: "map-locators-only",
  requiresSourceReading: true,
  matches: [{
    id: "route-contradiction",
    category: "routes",
    locator: { workId: "metrologia-causal", section: "contradicciones" },
    evidenceStatus: "inferred",
  }],
  provenance: {
    kind: "deterministic-system",
    actorId: "prometeo-contexto",
    recordedAt: "2026-09-29T19:00:00Z",
    sourceObjectId: "Paradigma@map",
    sourceVersion: "f1-extended",
  },
};
const propositions = [
  ["p-asserted", "A realizó X.", "asserted"],
  ["p-reported", "Se reporta que A realizó X.", "reported"],
  ["p-inferred", "Se infiere una relación entre X e Y.", "inferred"],
  ["p-contradictory", "Otra fuente niega que A realizara X.", "denied"],
  ["p-unverified-attribution", "Se atribuye Y a A, sin atribución verificada.", "unknown"],
  ["p-unestablished-obligation", "Se afirma incumplimiento, pero no está establecida la obligación aplicable.", "obligatory"],
  ["p-counterfactual", "Si X no hubiera ocurrido, Y podría no haberse producido.", "possible"],
].map(([id, text, modality]) => ({ id, fragmentId: document.fragments[0].id, text, modality }));

const result = registerLanguageProposals({
  document,
  context,
  propositions,
  candidates: [
    { id: "candidate-contradiction", propositionId: "p-contradictory", category: "relation", attributes: { semanticType: "contradiction" }, label: "contradicción candidata" },
    { id: "candidate-attribution", propositionId: "p-unverified-attribution", category: "actor", attributes: { semanticType: "attribution-unverified" }, label: "atribución no verificada" },
    { id: "candidate-obligation", propositionId: "p-unestablished-obligation", category: "condition", attributes: { semanticType: "obligation-unestablished" }, label: "obligación no establecida" },
    { id: "candidate-counterfactual", propositionId: "p-counterfactual", category: "relation", attributes: { semanticType: "counterfactual" }, label: "contrafactual candidato" },
  ],
  hypotheses: [
    { id: "hypothesis-x", caseId: "case-extended", label: "H1: X como explicación", candidateIds: ["candidate-attribution", "candidate-counterfactual"] },
    { id: "hypothesis-not-x", caseId: "case-extended", label: "H2: explicación incompatible con X", candidateIds: ["candidate-contradiction", "candidate-obligation"] },
  ],
  recordedAt: "2026-09-29T19:01:00Z",
});

assert.deepEqual(result.propositions.map((item) => item.text), propositions.map((item) => item.text));
assert.deepEqual(result.propositions.map((item) => item.modality), propositions.map((item) => item.modality));
assert.deepEqual(result.candidates.map((item) => item.category), [
  "relation", "actor", "condition", "relation",
]);
assert.deepEqual(result.hypotheses.map((item) => item.candidateIds), [
  ["candidate-attribution", "candidate-counterfactual"],
  ["candidate-contradiction", "candidate-obligation"],
]);
assert.equal(result.requiresHumanConfirmation, true);
assert.equal(result.propositions.every((item) => item.state === "proposed"), true);
assert.equal(result.candidates.every((item) => item.state === "proposed"), true);
assert.equal(result.hypotheses.every((item) => item.status === "proposed"), true);
assert.equal(Object.hasOwn(result, "confirmedModel"), false);
assert.equal(Object.hasOwn(result, "MotorRequest"), false);
assert.equal(Object.hasOwn(result, "causalConclusion"), false);

console.log("PASS: contradicción, atribución, obligación y contrafactual preservados como propuestas");
