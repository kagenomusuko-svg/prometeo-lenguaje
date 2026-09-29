# Batería adversarial semántica

La prueba tests/adversarial-semantics.test.mjs cubre el límite de autoridad de promete-lenguaje.

Verifica que:

- las modalidades asserted, reported, inferred, possible, obligatory, denied y unknown se conservan como propuestas;
- una hipótesis alternativa no se selecciona ni se convierte en modelo confirmado;
- una respuesta de contexto con source-text-read no se acepta como si fuera el mapa de localizadores esperado por el lenguaje;
- los estados confirmed y accepted son rechazados como promociones implícitas;
- las modalidades fuera del contrato fallan cerrado;
- la salida no contiene confirmedModel, evidence ni MotorRequest.

La batería prueba límites de contrato y autoridad. No pretende determinar si una proposición es verdadera ni resolver causalidad.
