# ORBITA — Arquitectura Hackathon

## Núcleo

El MVP continúa siendo local-first y conserva la arquitectura V0.5.2. La capa hackathon agrega un motor relacional determinístico en `core.js` y una superficie explicable en `app.js`.

### Input
- objetivo actual del founder;
- personas y perfil relacional;
- tags y rol/empresa;
- interacciones;
- compromisos;
- oportunidades manuales;
- recencia y círculo relacional.

### Output
Cada oportunidad contiene:
- `opportunity_id`;
- `contact_id`;
- `relevance_score`;
- `reason`;
- `evidence`;
- `suggested_action`;
- `confidence`;
- `inference`.

## Separación hechos / inferencias

La evidencia proviene exclusivamente del workspace. La inferencia se etiqueta como tal. Un objetivo fuera de las intenciones soportadas devuelve cero recomendaciones en lugar de fabricar relevancia.

## Solana

`solana.js` es una base de integración, no una integración on-chain completa. Produce claims mínimos, hashes SHA-256, memos sin PII y URLs de Explorer devnet. Wallet, firma y broadcast quedan fuera del estado actual.
