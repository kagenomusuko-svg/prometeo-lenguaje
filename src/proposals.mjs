export class LanguageError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "LanguageError";
    this.code = code;
  }
}

function requiredString(value, field) {
  if (typeof value !== "string" || value.length === 0) {
    throw new LanguageError("MISSING_FIELD", field + " must be a non-empty string");
  }
}

function object(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new LanguageError("INVALID_OBJECT", field + " must be an object");
  }
}

function provenance(actorId, recordedAt) {
  return {
    kind: "language-agent",
    actorId,
    recordedAt,
    reason: "Registered as a language proposal; human confirmation required",
  };
}

export function registerLanguageProposals({
  document,
  propositions,
  candidates = [],
  hypotheses = [],
  context = null,
  agentId = "prometeo-lenguaje",
  recordedAt,
  allowAbstention = false,
}) {
  object(document, "document");
  requiredString(document.id, "document.id");
  requiredString(agentId, "agentId");
  requiredString(recordedAt, "recordedAt");

  if (context !== null) {
    object(context, "context");
    if (!["map-locators-only", "source-text-read"].includes(context.contextStatus)) {
      throw new LanguageError("INVALID_CONTEXT", "context must be a locator map or a canonical source read");
    }
    if (!context.provenance || context.provenance.kind !== "deterministic-system") {
      throw new LanguageError("INVALID_CONTEXT_PROVENANCE", "context provenance must be deterministic");
    }
    requiredString(context.mapVersion, "context.mapVersion");
    if (context.contextStatus === "map-locators-only") {
      if (context.requiresSourceReading !== true || !Array.isArray(context.matches)) {
        throw new LanguageError("INVALID_CONTEXT", "locator context must require source reading and contain matches");
      }
    } else {
      if (context.requiresSourceReading !== false || !Array.isArray(context.sources)) {
        throw new LanguageError("INVALID_CONTEXT", "read context must contain canonical sources and not require another read");
      }
      for (const source of context.sources) {
        object(source, "context.sources[]");
        requiredString(source.id, "context.sources[].id");
        requiredString(source.sourceRef, "context.sources[].sourceRef");
        requiredString(source.sourceVersion, "context.sources[].sourceVersion");
        requiredString(source.text, "context.sources[].text");
        if (source.contextOnly !== true) {
          throw new LanguageError("INVALID_CONTEXT", "canonical sources must remain context-only");
        }
      }
    }
  }
  if (!Array.isArray(propositions) || (propositions.length === 0 && allowAbstention !== true)) {
    throw new LanguageError("MISSING_PROPOSITIONS", "at least one proposition is required unless the analysis explicitly abstains");
  }
  if (!Array.isArray(candidates) || !Array.isArray(hypotheses)) {
    throw new LanguageError("INVALID_PROPOSAL_SET", "candidates and hypotheses must be arrays");
  }

  const fragmentIds = new Set((document.fragments || []).map((fragment) => fragment.id));
  const propositionIds = new Set();
  const candidateIds = new Set();

  const normalizedPropositions = propositions.map((item, index) => {
    object(item, "propositions[" + index + "]");
    requiredString(item.id, "propositions[" + index + "].id");
    requiredString(item.fragmentId, "propositions[" + index + "].fragmentId");
    requiredString(item.text, "propositions[" + index + "].text");
    if (!["asserted", "reported", "inferred", "possible", "obligatory", "denied", "unknown"].includes(item.modality)) {
      throw new LanguageError("INVALID_MODALITY", "propositions[" + index + "].modality must match the contract");
    }
    if (!fragmentIds.has(item.fragmentId)) {
      throw new LanguageError("UNKNOWN_FRAGMENT", item.fragmentId);
    }
    if (item.state && item.state !== "proposed") {
      throw new LanguageError("IMPLICIT_PROMOTION", "language output must remain proposed");
    }
    if (propositionIds.has(item.id)) {
      throw new LanguageError("DUPLICATE_ID", item.id);
    }
    propositionIds.add(item.id);
    return {
      id: item.id,
      fragmentId: item.fragmentId,
      text: item.text,
      modality: item.modality,
      state: "proposed",
      provenance: provenance(agentId, recordedAt),
    };
  });

  const normalizedCandidates = candidates.map((item, index) => {
    object(item, "candidates[" + index + "]");
    requiredString(item.id, "candidates[" + index + "].id");
    requiredString(item.propositionId, "candidates[" + index + "].propositionId");
    requiredString(item.category, "candidates[" + index + "].category");
    if (!["actor", "event", "state", "condition", "relation", "omission"].includes(item.category)) {
      throw new LanguageError("INVALID_CATEGORY", "candidates[" + index + "].category must match the contract");
    }
    requiredString(item.label, "candidates[" + index + "].label");
    if (item.attributes !== undefined && (!item.attributes || typeof item.attributes !== "object" || Array.isArray(item.attributes))) {
      throw new LanguageError("INVALID_ATTRIBUTES", "candidates[" + index + "].attributes must be an object");
    }
    if (item.confidence !== undefined && (typeof item.confidence !== "number" || !Number.isFinite(item.confidence) || item.confidence < 0 || item.confidence > 1)) {
      throw new LanguageError("INVALID_CONFIDENCE", "candidates[" + index + "].confidence must be between 0 and 1");
    }
    if (item.ambiguity !== undefined && (!Array.isArray(item.ambiguity) || item.ambiguity.some((value) => typeof value !== "string"))) {
      throw new LanguageError("INVALID_AMBIGUITY", "candidates[" + index + "].ambiguity must be an array of strings");
    }
    if (!propositionIds.has(item.propositionId)) {
      throw new LanguageError("UNKNOWN_PROPOSITION", item.propositionId);
    }
    if (item.state && item.state !== "proposed") {
      throw new LanguageError("IMPLICIT_PROMOTION", "language output must remain proposed");
    }
    if (candidateIds.has(item.id)) {
      throw new LanguageError("DUPLICATE_ID", item.id);
    }
    candidateIds.add(item.id);
    return {
      id: item.id,
      propositionId: item.propositionId,
      category: item.category,
      label: item.label,
      attributes: item.attributes ?? {},
      ...(item.confidence === undefined ? {} : { confidence: item.confidence }),
      ...(item.ambiguity === undefined ? {} : { ambiguity: item.ambiguity }),
      state: "proposed",
      provenance: provenance(agentId, recordedAt),
    };
  });

  const normalizedHypotheses = hypotheses.map((item, index) => {
    object(item, "hypotheses[" + index + "]");
    requiredString(item.id, "hypotheses[" + index + "].id");
    requiredString(item.caseId, "hypotheses[" + index + "].caseId");
    requiredString(item.label, "hypotheses[" + index + "].label");
    if (document.caseId && item.caseId !== document.caseId) {
      throw new LanguageError("CASE_MISMATCH", item.caseId);
    }
    if (!Array.isArray(item.candidateIds ?? []) || !Array.isArray(item.relationIds ?? [])) {
      throw new LanguageError("INVALID_HYPOTHESIS_REFERENCES", "candidateIds and relationIds must be arrays");
    }
    if (item.status && item.status !== "proposed") {
      throw new LanguageError("IMPLICIT_PROMOTION", "hypotheses must remain proposed");
    }
    for (const candidateId of item.candidateIds || []) {
      if (!candidateIds.has(candidateId)) {
        throw new LanguageError("UNKNOWN_CANDIDATE", candidateId);
      }
    }
    return {
      id: item.id,
      caseId: item.caseId,
      label: item.label,
      candidateIds: item.candidateIds ?? [],
      relationIds: item.relationIds ?? [],
      status: "proposed",
      provenance: provenance(agentId, recordedAt),
    };
  });

  return {
    documentId: document.id,
    contextReferences: context === null ? [] : (
      context.contextStatus === "map-locators-only"
        ? context.matches.map((match) => ({
          id: match.id,
          category: match.category,
          locator: match.locator ?? null,
          evidenceStatus: match.evidenceStatus ?? "unclassified",
          mapVersion: context.mapVersion,
          sourceRef: context.provenance.sourceObjectId,
        }))
        : context.sources.map((source) => ({
          id: source.id,
          category: source.category,
          locator: source.locator ?? null,
          evidenceStatus: source.mapEvidenceStatus ?? "unclassified",
          mapVersion: context.mapVersion,
          sourceRef: source.sourceRef,
          sourceVersion: source.sourceVersion,
          contextOnly: true,
        }))
    ),
    contextSources: context?.contextStatus === "source-text-read"
      ? context.sources.map((source) => ({
        id: source.id,
        category: source.category,
        label: source.label,
        locator: source.locator,
        text: source.text,
        sourceRef: source.sourceRef,
        sourceVersion: source.sourceVersion,
        contextOnly: true,
      }))
      : [],

    propositions: normalizedPropositions,
    candidates: normalizedCandidates,
    hypotheses: normalizedHypotheses,
    requiresHumanConfirmation: true,
    provenance: provenance(agentId, recordedAt),
  };
}

function validateGeneratedSet(generated) {
  object(generated, "generated");
  const allowed = new Set(["propositions", "candidates", "hypotheses", "questions", "abstentions"]);
  for (const key of Object.keys(generated)) {
    if (!allowed.has(key)) {
      throw new LanguageError("UNAUTHORIZED_OUTPUT_FIELD", key);
    }
  }
  for (const key of allowed) {
    if (!Array.isArray(generated[key])) {
      throw new LanguageError("INVALID_GENERATED_SET", key + " must be an array");
    }
  }
  if (generated.propositions.length === 0 && generated.abstentions.length === 0) {
    throw new LanguageError("EMPTY_ANALYSIS", "empty proposals require an explicit abstention");
  }

  const authorityKeys = new Set([
    "evidence", "analystdecision", "confirmedmodel", "motorrequest", "motorresult", "calculationtrace"
  ]);
  function rejectAuthorityFields(value, path = "generated") {
    if (!value || typeof value !== "object") return;
    for (const [key, nested] of Object.entries(value)) {
      const normalizedKey = key.toLocaleLowerCase().replace(/[_-]/gu, "");
      if (authorityKeys.has(normalizedKey)) {
        throw new LanguageError("UNAUTHORIZED_OUTPUT_FIELD", path + "." + key);
      }
      rejectAuthorityFields(nested, path + "." + key);
    }
  }
  rejectAuthorityFields(generated);

  function exactShape(value, field, required, optional = []) {
    object(value, field);
    const allowedKeys = new Set([...required, ...optional]);
    for (const key of required) {
      if (!Object.hasOwn(value, key)) throw new LanguageError("MISSING_FIELD", field + "." + key + " is required");
    }
    for (const key of Object.keys(value)) {
      if (!allowedKeys.has(key)) throw new LanguageError("UNAUTHORIZED_OUTPUT_FIELD", field + "." + key);
    }
  }

  const propositionIds = new Set();
  generated.propositions.forEach((item, index) => {
    const field = "propositions[" + index + "]";
    exactShape(item, field, ["id", "fragmentId", "text", "modality"], ["state"]);
    requiredString(item.id, field + ".id");
    if (propositionIds.has(item.id)) throw new LanguageError("DUPLICATE_ID", item.id);
    propositionIds.add(item.id);
  });

  const candidateIds = new Set();
  generated.candidates.forEach((item, index) => {
    const field = "candidates[" + index + "]";
    exactShape(item, field, ["id", "propositionId", "category", "label"], ["attributes", "confidence", "ambiguity", "state"]);
    requiredString(item.id, field + ".id");
    if (candidateIds.has(item.id)) throw new LanguageError("DUPLICATE_ID", item.id);
    candidateIds.add(item.id);
  });

  generated.hypotheses.forEach((item, index) => {
    const field = "hypotheses[" + index + "]";
    exactShape(item, field, ["id", "caseId", "label"], ["candidateIds", "relationIds", "status"]);
  });

  const questionIds = new Set();
  generated.questions.forEach((question, index) => {
    const field = "questions[" + index + "]";
    exactShape(question, field, ["id", "text", "reason"]);
    requiredString(question.id, field + ".id");
    requiredString(question.text, field + ".text");
    requiredString(question.reason, field + ".reason");
    if (questionIds.has(question.id)) throw new LanguageError("DUPLICATE_ID", question.id);
    questionIds.add(question.id);
  });
  generated.abstentions.forEach((abstention, index) => {
    const field = "abstentions[" + index + "]";
    exactShape(abstention, field, ["scope", "reason"]);
    if (!["document", "proposition", "candidate", "hypothesis", "relation"].includes(abstention.scope)) {
      throw new LanguageError("INVALID_ABSTENTION", field + ".scope is invalid");
    }
    requiredString(abstention.reason, field + ".reason");
  });
}

/**
 * Ask an injected language backend for candidate structures, then enforce
 * the shared proposal boundary before exposing the result.
 */
export async function analyzeDocument({
  backend,
  document,
  context = null,
  agentId = "prometeo-lenguaje",
  recordedAt,
}) {
  if (!backend || typeof backend.propose !== "function") {
    throw new LanguageError("BACKEND_REQUIRED", "backend.propose must be a function");
  }
  object(document, "document");
  requiredString(document.id, "document.id");
  requiredString(recordedAt, "recordedAt");

  const generated = await backend.propose({ document, context });
  validateGeneratedSet(generated);
  const registered = registerLanguageProposals({
    document,
    context,
    propositions: generated.propositions,
    candidates: generated.candidates,
    hypotheses: generated.hypotheses,
    agentId,
    recordedAt,
    allowAbstention: generated.propositions.length === 0 && generated.abstentions.length > 0,
  });

  return {
    ...registered,
    questions: generated.questions,
    abstentions: generated.abstentions,
    analysisStatus: generated.propositions.length === 0 ? "abstained" : "proposals-produced",
  };
}
