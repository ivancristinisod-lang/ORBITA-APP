# ORBITA APP — Relational Intelligence

ORBITA es un agente de inteligencia relacional para founders y emprendedores.

Convierte un objetivo actual + el contexto de tu red en oportunidades priorizadas, explicables y accionables:

**OBJETIVO → RED → EVIDENCIA → OPORTUNIDAD → ACCIÓN**

## Estado actual

**Versión:** V0.6 Experience Upgrade — release candidate  
**Arquitectura:** local-first, backend-ready  
**Deploy:** Vercel  
**Producción:** https://orbita-app-kappa.vercel.app

### Producto
- HOY — objetivo actual, ranking explicable y cola priorizada de atención.
- PERSONAS — relaciones escaneables e historia longitudinal.
- RED — vista orbital general + modo por objetivo.
- AGENDA — reuniones con contexto relacional + calendario secundario.
- DATOS — información, sistema, cuenta y herramientas avanzadas.
- CAPTURAR — entrada libre “¿Qué pasó?” que conserva CRUD estructurado.
- Ranking relacional explicable con separación entre hechos e inferencias.
- Protección contra falsos positivos.
- Persistencia local.
- Supabase Auth + cloud sync preparados detrás de stage gate.
- Adaptador Solana privacy-minimal en `solana.js`; wallet/firma/broadcast todavía no forman parte del estado productivo.

## Desarrollo local

Requiere Node 22–24. CI y deploy usan Node 24.

```bash
npm run dev
```

Abrí `http://localhost:4173`.

Validación completa:

```bash
npm run validate
```

## Build / Vercel

```text
npm run build → dist/
```

Vercel construye desde `main`.

## Cloud stage gate

ORBITA funciona sin backend como **LOCAL ALPHA**.

Cloud solo se activa cuando:

```text
ORBITA_ENABLE_CLOUD=true
ORBITA_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
ORBITA_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
ORBITA_APP_URL=https://orbita-app-kappa.vercel.app
```

Nunca exponer `sb_secret_*` ni `service_role` en browser.

## Estructura

```text
/
├─ index.html
├─ app.js
├─ core.js
├─ seed.js
├─ auth.js
├─ cloud.js
├─ solana.js
├─ styles.css
├─ build.mjs
├─ check.mjs
├─ tests.mjs
├─ ORBITA_V0.6_EXPERIENCE.md
├─ .github/workflows/validate.yml
├─ supabase/
│  ├─ schema.sql
│  ├─ migrations/
│  └─ functions/delete-account/index.ts
└─ docs/
   └─ archive/
```

### Supabase source of truth
- Fresh install: `supabase/schema.sql`
- Historial aplicado: `supabase/migrations/`
- Operación privilegiada: `supabase/functions/delete-account/index.ts`

### Documentación
Los documentos vigentes permanecen en raíz para acceso rápido. La especificación de experiencia V0.6 vive en `ORBITA_V0.6_EXPERIENCE.md`. Versiones históricas/superseded viven en `docs/archive/`.

## Seguridad

Ver:
- `SECURITY.md`
- `AUDIT-REPORT-V0.5.md`
- `AUTH-SETUP.md`
- `ARCHITECTURE-DECISIONS.md`

Regla no negociable: una operación privilegiada nunca se resuelve moviendo credenciales administrativas al navegador.
