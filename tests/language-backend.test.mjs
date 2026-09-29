import assert from "node:assert/strict";
import { analyzeDocument, LanguageError } from "../src/proposals.mjs";

const document = {
  id: "document-generated-001",
  caseId: "case-generated-001",
  fragments: [{ id: "document-generated-001:fragment:1", text: "A informó que X pudo afectar Y." }],
};
const context = {
  contextStatus: "source-text-read",
  requiresSourceReading: false,
  mapVersion: "f1-read",
  sources: [{
    id: "route-context",
    category: "routes",
    label: "Referencia formal",
    locator: { workId: "metrologia-causal", section: "relación" },
    text: "Texto contextual de Paradigma.",
    sourceRef: "Paradigma@corpus",
    sourceVersion: "sha256:source",
    contextOnly: true,
  }],
  provenance: {
    kind: "deterministic-system",
    actorId: "prometeo-contexto",
    recordedAt: "2026-09-29T20:30:00Z",
    sourceObjectId: "Paradigma@map",
    sourceVersion: "f1-read",
  },
};
let received;
const result = await analyzeDocument({
  document,
  context,
  recordedAt: "2026-09-29T20:30:01Z",
  backend: {
    async propose(input) {
      received = input;
      return {
        propositions: [
          { id: "p1", fragmentId: document.fragments[0].id, text: "Se reporta que A informó X.", modality: "reported" },
          { id: "p2", fragmentId: document.fragments[0].id, text: "X pudo afectar Y.", modality: "possible" },
        ],
        candidates: [
          { id: "c1", propositionId: "p1", category: "actor", label: "A", ambiguity: ["No se identifica si A actuó o sólo reportó."] },
          { id: "c2", propositionId: "p2", category: "relation", label: "X podría relacionarse con Y" },
        ],
        hypotheses: [
          { id: "h1", caseId: document.caseId, label: "X contribuyó a Y", candidateIds: ["c1", "c2"] },
          { id: "h2", caseId: document.caseId, label: "X no explica Y", candidateIds: ["c1"] },
        ],
        questions: [{ id: "q1", text: "¿Qué fuente documenta X?", reason: "Falta una fuente directa." }],
        abstentions: [{ scope: "relation", reason: "No se puede establecer dirección causal desde esta narración." }],
      };
    },
  },
});
assert.equal(received.document, document);
assert.equal(received.context, context);
assert.equal(result.analysisStatus, "proposals-produced");
assert.equal(result.propositions.every((x) => x.state === "proposed"), true);
assert.deepEqual(result.propositions.map((x) => x.modality), ["reported", "possible"]);
assert.equal(result.candidates[0].ambiguity.length, 1);
assert.equal(result.hypotheses.length, 2);
assert.equal(result.questions.length, 1);
assert.equal(result.abstentions.length, 1);
assert.equal(result.contextSources[0].contextOnly, true);
assert.equal(Object.hasOwn(result, "evidence"), false);
assert.equal(Object.hasOwn(result, "confirmedModel"), false);
assert.equal(Object.hasOwn(result, "motorRequest"), false);

const abstained = await analyzeDocument({
  document,
  recordedAt: "2026-09-29T20:30:02Z",
  backend: { async propose() {
    return {
      propositions: [], candidates: [], hypotheses: [], questions: [],
      abstentions: [{ scope: "document", reason: "El texto no permite formular propuestas responsables." }],
    };
  } },
});
assert.equal(abstained.analysisStatus, "abstained");
assert.equal(abstained.propositions.length, 0);
assert.equal(abstained.requiresHumanConfirmation, true);

await assert.rejects(
  () => analyzeDocument({
    document,
    recordedAt: "2026-09-29T20:30:03Z",
    backend: { async propose() { return {
      propositions: [], candidates: [], hypotheses: [], questions: [], abstentions: [],
      confirmedModel: { id: "forbidden" },
    }; } },
  }),
  (error) => error instanceof LanguageError && error.code === "UNAUTHORIZED_OUTPUT_FIELD",
);
console.log("PASS: backend lingüístico genera propuestas, preguntas y abstenciones sin adjudicar");
