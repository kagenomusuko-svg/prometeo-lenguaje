import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { evaluateBenchmarkResult, runLanguageBenchmark } from "../src/benchmark.mjs";
import { analyzeDocument } from "../src/proposals.mjs";

const benchmark = JSON.parse(await readFile(new URL("../fixtures/language-benchmark.json", import.meta.url), "utf8"));
assert.equal(benchmark.benchmarkId, "prometeo-language-boundary-v1");
assert.equal(benchmark.cases.length, 5);
assert.ok(benchmark.cases.every((item) => item.document.fragments.length > 0));

const sample = {
  requiresHumanConfirmation: true,
  propositions: [{ modality: "reported", state: "proposed" }],
  candidates: [],
  hypotheses: [],
  questions: [{ id: "q1" }],
  abstentions: [{ scope: "document" }],
};
const passing = evaluateBenchmarkResult(sample, {
  requiredModalities: ["reported"],
  minimumPropositions: 1,
  minimumQuestions: 1,
  requiredAbstentionScopes: ["document"],
});
assert.equal(passing.passed, true);
assert.equal(passing.metrics.hypothesisDiversity, 0, "one hypothesis has no pairwise diversity");
const diverse = evaluateBenchmarkResult({
  ...sample,
  hypotheses: [
    { id: "h1", label: "El registro reporta puerta cerrada", status: "proposed" },
    { id: "h2", label: "El informe describe válvula abierta", status: "proposed" },
  ],
}, {});
assert.equal(diverse.metrics.hypothesisDiversity, 1, "disjoint hypothesis terms have maximal lexical distance");
const redundant = evaluateBenchmarkResult({
  ...sample,
  hypotheses: [
    { id: "h1", label: "El registro reporta puerta cerrada", status: "proposed" },
    { id: "h2", label: "El registro reporta puerta cerrada", status: "proposed" },
  ],
}, {});
assert.equal(redundant.metrics.hypothesisDiversity, 0, "identical hypotheses have no diversity");

const violating = evaluateBenchmarkResult({
  ...sample,
  propositions: [{ modality: "obligatory", state: "confirmed", text: "Omar incumplió una obligación" }],
  confirmedModel: { id: "unauthorized" },
}, {
  requiredModalities: ["reported"],
  forbiddenModalities: ["obligatory"],
  forbiddenPropositionTerms: ["Omar incumplió una obligación"],
  minimumUniqueHypotheses: 2,
});
assert.equal(violating.passed, false);
assert.ok(violating.failures.includes("forbidden-modality:obligatory"));
assert.ok(violating.failures.includes("non-proposed-proposition"));
assert.ok(violating.failures.includes("forbidden-authority-field:confirmedModel"));
assert.ok(violating.failures.includes("forbidden-claim-present"));
assert.ok(violating.failures.includes("insufficient-hypothesis-diversity"));
assert.equal(violating.metrics.hallucinationCount, 1);
assert.equal(violating.metrics.overpromotionCount, 2);

const runnable = {
  benchmarkId: "benchmark-runner-test",
  cases: [{
    id: "case-1",
    document: { id: "doc-1", fragments: [{ id: "doc-1:f1", text: "Se reporta un hecho." }] },
    rubric: { requiredModalities: ["reported"], minimumPropositions: 1 },
  }],
};
const report = await runLanguageBenchmark({
  analyze: analyzeDocument,
  benchmark: runnable,
  recordedAt: "2026-09-29T22:00:00Z",
  backend: {
    async propose({ document }) {
      return {
        propositions: [{ id: "p1", fragmentId: document.fragments[0].id, text: "Se reporta un hecho.", modality: "reported" }],
        candidates: [],
        hypotheses: [],
        questions: [],
        abstentions: [],
      };
    },
  },
});
assert.equal(report.caseCount, 1);
assert.equal(report.passedCount, 1);
assert.equal(report.results[0].passed, true);
assert.equal(report.summary.coverageRate, 1);
assert.equal(report.summary.casesWithHallucinationSignals, 0);
assert.equal(report.results[0].sample.propositions[0].text, "Se reporta un hecho.");

const failClosedBenchmark = {
  benchmarkId: "benchmark-fail-closed-test",
  cases: [
    { id: "invalid-output", document: { id: "doc-bad", fragments: [{ id: "doc-bad:f1", text: "No guardar salida prohibida." }] }, rubric: {} },
    { id: "duplicate-id", document: { id: "doc-duplicate", fragments: [{ id: "doc-duplicate:f1", text: "El ID está duplicado." }] }, rubric: {} },
    runnable.cases[0],
  ],
};
let analysisCall = 0;
const failClosedReport = await runLanguageBenchmark({
  analyze: async () => {
    analysisCall += 1;
    if (analysisCall === 1) {
      const error = new Error("generated.confirmedModel is forbidden");
      error.code = "UNAUTHORIZED_OUTPUT_FIELD";
      throw error;
    }
    if (analysisCall === 2) {
      const error = new Error("duplicate proposition id");
      error.code = "DUPLICATE_ID";
      throw error;
    }
    return {
      documentId: "doc-1",
      requiresHumanConfirmation: true,
      propositions: [{ id: "p1", fragmentId: "doc-1:f1", text: "Se reporta un hecho.", modality: "reported", state: "proposed" }],
      candidates: [],
      hypotheses: [],
      questions: [],
      abstentions: [],
    };
  },
  benchmark: failClosedBenchmark,
  recordedAt: "2026-09-29T22:00:00Z",
  backend: { async propose() { return {}; } },
});
assert.equal(failClosedReport.caseCount, 3);
assert.equal(failClosedReport.passedCount, 1);
assert.equal(failClosedReport.results[0].errorCode, "UNAUTHORIZED_OUTPUT_FIELD");
assert.equal(failClosedReport.results[0].failures[0], "backend-fail-closed");
assert.equal(failClosedReport.results[0].sample, null);
assert.equal(failClosedReport.results[0].metrics.overpromotionCount, 1);
assert.equal(failClosedReport.results[1].errorCode, "DUPLICATE_ID");
assert.equal(failClosedReport.results[1].metrics.overpromotionCount, 0);
assert.equal(failClosedReport.results[2].passed, true);
assert.equal(failClosedReport.summary.overpromotionCount, 1);
assert.equal(failClosedReport.summary.passedRate, 1/3);

console.log("PASS: benchmark lingüístico mide cobertura, modalidad y límites sin confundir fixtures con calidad real");
