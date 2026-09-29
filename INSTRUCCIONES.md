# Instrucciones de desarrollo — promete-lenguaje

## Requisitos
- Node.js 22 o superior.
- promete-contexto disponible localmente para pruebas de integración interrepositorio.

## Pruebas
Desde la raíz del repositorio:

```sh
npm install
PROMETEO_CONTEXTO_PATH=/ruta/a/prometeo-contexto/src/query.mjs npm test
```

La suite cubre contratos, modalidad, propuestas, contexto, alternativas e invariantes de no promoción. No reemplaces las pruebas de integración con stubs que omitan proveniencia.

## Cambios contractuales
No conviertas una propuesta en confirmación ni contexto doctrinal en evidencia del caso. Si se cambia la forma de salida, actualiza primero contratos compartidos y pruebas de compatibilidad. Toda modificación de modalidad requiere autorización normativa del propietario del proyecto.
