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
