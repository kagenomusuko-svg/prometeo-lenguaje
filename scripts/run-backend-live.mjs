import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createLanguageBackend } from "../src/backends/ollama.mjs";
import { analyzeDocument } from "../src/proposals.mjs";

const model = process.env.PROMETEO_LANGUAGE_MODEL;
const reportPath = resolve(process.env.GITHUB_WORKSPACE || ".", "benchmark-results/backend-live.json");
const startedAt = new Date().toISOString();
let report;

try {
  const backend = createLanguageBackend({
    backend: process.env.PROMETEO_LANGUAGE_BACKEND,
    model,
    baseUrl: process.env.OLLAMA_BASE_URL
  });
  const document = {
    id: "backend-live-smoke",
    caseId: "backend-live-synthetic",
    fragments: [{ id: "backend-live-smoke:f1", text: "El registro indica que el equipo apagó la bomba a las 14:00." }]
  };
  const result = await analyzeDocument({ backend, document, recordedAt: startedAt });
  if (result.requiresHumanConfirmation !== true) throw new Error("human confirmation invariant failed");
  if (!["proposals-produced", "abstained"].includes(result.analysisStatus)) throw new Error("unexpected analysis status");
  if (result.analysisStatus === "proposals-produced" && result.propositions.length === 0) throw new Error("missing validated proposals");
  if (result.propositions.some((item) => item.state !== "proposed")) throw new Error("non-proposed proposition returned");
  report = {
    status: "PASS", test: "backend-live", backend: "ollama-local", model, startedAt,
    completedAt: new Date().toISOString(), analysisStatus: result.analysisStatus,
    propositionCount: result.propositions.length, candidateCount: result.candidates.length,
    hypothesisCount: result.hypotheses.length, questionCount: result.questions.length,
    abstentionCount: result.abstentions.length, requiresHumanConfirmation: result.requiresHumanConfirmation,
    syntheticInputOnly: true, contractValidation: "PASS"
  };
} catch (error) {
  report = {
    status: "FAIL", test: "backend-live", backend: "ollama-local", model: model || null,
    startedAt, completedAt: new Date().toISOString(), errorCode: error.code || "BACKEND_LIVE_FAILED",
    error: error.message, syntheticInputOnly: true
  };
}

await mkdir(resolve(reportPath, ".."), { recursive: true });
await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
if (report.status !== "PASS") process.exitCode = 1;
