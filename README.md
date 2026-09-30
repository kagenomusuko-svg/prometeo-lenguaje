# promete-lenguaje

Isla lingüística de Prometeo. Consume un backend mediante la interfaz `LanguageBackend.propose(...)`, valida su salida en modo fail-closed y registra sólo propuestas. La implementación inicial es un adaptador desacoplado para Ollama local.

## Autoridad y seguridad

El modelo sólo propone. No puede producir decisiones humanas, `ConfirmedModel`, `MotorRequest`, `MotorResult` ni trazas de cálculo. La salida debe superar la validación contractual antes de exponerse como `LanguageProposal`. Contexto de Paradigma se conserva separado de la evidencia del caso.

No se requiere API key de proveedor lingüístico. El benchmark real corre contra el modelo local configurado; las pruebas deterministas con backend de prueba sólo cubren contratos y el evaluador.

## Configuración local

Copia `.env.example` a `.env.local`, selecciona un modelo instalado en Ollama y ajusta los valores sólo en ese archivo ignorado por Git:

```sh
cp .env.example .env.local
ollama pull qwen2.5:7b
npm run benchmark:local
```

Variables soportadas:
- `PROMETEO_LANGUAGE_BACKEND=ollama`
- `PROMETEO_LANGUAGE_MODEL` — nombre de un modelo ya descargado localmente.
- `OLLAMA_BASE_URL=http://127.0.0.1:11434` — sólo se aceptan direcciones loopback.

El runner falla si Ollama no está disponible. Guarda métricas y muestras de propuestas producidas sobre el corpus sintético fijo bajo `benchmark-results/` (ignorado por Git); no procesa expedientes ni documentos del caso.

## Desarrollo y verificación

Requiere Node.js 22 o superior. Ejecuta `npm test` para las pruebas deterministas/contractuales. Las pruebas de integración interrepositorio pueden requerir `PROMETEO_CONTEXTO_PATH` apuntando a `prometeo-contexto/src/query.mjs`. El benchmark de modelo real se ejecuta por separado con `npm run benchmark:local` y no sustituye la suite contractual.

Consulta `INSTRUCCIONES.md` para los pasos completos y `CHANGELOG.md` para cambios por versión.
