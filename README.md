# promete-lenguaje

Isla lingüística de Prometeo. Consume un backend mediante la interfaz `LanguageBackend.propose(...)`, valida su salida en modo fail-closed y registra sólo propuestas. La implementación inicial es un adaptador desacoplado para Ollama local.

## Autoridad y seguridad

El modelo sólo propone. No puede producir decisiones humanas, `ConfirmedModel`, `MotorRequest`, `MotorResult` ni trazas de cálculo. La salida debe superar la validación contractual antes de exponerse como `LanguageProposal`. Contexto de Paradigma se conserva separado de la evidencia del caso.

No se requiere API key de proveedor lingüístico. El propietario puede administrar y validar Prometeo desde GitHub en un iPad: no necesita instalar Node, Ollama, Git ni una terminal local.

## Benchmark real en GitHub Actions

En **Actions → Prometeo local model benchmark → Run workflow**, el runner efímero instala Ollama, descarga `qwen2.5:7b` y ejecuta dos jobs separados:

- `backend-live`: invoca el adaptador real, valida el resultado mediante `analyzeDocument` y comprueba invariantes de propuesta y confirmación humana.
- `epistemic-benchmark`: evalúa los cinco casos sintéticos con el modelo real. Mide cobertura, modalidad, discriminación, claims de alucinación, promoción indebida, abstención y diversidad de hipótesis. No reduce las rúbricas; un resultado insuficiente deja este job en fallo aunque `backend-live` pase.

Ambos reportes se guardan como artefactos de Actions durante 90 días. Cada reporte identifica el modelo. No se usan mocks ni credenciales comerciales en estos jobs. La suite determinista sigue disponible como CI normal para probar contratos.

La ejecución con `qwen2.5:1.5b` pasó `backend-live` y obtuvo `0/5`. La evaluación real posterior con `qwen2.5:3b` pasó `1/5` antes y después de la mejora del prompt (runs `36750502299` y `36755094737`); en la última obtuvo cobertura `0.70`, abstención de alcance `1.0`, diversidad léxica `0.20`, y cero señales detectadas de alucinación o proposiciones sin anclaje. Persistieron pérdidas de modalidad, relatos incompatibles no separados y una proposición ante texto ilegible. Se fija `qwen2.5:7b` para la siguiente evaluación, modelo de `4.7 GB` que cabe en el runner estándar de `16 GB`; las rúbricas permanecen intactas. El artefacto `11116402785` identifica el último run y el modelo. La configuración Ollama local de `.env.example` es opcional y no es requisito de validación o cierre.

## Contexto privado Paradigma

La prueba de lectura real es independiente del benchmark lingüístico. El workflow manual **Audit existing context token access to Paradigma** se ejecuta en este repositorio y comprueba si el secreto existente `PROMETEO_CONTEXT_TOKEN` puede leer el contenido fijado de Paradigma. La petición queda confinada por el adaptador a HTTPS GET sobre el repositorio privado y el SHA configurado. El valor del secreto no se imprime ni se incorpora al informe. Sólo se solicitará otro token si esta prueba demuestra que la credencial no tiene acceso.

## Desarrollo y verificación

La suite contractual determinista se ejecuta con `npm test` en GitHub Actions. `npm run benchmark:backend-live` y `npm run benchmark:local` son herramientas opcionales para desarrolladores que sí dispongan de entorno local; no se requieren del propietario para administrar ni validar el proyecto.

Consulta `INSTRUCCIONES.md` para detalles y `CHANGELOG.md` para cambios por versión.
