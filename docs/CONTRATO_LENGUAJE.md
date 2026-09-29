# Contrato inicial de prometeo-lenguaje

## Responsabilidad

Registrar salidas lingüísticas candidatas asociadas con fragmentos de fuente: proposiciones, candidatos semánticos e hipótesis alternativas.

Puede recibir contexto de prometeo-contexto en dos estados: localizadores que obligan a leer la fuente canónica, o texto canónico ya leído con referencia y versión. El texto se conserva como contextSources con contextOnly: true; no se mezcla con proposiciones, candidatos ni evidencia específica del caso.

## Autoridad

El agente de lenguaje sólo propone. La confirmación, rechazo o modificación pertenece a la autoridad humana de prometeo-caso.

## Invariantes

- cada proposición apunta a un fragmento existente;
- cada candidato apunta a una proposición existente;
- cada hipótesis sólo referencia candidatos registrados;
- toda salida queda en estado proposed;
- la modalidad original se conserva;
- los localizadores y textos contextuales conservan mapa, commit, fuente y versión;
- el texto canónico leído permanece separado y marcado contextOnly: true;
- el contexto no se transforma en evidencia ni conclusión;
- se marca explícitamente que se requiere confirmación humana;
- no se produce ConfirmedModel, MotorRequest ni resultado matemático.
\n\n## Validación de integridad\n\nEl registro valida que las hipótesis tengan `candidateIds` como arreglo, que sus identificadores sean únicos, que su `caseId` coincida con el documento cuando está disponible y que cada localizador contextual conserve `sourceObjectId`, `sourceVersion`, `id`, categoría, locator y estado de evidencia. Estas validaciones no promueven ningún objeto.\n

## Integración con contexto

Las pruebas de integración consumen queryParadigma y readParadigmaSources mediante PROMETEO_CONTEXTO_PATH. El contexto puede entregarse como mapa de localizadores o como lectura canónica ya resuelta; en ambos casos se conserva su proveniencia. Se verifica que contextReferences conserve mapa, commit, locator, fuente y versión, y que el texto se exponga por separado como contextSources. El contexto no crea evidence; las propuestas siguen en proposed, exigen confirmación y no producen ConfirmedModel, MotorRequest ni resultados matemáticos.


## Backend de propuestas

analyzeDocument recibe un backend con el método asíncrono propose({ document, context }). El backend devuelve arreglos de propositions, candidates, hypotheses, questions y abstentions. Las tres primeras colecciones se validan y normalizan mediante registerLanguageProposals y las dos últimas se validan antes de incluirse en el resultado.

Cada pregunta requiere id, text y reason. Cada abstención requiere scope y reason. Una respuesta sin proposiciones sólo es válida si declara al menos una abstención. El backend no puede devolver campos adicionales de autoridad como evidence, confirmedModel, MotorRequest o resultados matemáticos.

El adaptador no impone proveedor ni modelo. Cualquier backend conectado debe pasar por esta frontera antes de que su salida se exponga.
