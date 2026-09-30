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

const violating = evaluateBenchmarkResult({
  ...sample,
  propositions: [{ modality: "obligatory", state: "confirmed" }],
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
assert.equal(violating.metrics.overpromotionCount, 1);

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
assert.equal(report.summary.hallucinations, undefined);

console.log("PASS: benchmark lingüístico mide cobertura, modalidad y límites sin confundir fixtures con calidad real");
