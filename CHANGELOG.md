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

- Benchmark real en Actions, run `36745569690`: `backend-live` PASS con `qwen2.5:1.5b`; `epistemic-benchmark` FAIL, 0/5 casos, cobertura modal media 0.30. Los criterios permanecen sin cambios. Se asignó `qwen2.5:3b` a la ejecución siguiente.
- Las fallas contractuales por caso se reportan sin salida bruta y no interrumpen los casos posteriores. La métrica de sobrepromoción cuenta sólo intentos de autoridad/promoción, no errores de identificador.

- Benchmark real en Actions, run `36750502299`: `backend-live` PASS y benchmark FAIL, 1/5 con `qwen2.5:3b` (cobertura 0.80, abstención 0.60, sobrepromoción 0, diversidad 1.0, sin señales de alucinación/no anclaje). La rúbrica se mantiene; quedan brechas de modalidad anidada, alternativas y abstención por alcance.
- Se amplía la guía general del adaptador para separar afirmaciones, preservar modalidad incrustada, mantener relatos incompatibles como alternativas y abstenerse ante relaciones no demostradas o texto ilegible; pruebas contractuales comprueban estas instrucciones.
- Auditoría live de Paradigma, run `36751214487`: checkout de `prometeo-contexto` con el secreto existente PASS, lectura de Paradigma FAIL con HTTP 404. Repositorio, commit y mapa de destino fueron verificados independientemente; se requiere conceder a la credencial de sólo lectura acceso al repo privado Paradigma y actualizar el secreto existente.

- Se corrige `hypothesisDiversity`: ahora es la distancia léxica media por pares (Jaccard) entre etiquetas distintas; con menos de dos hipótesis distintas vale 0. No sustituye el juicio semántico ni el mínimo de hipótesis del Gate. El valor `1.0` del artefacto de run `36750502299` era un conteo de rótulos únicos mal llamado diversidad y no debe interpretarse como calidad.

- Benchmark real 3b posterior al ajuste de prompt, run `36755094737`: `backend-live` PASS; benchmark FAIL, 1/5, cobertura `0.70`, abstención de alcance `1.0`, diversidad léxica `0.20`, sobrepromoción `0`, cero señales de alucinación/no anclaje. El archivo conserva los fallos de modalidad, alternativas y abstención ante texto ilegible.
- Auditoría live read-only de Paradigma, run `36755018036`, job `110022944969`: PASS en SHA `e7c7b06eebd56e412a8b27f3c58747af2d1e531c`, mapa `2.12.0`, una fuente canónica contextual; `contextOnly: true`, transporte GET-only. No expuso la credencial.
- Se fija `qwen2.5:7b` para la siguiente medición real y se alinean README, instrucciones y `.env.example`. El modelo ocupa `4.7 GB` y el runner estándar de Actions dispone de `16 GB` de RAM; las rúbricas no cambian.
