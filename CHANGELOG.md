# Changelog

## 2026-09-29
- Se habilita el uso de texto canónico leído como contexto separado, con proveniencia de fuente y versión.
- Se añade integración contexto → lectura canónica → lenguaje y se fija el commit de promete-contexto en CI.
- Se conserva la prohibición de convertir contexto en evidencia o de promover propuestas.
- Se documentan instrucciones reproducibles de desarrollo y pruebas.
- Se añade analyzeDocument, una frontera inyectable para backend de propuestas, preguntas, alternativas y abstenciones.
- El adaptador valida modalidades, categorías y referencias, mantiene todas las salidas en estado propuesto y rechaza campos de autoridad.
- La prueba del backend se incorpora a npm test; sus fixtures no sustituyen la evaluación sustantiva con un modelo real.
