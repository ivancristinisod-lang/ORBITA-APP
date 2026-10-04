# ORBITA — Architecture

## Estado actual

ORBITA V0.6.1 es una aplicación web estática **local-first** con una capa cloud opcional y explícitamente gated.

El core de producto funciona sin backend. Supabase agrega identidad y sincronización por usuario cuando se habilita deliberadamente.

```text
Browser
  ├─ UI / navigation ............ index.html + styles.css + app.js
  ├─ Domain intelligence ........ core.js
  ├─ Demo / seed workspace ...... seed.js
  ├─ Auth adapter ............... auth.js
  ├─ Cloud sync adapter ......... cloud.js
  ├─ Runtime config ............. config.js
  └─ Solana adapter (partial) ... solana.js
          │
          ├─ localStorage (default)
          │
          └─ Supabase (optional cloud stage)
```

## Build

```text
root source → build.mjs → dist/
```

No existe un framework frontend ni un bundler obligatorio en esta versión.

## Relational Intelligence

La historia funcional canónica es:

```text
Goal
  ↓
Recorded network context
  ↓
Deterministic relational engine
  ↓
Ranked opportunity
  ├─ evidence
  ├─ explicit inference
  ├─ confidence
  └─ suggested action
```

Una inferencia nunca reemplaza evidencia registrada. Si el objetivo no tiene evidencia relacional suficiente, el motor debe poder devolver cero recomendaciones.

## Persistencia

### Local
Es el modo por defecto y no depende de credenciales ni infraestructura externa.

### Cloud
Cuando `ORBITA_ENABLE_CLOUD=true`:
- Supabase Auth identifica al usuario.
- `public.orbita_workspaces` mantiene un workspace JSONB por usuario.
- RLS + FORCE RLS aplican aislamiento.
- `revision` server-side implementa optimistic concurrency.
- la eliminación de cuenta usa una Edge Function autenticada.

Fuente canónica:
- `supabase/schema.sql`
- `supabase/migrations/`
- `supabase/functions/delete-account/index.ts`

## Solana

`solana.js` actualmente implementa únicamente primitives locales:
- serialización canónica;
- hash SHA-256;
- memo privacy-minimal;
- URL de Explorer devnet.

No declarar integración on-chain completa sin wallet, firma, broadcast y una transacción real verificable.

## Regla de evolución

No incorporar vector DB, graph DB, multi-agent orchestration ni ingestión masiva por anticipación.

Primero:
1. casos de uso reales;
2. consultas reales;
3. comportamiento del usuario;
4. requisitos de trazabilidad;
5. volumen y colaboración observados.

La infraestructura evoluciona después de la evidencia.
