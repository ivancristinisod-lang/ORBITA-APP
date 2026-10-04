# ORBITA — Hackathon Changelog

## Candidate sobre baseline V0.5.2

### Agente relacional explicable
- Objetivo actual del founder persistido en el workspace.
- Motor local determinístico que cruza objetivo, perfiles, tags, relaciones, interacciones, compromisos y oportunidades.
- Ranking de oportunidades con score 0–100.
- Evidencia trazable por resultado.
- Separación visible entre hechos registrados e inferencias.
- Siguiente acción sugerida.
- Protección contra falsos positivos: objetivos sin intención relacional conocida no producen recomendaciones inventadas.
- Escenario demo de fundraising calibrado sobre el dataset sintético incluido.

### UI
- Panel del agente integrado en HOY sin rediseñar el producto.
- Drawer de evidencia con objetivo, hechos, inferencia, confianza y siguiente acción.
- Responsive mobile para el nuevo flujo.

### Solana — estado parcial
- Adaptador criptográfico local para claims relacionales mínimos.
- Serialización canónica + SHA-256.
- Memo determinístico sin nombres, emails, teléfonos, objetivo, notas ni evidencia privada.
- Helper para Explorer fijado a devnet.
- **No existe todavía una transacción on-chain real ni una firma de wallet.**

### Calidad
- Suite ampliada a 18 tests.
- Checks de arquitectura/UI ampliados a 108 assertions.
- Build estático a `dist/`.
