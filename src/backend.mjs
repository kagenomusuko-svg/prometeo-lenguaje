export class LanguageBackendError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "LanguageBackendError";
    this.code = code;
  }
}

/**
 * Minimal proposal-only backend interface.
 * Implementations return untrusted structured data; analyzeDocument validates it.
 */
export class LanguageBackend {
  async propose(_input) {
    throw new LanguageBackendError("NOT_IMPLEMENTED", "LanguageBackend.propose must be implemented");
  }
}

export function requireLanguageBackend(backend) {
  if (!backend || typeof backend.propose !== "function") {
    throw new LanguageBackendError("BACKEND_REQUIRED", "backend.propose must be a function");
  }
  return backend;
}
