import { LanguageBackend, LanguageBackendError } from "../backend.mjs";

const PROPOSAL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["propositions", "candidates", "hypotheses", "questions", "abstentions"],
  properties: {
    propositions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "fragmentId", "text", "modality"],
        properties: {
          id: { type: "string" },
          fragmentId: { type: "string" },
          text: { type: "string" },
          modality: { type: "string", enum: ["asserted", "reported", "inferred", "possible", "obligatory", "denied", "unknown"] }
        }
      }
    },
    candidates: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "propositionId", "category", "label"],
        properties: {
          id: { type: "string" },
          propositionId: { type: "string" },
          category: { type: "string", enum: ["actor", "event", "state", "condition", "relation", "omission"] },
          label: { type: "string" },
          attributes: { type: "object" },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          ambiguity: { type: "array", items: { type: "string" } }
        }
      }
    },
    hypotheses: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "caseId", "label", "candidateIds", "relationIds"],
        properties: {
          id: { type: "string" },
          caseId: { type: "string" },
          label: { type: "string" },
          candidateIds: { type: "array", items: { type: "string" } },
          relationIds: { type: "array", items: { type: "string" } }
        }
      }
    },
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "text", "reason"],
        properties: { id: { type: "string" }, text: { type: "string" }, reason: { type: "string" } }
      }
    },
    abstentions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["scope", "reason"],
        properties: {
          scope: { type: "string", enum: ["document", "proposition", "candidate", "hypothesis", "relation"] },
          reason: { type: "string" }
        }
      }
    }
  }
};

const SYSTEM_PROMPT = [
  "Eres un backend lingüístico local de Prometeo.",
  "Sólo propones estructuras tentativas basadas en fragmentos recibidos; no decides hechos ni causalidad.",
  "Conserva exactamente la modalidad epistémica expresada. Distingue lo afirmado por el documento de lo reportado, inferido, posible, obligatorio, negado o desconocido.",
  "No completes vacíos con conocimiento externo. Formula preguntas, alternativas y abstenciones cuando la fuente no permita una propuesta responsable.",
  "No promuevas nada: no emitas decisiones humanas, modelos confirmados ni solicitudes o resultados matemáticos.",
  "Cada id será único dentro de su colección: usa p1, p2 para proposiciones; c1, c2 para candidatos; h1, h2 para hipótesis; q1, q2 para preguntas. No reutilices un id para dos objetos de la misma colección. fragmentId debe ser siempre el id de un fragmento existente; propositionId debe apuntar al id de una proposición.",
  "Si una fuente atribuye una afirmación a alguien, conserva esa atribución con modalidad reported. Si dentro de esa afirmación algo sólo pudo ocurrir, conserva también su modalidad possible; no conviertas lo posible en hecho.",
  "Si el texto es ilegible o declara que faltan datos, no completes vacíos ni construyas candidatos especulativos: abstente en el alcance pertinente y formula sólo preguntas que pidan la información faltante.",
  "Propón únicamente candidatos semánticamente distintos y sostenidos por el texto; no multipliques paráfrasis como candidatos separados. Devuelve únicamente el objeto JSON conforme al esquema."
].join(" ");

function validateLoopbackBaseUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new LanguageBackendError("INVALID_OLLAMA_URL", "OLLAMA_BASE_URL must be a valid URL");
  }
  const loopbackHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
  if (url.protocol !== "http:" || !loopbackHosts.has(url.hostname) || url.username || url.password) {
    throw new LanguageBackendError(
      "NON_LOCAL_OLLAMA_URL",
      "Ollama must use unauthenticated HTTP on localhost or a loopback address"
    );
  }
  return url;
}

export class OllamaLanguageBackend extends LanguageBackend {
  constructor({ model, baseUrl = "http://127.0.0.1:11434", fetchImpl = globalThis.fetch }) {
    super();
    if (typeof model !== "string" || model.trim().length === 0) {
      throw new LanguageBackendError("MODEL_REQUIRED", "PROMETEO_LANGUAGE_MODEL must name an installed local model");
    }
    if (typeof fetchImpl !== "function") {
      throw new LanguageBackendError("FETCH_REQUIRED", "fetch must be available");
    }
    this.model = model.trim();
    this.baseUrl = validateLoopbackBaseUrl(baseUrl);
    this.fetchImpl = fetchImpl;
  }

  async propose({ document, context = null }) {
    const endpoint = new URL("/api/chat", this.baseUrl);
    let response;
    try {
      response = await this.fetchImpl(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          stream: false,
          format: PROPOSAL_SCHEMA,
          options: { temperature: 0 },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: JSON.stringify({ document, context }) }
          ]
        })
      });
    } catch {
      throw new LanguageBackendError("OLLAMA_UNAVAILABLE", "Could not reach the local Ollama service");
    }
    if (!response?.ok) {
      throw new LanguageBackendError("OLLAMA_REQUEST_FAILED", "Local Ollama returned HTTP " + (response?.status ?? "unknown"));
    }

    let envelope;
    try {
      envelope = await response.json();
    } catch {
      throw new LanguageBackendError("INVALID_OLLAMA_RESPONSE", "Local Ollama response was not valid JSON");
    }
    const content = envelope?.message?.content;
    if (typeof content !== "string" || content.length === 0) {
      throw new LanguageBackendError("MISSING_MODEL_OUTPUT", "Local Ollama returned no structured message content");
    }
    try {
      return JSON.parse(content);
    } catch {
      throw new LanguageBackendError("INVALID_MODEL_JSON", "Local model output was not valid JSON");
    }
  }
}

export function createLanguageBackend({
  backend = process.env.PROMETEO_LANGUAGE_BACKEND,
  model = process.env.PROMETEO_LANGUAGE_MODEL,
  baseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
  fetchImpl = globalThis.fetch
} = {}) {
  if (backend !== "ollama") {
    throw new LanguageBackendError("UNSUPPORTED_BACKEND", "PROMETEO_LANGUAGE_BACKEND must be set to ollama");
  }
  return new OllamaLanguageBackend({ model, baseUrl, fetchImpl });
}

export const ollamaProposalSchema = PROPOSAL_SCHEMA;
