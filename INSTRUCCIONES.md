# Instrucciones de desarrollo — promete-lenguaje

## Validación del proyecto desde GitHub

El propietario puede validar Prometeo desde GitHub en un iPad, sin instalar software ni ejecutar comandos locales.

### Pruebas contractuales deterministas

El workflow `Prometeo language boundary` ejecuta la suite de contratos, integración y casos adversariales en cada cambio. Usa fixtures únicamente para verificar el protocolo y la frontera contractual; sus resultados no se cuentan como evaluación de calidad de un modelo.

### Backend local real y benchmark epistemológico

1. Abre **Actions** en `prometeo-lenguaje`.
2. Selecciona **Prometeo local model benchmark**.
3. Pulsa **Run workflow** en la rama `main`.

GitHub Actions prepara Ollama y el modelo `qwen2.5:3b` en runners efímeros. No solicita ni usa claves de APIs comerciales. La primera corrida con `qwen2.5:1.5b` pasó `backend-live`, pero el benchmark obtuvo `0/5`; por ello la próxima corrida sube el modelo a 3B sin cambiar las rúbricas.

El workflow separa dos jobs:
- `backend-live` ejecuta una generación real mediante `LanguageBackend` y `analyzeDocument`. La salida debe pasar la validación estricta; cualquier estructura contractual prohibida hace fallar el job. El reporte identifica modelo, estado, conteos y confirmación humana.
- `epistemic-benchmark` ejecuta las cinco rúbricas sin mocks y produce un reporte con cobertura de modalidades, discriminación, claims requeridos/prohibidos, alucinaciones señaladas, sobrepromoción, abstención y diversidad de hipótesis. Las rúbricas no se debilitan para un modelo pequeño. Un modelo puede pasar `backend-live` y fallar este benchmark de calidad.

Descarga los artefactos `backend-live-<run>` y `epistemic-benchmark-<run>` desde el run de Actions. Incluyen las muestras normalizadas sobre fixtures sintéticos; nunca procesan expedientes del caso. El reporte señala modelo y métricas para distinguir capacidad de ejecución de calidad.

## Lectura real de Paradigma

El acceso a Paradigma es una prueba independiente. Ejecuta **Audit existing context token access to Paradigma** en este repositorio. Usa el secreto existente `PROMETEO_CONTEXT_TOKEN`, que ya permite checkout privado de `prometeo-contexto`, para probar lectura GET-only del commit fijado de Paradigma. No revela el secreto. Sólo si la ejecución evidencia que no tiene permiso de lectura se requiere que el propietario ajuste credenciales desde la configuración web de GitHub.

## Desarrollo opcional en una computadora

Desarrolladores con una estación local pueden ejecutar `npm test`, `npm run benchmark:backend-live` o `npm run benchmark:local`. El entorno local y `.env.local` son opcionales y no forman parte de ningún Gate exigido al propietario. No añadas credenciales comerciales a la configuración.
