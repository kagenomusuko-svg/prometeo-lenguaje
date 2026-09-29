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

La extensión cubre además contradicción, atribución no verificada, obligación no establecida y contrafactuales, conservando el texto y la modalidad sin convertirlos en evidencia ni conclusión causal.


La prueba tests/context-source-reading.test.mjs recorre mapa → localizador → lectura canónica → uso contextual. Comprueba que el texto queda en contextSources, marcado contextOnly, con fuente y versión, y que no se convierte en evidencia del caso.


La prueba tests/language-backend.test.mjs usa un backend determinista de fixture para verificar el ciclo de solicitud, propuestas con modalidades preservadas, alternativas, ambigüedad, preguntas y abstención. Incluye un caso de abstención total y rechaza cualquier intento de entregar un campo de autoridad no permitido. Este test verifica la frontera técnica; no mide la calidad de un modelo lingüístico real.
