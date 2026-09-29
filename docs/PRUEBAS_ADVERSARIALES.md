# Batería adversarial de propuestas lingüísticas

`tests/adversarial-boundary.test.mjs` verifica que el registro lingüístico falle cerrado ante entradas que podrían convertir una propuesta en una decisión implícita.

## Casos cubiertos

- proposición con estado `accepted`;
- candidato que referencia una proposición inexistente;
- hipótesis que referencia un candidato inexistente;
- IDs de proposición duplicados;
- contexto que no conserva sólo localizadores de mapa;
- proveniencia de contexto que no pertenece a un sistema determinista.

## Invariantes positivas

Una propuesta válida debe conservar:

- proposiciones en estado `proposed`;
- candidatos en estado `proposed`;
- hipótesis en estado `proposed`;
- `requiresHumanConfirmation: true`;
- ausencia de `ConfirmedModel`.

La batería no decide causalidad ni reemplaza las decisiones del analista. Sólo protege la frontera entre salida lingüística y promoción humana.
