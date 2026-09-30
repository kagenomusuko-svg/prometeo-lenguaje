import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createLanguageBackend } from "../src/backends/ollama.mjs";
import { runLanguageBenchmark } from "../src/benchmark.mjs";
import { analyzeDocument } from "../src/proposals.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function parseEnv(text) {
  const entries = {};
  for (const rawLine of text.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const normalized = line.startsWith("export ") ? line.slice(7) : line;
    const separator = normalized.indexOf("=");
    if (separator < 1) continue;
    const key = normalized.slice(0, separator).trim();
    let value = normalized.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    entries[key] = value;
  }
  return entries;
}

const localConfig = {};
for (const file of [".env", ".env.local"]) {
  try {
    Object.assign(localConfig, parseEnv(await readFile(resolve(root, file), "utf8")));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
const env = { ...localConfig, ...process.env };
const backend = createLanguageBackend({
  backend: env.PROMETEO_LANGUAGE_BACKEND,
  model: env.PROMETEO_LANGUAGE_MODEL,
  baseUrl: env.OLLAMA_BASE_URL
});
const benchmark = JSON.parse(await readFile(resolve(root, "fixtures/language-benchmark.json"), "utf8"));
const startedAt = new Date().toISOString();
const report = await runLanguageBenchmark({
  analyze: analyzeDocument,
  backend,
  benchmark,
  recordedAt: startedAt
});
const completedAt = new Date().toISOString();
const result = {
  benchmarkId: report.benchmarkId,
  backend: "ollama-local",
  model: backend.model,
  startedAt,
  completedAt,
  caseCount: report.caseCount,
  passedCount: report.passedCount,
  summary: report.summary,
  results: report.results
};
const filename = "benchmark-" + completedAt.replace(/[:.]/gu, "-") + ".json";
const outputPath = resolve(root, "benchmark-results", filename);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(result, null, 2) + "\n", { mode: 0o600 });
console.log(JSON.stringify({ ...result, reportPath: "benchmark-results/" + filename }, null, 2));
if (report.passedCount !== report.caseCount) process.exitCode = 1;
