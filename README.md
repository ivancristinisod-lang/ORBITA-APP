# ORBITA — Relational Intelligence MVP V0.5

ORBITA es un agente de inteligencia relacional orientado inicialmente a founders y emprendedores. El producto sigue siendo **manual-first** mientras validamos qué contexto relacional produce valor recurrente.

Este paquete corresponde a **V0.5.2**, un patch de seguridad/cloud sobre la generación V0.5.

## Producto actual

- **01 HOY** — señales y próximos movimientos.
- **02 PERSONAS** — relaciones, historial, contexto y CRUD completo.
- **03 RED** — mapa/círculos relacionales.
- **04 AGENDA** — Día / Semana / Mes + Meeting Brief.
- **05 DATOS** — actividad, oportunidades, import/export, auditoría y configuración.
- Captura manual global.
- Búsqueda `Ctrl/Cmd + K`.
- JSON / CSV / Markdown portability.
- Onboarding y ayuda contextual.
- Modo local explícito.
- **Agente relacional explicable**: objetivo → ranking → evidencia → acción.
- Motor determinístico local con protección contra falsos positivos.
- Base Solana privacy-minimal en `solana.js` (hash/memo/Explorer devnet; wallet y broadcast aún pendientes).
- Supabase Auth + cloud sync cuando producción recibe la configuración.

## Cloud baseline

El proyecto Supabase ORBITA ya está provisionado. La base usa:

```text
Auth user
   ↓
orbita_workspaces.user_id
   ↓
workspace JSONB
   + server revision
   + server timestamps
```

RLS + FORCE RLS aíslan cada usuario. Los writes cloud usan revisión optimista para evitar que un dispositivo obsoleto sobrescriba silenciosamente datos más recientes.

La arquitectura JSONB es intencional para el MVP y puede normalizarse cuando uso real justifique el costo.

## Local

Node compatible: 22–24. CI/deploy objetivo: Node 24.

```bash
npm run dev
```

Abrí `http://localhost:4173`.

Sin variables cloud, ORBITA muestra **Modo local** y guarda solamente en el navegador.

## Validación

```bash
npm run validate
```

Incluye checks de arquitectura/seguridad, cobertura de acciones UI, tests de dominio, sintaxis y build.

## Vercel

```text
npm run build → dist/
```

Para activar cloud Auth en producción ver **`AUTH-SETUP.md`**. Variables públicas requeridas:

```text
ORBITA_SUPABASE_URL
ORBITA_SUPABASE_PUBLISHABLE_KEY
ORBITA_APP_URL
```

Nunca agregues `sb_secret_*` o `service_role` al navegador.

## Supabase source of truth

- Fresh-install snapshot: `supabase/schema.sql`
- Applied production history: `supabase/migrations/`
- Privileged account deletion: `supabase/functions/delete-account/index.ts`

No edites producción manualmente sin reflejar el cambio como migración.

## Seguridad

Ver:

- `SECURITY.md`
- `AUDIT-REPORT-V0.5.md`
- `AUTH-SETUP.md`

La V0.5 tiene una frontera explícita: las sesiones client-only todavía viven en localStorage. Antes de ingestión automática de datos especialmente sensibles o una expansión pública importante, ORBITA debe revisar/migrar a una arquitectura de sesión server-assisted/HttpOnly.
