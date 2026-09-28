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
}) {
  object(document, "document");
  requiredString(document.id, "document.id");
  requiredString(agentId, "agentId");
  requiredString(recordedAt, "recordedAt");

  if (context !== null) {
    object(context, "context");
    if (context.contextStatus !== "map-locators-only") {
      throw new LanguageError("INVALID_CONTEXT", "context must contain map locators only");
    }
    if (context.requiresSourceReading !== true) {
      throw new LanguageError("INVALID_CONTEXT", "context must require source reading");
    }
    if (!context.provenance || context.provenance.kind !== "deterministic-system") {
      throw new LanguageError("INVALID_CONTEXT_PROVENANCE", "context provenance must be deterministic");
    }
    requiredString(context.mapVersion, "context.mapVersion");
    if (!Array.isArray(context.matches)) {
      throw new LanguageError("INVALID_CONTEXT", "context.matches must be an array");
    }
  }
  if (!Array.isArray(propositions) || propositions.length === 0) {
    throw new LanguageError("MISSING_PROPOSITIONS", "at least one proposition is required");
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
      ...item,
      state: "proposed",
      provenance: provenance(agentId, recordedAt),
    };
  });

  const normalizedCandidates = candidates.map((item, index) => {
    object(item, "candidates[" + index + "]");
    requiredString(item.id, "candidates[" + index + "].id");
    requiredString(item.propositionId, "candidates[" + index + "].propositionId");
    requiredString(item.category, "candidates[" + index + "].category");
    requiredString(item.label, "candidates[" + index + "].label");
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
      ...item,
      attributes: item.attributes ?? {},
      state: "proposed",
      provenance: provenance(agentId, recordedAt),
    };
  });

  const normalizedHypotheses = hypotheses.map((item, index) => {
    object(item, "hypotheses[" + index + "]");
    requiredString(item.id, "hypotheses[" + index + "].id");
    requiredString(item.caseId, "hypotheses[" + index + "].caseId");
    requiredString(item.label, "hypotheses[" + index + "].label");
    if (item.status && item.status !== "proposed") {
      throw new LanguageError("IMPLICIT_PROMOTION", "hypotheses must remain proposed");
    }
    for (const candidateId of item.candidateIds || []) {
      if (!candidateIds.has(candidateId)) {
        throw new LanguageError("UNKNOWN_CANDIDATE", candidateId);
      }
    }
    return {
      ...item,
      candidateIds: item.candidateIds ?? [],
      relationIds: item.relationIds ?? [],
      status: "proposed",
      provenance: provenance(agentId, recordedAt),
    };
  });

  return {
    documentId: document.id,
    contextReferences: context === null ? [] : context.matches.map((match) => ({
      id: match.id,
      category: match.category,
      locator: match.locator ?? null,
      evidenceStatus: match.evidenceStatus ?? "unclassified",
      mapVersion: context.mapVersion,
      sourceRef: context.provenance.sourceObjectId,
    })),

    propositions: normalizedPropositions,
    candidates: normalizedCandidates,
    hypotheses: normalizedHypotheses,
    requiresHumanConfirmation: true,
    provenance: provenance(agentId, recordedAt),
  };
}
