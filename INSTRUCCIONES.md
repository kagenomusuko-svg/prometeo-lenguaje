# Instrucciones de desarrollo — promete-lenguaje

## Requisitos
- Node.js 22 o superior.
- promete-contexto disponible localmente para pruebas de integración interrepositorio.
- Para evaluación lingüística real: Ollama local y el modelo indicado en `.env.local`.

## Suite determinista y contractual
Desde la raíz del repositorio:

```sh
npm install
PROMETEO_CONTEXTO_PATH=/ruta/a/prometeo-contexto/src/query.mjs npm test
```

La suite cubre contratos, modalidad, propuestas, contexto, alternativas, el adaptador local y los invariantes de no promoción. Las respuestas simuladas prueban el protocolo y la validación; no cuentan como evaluación de calidad lingüística.

## Benchmark lingüístico real en local

1. Copia `.env.example` a `.env.local`.
2. Ajusta `PROMETEO_LANGUAGE_MODEL` a un modelo descargado localmente.
3. Confirma que Ollama escucha en `http://127.0.0.1:11434` (o cambia `OLLAMA_BASE_URL` a otra dirección loopback).
4. Descarga el modelo, si hace falta: `ollama pull qwen2.5:7b`.
5. Ejecuta `npm run benchmark:local`.

La ejecución usa el modelo local real y falla si no puede contactar Ollama; no cambia a un mock. El JSON de métricas se guarda en `benchmark-results/`, una carpeta ignorada por Git. El reporte incluye cobertura de modalidades, claims requeridos/prohibidos, conteo de alucinaciones señaladas por rúbrica, promoción indebida, abstención y diversidad de hipótesis. La coincidencia textual de claims es una señal determinista y no sustituye la revisión semántica del resultado del modelo.

Variables de entorno:
- `PROMETEO_LANGUAGE_BACKEND=ollama`
- `PROMETEO_LANGUAGE_MODEL=<modelo local instalado>`
- `OLLAMA_BASE_URL=http://127.0.0.1:11434`

La configuración de máquina vive en `.env.local` y no debe versionarse. `.env.example` sólo contiene valores ilustrativos. Este repositorio no necesita claves de APIs lingüísticas comerciales.

## Cambios contractuales
No conviertas una propuesta en confirmación ni contexto doctrinal en evidencia del caso. Si se cambia la forma de salida, actualiza primero contratos compartidos y pruebas de compatibilidad. Toda modificación de modalidad requiere autorización normativa del propietario del proyecto. Ningún backend lingüístico puede emitir `AnalystDecision`, `ConfirmedModel`, `MotorRequest`, `MotorResult` ni `CalculationTrace`.
