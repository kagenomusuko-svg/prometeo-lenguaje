import assert from "node:assert/strict";
import { analyzeDocument, LanguageError } from "../src/proposals.mjs";
import { createLanguageBackend } from "../src/backends/ollama.mjs";
import { LanguageBackendError } from "../src/backend.mjs";

const document = {
  id: "ollama-contract-1",
  caseId: "case-ollama-1",
  fragments: [{ id: "ollama-contract-1:f1", text: "El informe señala que la válvula pudo fallar." }]
};
const output = {
  propositions: [{ id: "p1", fragmentId: document.fragments[0].id, text: "El informe señala una posibilidad de falla.", modality: "reported" }],
  candidates: [],
  hypotheses: [],
  questions: [{ id: "q1", text: "¿Qué evidencia respalda la posibilidad?", reason: "El documento no identifica la fuente técnica." }],
  abstentions: []
};
let request;
const backend = createLanguageBackend({
  backend: "ollama",
  model: "local-model",
  fetchImpl: async (url, init) => {
    request = { url: String(url), init, body: JSON.parse(init.body) };
    return Response.json({ message: { content: JSON.stringify(output) } });
  }
});
const result = await analyzeDocument({
  backend,
  document,
  recordedAt: "2026-09-30T00:00:00.000Z"
});
assert.equal(request.url, "http://127.0.0.1:11434/api/chat");
assert.equal(request.init.method, "POST");
assert.equal(request.body.model, "local-model");
assert.equal(request.body.stream, false);
assert.equal(request.body.options.temperature, 0);
assert.equal(request.body.format.additionalProperties, false);
const systemPrompt = request.body.messages.find((message) => message.role === "system").content;
assert.match(systemPrompt, /cada afirmación materialmente distinta/u);
assert.match(systemPrompt, /hipótesis alternativas/u);
assert.match(systemPrompt, /La secuencia temporal no demuestra/u);
assert.match(systemPrompt, /scope document/u);
assert.equal(result.propositions[0].state, "proposed");
assert.equal(result.requiresHumanConfirmation, true);
assert.equal(Object.hasOwn(result, "confirmedModel"), false);
assert.equal(Object.hasOwn(result, "motorRequest"), false);

await assert.rejects(
  () => analyzeDocument({
    document,
    recordedAt: "2026-09-30T00:00:01.000Z",
    backend: createLanguageBackend({
      backend: "ollama",
      model: "local-model",
      fetchImpl: async () => Response.json({
        message: { content: JSON.stringify({ ...output, confirmedModel: { id: "forbidden" } }) }
      })
    })
  }),
  (error) => error instanceof LanguageError && error.code === "UNAUTHORIZED_OUTPUT_FIELD"
);

assert.throws(
  () => createLanguageBackend({
    backend: "ollama",
    model: "local-model",
    baseUrl: "https://commercial-provider.example"
  }),
  (error) => error instanceof LanguageBackendError && error.code === "NON_LOCAL_OLLAMA_URL"
);
assert.throws(
  () => createLanguageBackend({ backend: "commercial-api", model: "remote-model" }),
  (error) => error instanceof LanguageBackendError && error.code === "UNSUPPORTED_BACKEND"
);
console.log("PASS: adaptador Ollama local y validación fail-closed preservan propuestas sin autoridad");
