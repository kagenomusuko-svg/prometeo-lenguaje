# Contrato inicial de prometeo-lenguaje

## Responsabilidad

Registrar salidas lingüísticas candidatas asociadas con fragmentos de fuente: proposiciones, candidatos semánticos e hipótesis alternativas.

## Autoridad

El agente de lenguaje sólo propone. La confirmación, rechazo o modificación pertenece a la autoridad humana de prometeo-caso.

## Invariantes

- cada proposición apunta a un fragmento existente;
- cada candidato apunta a una proposición existente;
- cada hipótesis sólo referencia candidatos registrados;
- toda salida queda en estado proposed;
- la modalidad original se conserva;
- se marca explícitamente que se requiere confirmación humana;
- no se produce ConfirmedModel, MotorRequest ni resultado matemático.
