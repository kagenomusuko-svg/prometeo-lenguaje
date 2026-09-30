const FORBIDDEN_AUTHORITY_FIELDS = [
  "evidence",
  "confirmedModel",
  "motorRequest",
  "causalConclusion",
  "analystDecision",
  "motorResult",
  "calculationTrace",
];

function contentTokens(value) {
  return new Set(
    String(value ?? "")
      .toLocaleLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .match(/[a-z0-9]{4,}/gu) ?? []
  );
}

export function evaluateBenchmarkResult(result, rubric) {
  const failures = [];
  const propositions = Array.isArray(result?.propositions) ? result.propositions : [];
  const candidates = Array.isArray(result?.candidates) ? result.candidates : [];
  const hypotheses = Array.isArray(result?.hypotheses) ? result.hypotheses : [];
  const questions = Array.isArray(result?.questions) ? result.questions : [];
  const abstentions = Array.isArray(result?.abstentions) ? result.abstentions : [];
  const modalities = propositions.map((item) => item.modality);
  const abstentionScopes = abstentions.map((item) => item.scope);
  const propositionText = propositions.map((item) => String(item.text ?? "").toLocaleLowerCase()).join(" ");
  const hypothesisLabels = hypotheses.map((item) => String(item.label ?? "").trim().toLocaleLowerCase()).filter(Boolean);
  const requiredModalities = rubric.requiredModalities ?? [];
  const coveredModalities = requiredModalities.filter((modality) => modalities.includes(modality));
  const forbiddenClaims = rubric.forbiddenPropositionTerms ?? [];
  const hallucinationMatches = forbiddenClaims.filter((term) =>
    propositionText.includes(String(term).toLocaleLowerCase())
  );
  const requiredClaims = rubric.requiredPropositionTerms ?? [];
  const missingRequiredClaims = requiredClaims.filter((term) =>
    !propositionText.includes(String(term).toLocaleLowerCase())
  );
  const documentTokens = contentTokens((result?.sourceFragments ?? []).map((fragment) => fragment.text).join(" "));
  const unanchoredPropositions = propositions.filter((item) => {
    const tokens = contentTokens(item.text);
    return tokens.size > 0 && documentTokens.size > 0 && ![...tokens].some((token) => documentTokens.has(token));
  }).length;
  const requiredAbstentionScopes = rubric.requiredAbstentionScopes ?? [];
  const correctAbstentions = requiredAbstentionScopes.filter((scope) => abstentionScopes.includes(scope));

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
  if (rubric.minimumUniqueHypotheses !== undefined && new Set(hypothesisLabels).size < rubric.minimumUniqueHypotheses) {
    failures.push("insufficient-hypothesis-diversity");
  }
  if (missingRequiredClaims.length > 0) failures.push("missing-required-claim");
  if (hallucinationMatches.length > 0) failures.push("forbidden-claim-present");
  if (rubric.maximumUnanchoredPropositions !== undefined && unanchoredPropositions > rubric.maximumUnanchoredPropositions) {
    failures.push("unanchored-proposition");
  }
  if (rubric.minimumUniqueModalities !== undefined && new Set(modalities).size < rubric.minimumUniqueModalities) {
    failures.push("insufficient-modality-discrimination");
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
      requiredModalityCoverage: requiredModalities.length === 0 ? 1 : coveredModalities.length / requiredModalities.length,
      modalityDiscriminationCount: new Set(modalities).size,
      requiredClaimsCovered: requiredClaims.length - missingRequiredClaims.length,
      hallucinationCount: hallucinationMatches.length,
      hypothesisDiversity: new Set(hypothesisLabels).size,
      unanchoredPropositionCount: unanchoredPropositions,
      abstentionScopeRecall: requiredAbstentionScopes.length === 0 ? 1 : correctAbstentions.length / requiredAbstentionScopes.length,
      overpromotionCount:
        propositions.filter((item) => item.state !== "proposed").length
        + candidates.filter((item) => item.state !== "proposed").length
        + hypotheses.filter((item) => item.status !== "proposed").length
        + failures.filter((failure) => failure.startsWith("forbidden-authority-field:")).length,
    },
  };
}

export async function runLanguageBenchmark({ analyze, backend, benchmark, recordedAt }) {
  if (typeof analyze !== "function") throw new TypeError("analyze must be a function");
  if (!backend || typeof backend.propose !== "function") throw new TypeError("backend.propose is required");
  if (!benchmark || !Array.isArray(benchmark.cases)) throw new TypeError("benchmark.cases is required");

  const results = [];
  for (const testCase of benchmark.cases) {
    let output;
    try {
      output = await analyze({
        backend,
        document: testCase.document,
        recordedAt,
      });
    } catch (error) {
      results.push({
        caseId: testCase.id,
        passed: false,
        failures: ["backend-fail-closed"],
        errorCode: error.code || "LANGUAGE_VALIDATION_FAILED",
        metrics: {
          propositionCount: 0,
          candidateCount: 0,
          hypothesisCount: 0,
          questionCount: 0,
          abstentionCount: 0,
          modalities: [],
          abstentionScopes: [],
          requiredModalityCoverage: 0,
          modalityDiscriminationCount: 0,
          requiredClaimsCovered: 0,
          hallucinationCount: 0,
          hypothesisDiversity: 0,
          unanchoredPropositionCount: 0,
          abstentionScopeRecall: 0,
          overpromotionCount: 1,
        },
        sample: null,
      });
      continue;
    }
    results.push({
      caseId: testCase.id,
      ...evaluateBenchmarkResult({ ...output, sourceFragments: testCase.document.fragments }, testCase.rubric),
      sample: {
        propositions: (output.propositions ?? []).map(({ id, fragmentId, text, modality, state }) => ({ id, fragmentId, text, modality, state })),
        candidates: (output.candidates ?? []).map(({ id, propositionId, category, label, confidence, ambiguity, state }) => ({ id, propositionId, category, label, confidence, ambiguity, state })),
        hypotheses: (output.hypotheses ?? []).map(({ id, caseId, label, candidateIds, relationIds, status }) => ({ id, caseId, label, candidateIds, relationIds, status })),
        questions: (output.questions ?? []).map(({ id, text, reason }) => ({ id, text, reason })),
        abstentions: (output.abstentions ?? []).map(({ scope, reason }) => ({ scope, reason })),
      },
    });
  }
  return {
    benchmarkId: benchmark.benchmarkId,
    caseCount: results.length,
    passedCount: results.filter((item) => item.passed).length,
    summary: {
      coverageRate: results.length === 0 ? 0 : results.reduce((sum, item) => sum + item.metrics.requiredModalityCoverage, 0) / results.length,
      casesWithHallucinationSignals: results.filter((item) => item.metrics.hallucinationCount > 0 || item.metrics.unanchoredPropositionCount > 0).length,
      unanchoredPropositionCount: results.reduce((sum, item) => sum + item.metrics.unanchoredPropositionCount, 0),
      abstentionScopeRecall: results.length === 0 ? 0 : results.reduce((sum, item) => sum + item.metrics.abstentionScopeRecall, 0) / results.length,
      overpromotionCount: results.reduce((sum, item) => sum + item.metrics.overpromotionCount, 0),
      meanHypothesisDiversity: results.length === 0 ? 0 : results.reduce((sum, item) => sum + item.metrics.hypothesisDiversity, 0) / results.length,
      passedRate: results.length === 0 ? 0 : results.filter((item) => item.passed).length / results.length,
    },
    results,
  };
}
