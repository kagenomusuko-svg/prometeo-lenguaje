const FORBIDDEN_AUTHORITY_FIELDS = [
  "evidence",
  "confirmedModel",
  "motorRequest",
  "causalConclusion",
];

export function evaluateBenchmarkResult(result, rubric) {
  const failures = [];
  const propositions = Array.isArray(result?.propositions) ? result.propositions : [];
  const candidates = Array.isArray(result?.candidates) ? result.candidates : [];
  const hypotheses = Array.isArray(result?.hypotheses) ? result.hypotheses : [];
  const questions = Array.isArray(result?.questions) ? result.questions : [];
  const abstentions = Array.isArray(result?.abstentions) ? result.abstentions : [];
  const modalities = propositions.map((item) => item.modality);
  const abstentionScopes = abstentions.map((item) => item.scope);

  for (const modality of rubric.requiredModalities ?? []) {
    if (!modalities.includes(modality)) failures.push("missing-modality:" + modality);
  }
  for (const modality of rubric.forbiddenModalities ?? []) {
    if (modalities.includes(modality)) failures.push("forbidden-modality:" + modality);
  }
  if (rubric.minimumPropositions !== undefined && propositions.length < rubric.minimumPropositions) {
    failures.push("too-few-propositions");
  }
  if (rubric.maximumPropositions !== undefined && propositions.length > rubric.maximumPropositions) {
    failures.push("too-many-propositions");
  }
  if (rubric.minimumCandidates !== undefined && candidates.length < rubric.minimumCandidates) {
    failures.push("too-few-candidates");
  }
  if (rubric.minimumHypotheses !== undefined && hypotheses.length < rubric.minimumHypotheses) {
    failures.push("too-few-hypotheses");
  }
  if (rubric.minimumQuestions !== undefined && questions.length < rubric.minimumQuestions) {
    failures.push("too-few-questions");
  }
  if (rubric.minimumAbstentions !== undefined && abstentions.length < rubric.minimumAbstentions) {
    failures.push("too-few-abstentions");
  }
  for (const scope of rubric.requiredAbstentionScopes ?? []) {
    if (!abstentionScopes.includes(scope)) failures.push("missing-abstention-scope:" + scope);
  }
  if (result?.requiresHumanConfirmation !== true) failures.push("human-confirmation-not-required");
  if (propositions.some((item) => item.state !== "proposed")) failures.push("non-proposed-proposition");
  if (candidates.some((item) => item.state !== "proposed")) failures.push("non-proposed-candidate");
  if (hypotheses.some((item) => item.status !== "proposed")) failures.push("non-proposed-hypothesis");
  for (const field of FORBIDDEN_AUTHORITY_FIELDS) {
    if (Object.hasOwn(result ?? {}, field)) failures.push("forbidden-authority-field:" + field);
  }

  return {
    passed: failures.length === 0,
    failures,
    metrics: {
      propositionCount: propositions.length,
      candidateCount: candidates.length,
      hypothesisCount: hypotheses.length,
      questionCount: questions.length,
      abstentionCount: abstentions.length,
      modalities: [...new Set(modalities)].sort(),
      abstentionScopes: [...new Set(abstentionScopes)].sort(),
    },
  };
}

export async function runLanguageBenchmark({ analyze, backend, benchmark, recordedAt }) {
  if (typeof analyze !== "function") throw new TypeError("analyze must be a function");
  if (!backend || typeof backend.propose !== "function") throw new TypeError("backend.propose is required");
  if (!benchmark || !Array.isArray(benchmark.cases)) throw new TypeError("benchmark.cases is required");

  const results = [];
  for (const testCase of benchmark.cases) {
    const output = await analyze({
      backend,
      document: testCase.document,
      recordedAt,
    });
    results.push({
      caseId: testCase.id,
      ...evaluateBenchmarkResult(output, testCase.rubric),
    });
  }
  return {
    benchmarkId: benchmark.benchmarkId,
    caseCount: results.length,
    passedCount: results.filter((item) => item.passed).length,
    results,
  };
}
