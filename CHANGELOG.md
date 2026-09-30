# Changelog

## 2026-09-29
- Se habilita el uso de texto canónico leído como contexto separado, con proveniencia de fuente y versión.
- Se añade integración contexto → lectura canónica → lenguaje y se fija el commit de promete-contexto en CI.
- Se conserva la prohibición de convertir contexto en evidencia o de promover propuestas.
- Se documentan instrucciones reproducibles de desarrollo y pruebas.
- Se añade analyzeDocument, una frontera inyectable para backend de propuestas, preguntas, alternativas y abstenciones.
- El adaptador valida modalidades, categorías y referencias, mantiene todas las salidas en estado propuesto y rechaza campos de autoridad.
- La prueba del backend se incorpora a npm test; sus fixtures no sustituyen la evaluación sustantiva con un modelo real.
- Se incorpora un benchmark sintético trazable de cinco casos y un evaluador de cobertura, modalidad, alternativas, preguntas, abstención y límites de autoridad; el backend fixture valida el instrumento, no la calidad de un modelo real.

## 2026-09-30
- Se establece la interfaz `LanguageBackend` y se añade un adaptador `ollama` que sólo llama a un servicio loopback.
- La validación fail-closed rechaza campos adicionales, decisiones y contratos de autoridad en la salida del modelo.
- Se añade configuración segura en `.env.example` y se ignoran `.env`, `.env.local` y reportes locales.
- El benchmark ampliado se ejecuta con `npm run benchmark:local` contra el modelo Ollama configurado y mide cobertura/modalidad, claims de alucinación, sobrepromoción, abstención y diversidad.
- El reporte local conserva muestras normalizadas de las propuestas para revisión humana, sólo sobre el dataset sintético fijo.
- `npm test` conserva pruebas deterministas; el CI no requiere servicios externos ni claves de proveedor lingüístico.

- Se añade workflow manual de Actions con Ollama efímero y `qwen2.5:1.5b`, separado en `backend-live` y `epistemic-benchmark`; conserva reportes descargables sin pedir ejecución local al propietario.
- Se añade auditoría manual GET-only que prueba el secreto ya configurado `PROMETEO_CONTEXT_TOKEN` para lectura del Paradigma fijado, sin revelar su valor ni duplicarlo.
