# Contrato inicial de prometeo-lenguaje

## Responsabilidad

Registrar salidas lingüísticas candidatas asociadas con fragmentos de fuente: proposiciones, candidatos semánticos e hipótesis alternativas.

Puede recibir contexto de prometeo-contexto, pero ese contexto contiene únicamente localizadores del mapa externo de Paradigma y la obligación de leer la fuente canónica.

## Autoridad

El agente de lenguaje sólo propone. La confirmación, rechazo o modificación pertenece a la autoridad humana de prometeo-caso.

## Invariantes

- cada proposición apunta a un fragmento existente;
- cada candidato apunta a una proposición existente;
- cada hipótesis sólo referencia candidatos registrados;
- toda salida queda en estado proposed;
- la modalidad original se conserva;
- los localizadores contextuales conservan mapa, commit y proveniencia;
- el contexto no se transforma en evidencia ni conclusión;
- se marca explícitamente que se requiere confirmación humana;
- no se produce ConfirmedModel, MotorRequest ni resultado matemático.
\n\n## Validación de integridad\n\nEl registro valida que las hipótesis tengan `candidateIds` como arreglo, que sus identificadores sean únicos, que su `caseId` coincida con el documento cuando está disponible y que cada localizador contextual conserve `sourceObjectId`, `sourceVersion`, `id`, categoría, locator y estado de evidencia. Estas validaciones no promueven ningún objeto.\n

## Integración con contexto

La prueba de integración consume `queryParadigma` mediante `PROMETEO_CONTEXTO_PATH`. El resultado se entrega a `registerLanguageProposals` como contexto de localizadores. Se verifica que `contextReferences` conserve mapa, commit, locator y estado de evidencia, mientras la salida lingüística permanece en `proposed` y no expone `ConfirmedModel`, `MotorRequest` ni resultados matemáticos.
