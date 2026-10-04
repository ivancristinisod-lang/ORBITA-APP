# ORBITA — Auditoría integral V0.5

**Fecha:** 2026-08-15  
**Patch auditado:** 0.5.1  
**Alcance:** producto, UX, datos, auth, sincronización, seguridad, build, deploy y reproducibilidad operativa.

## Veredicto ejecutivo

V0.5 ya no es solamente una demo local. Con el hardening 0.5.1 existe una base multiusuario defendible para beta: proyecto Supabase dedicado, aislamiento por usuario, revisión optimista, eliminación server-side, migraciones reproducibles y controles de browser/deploy.

No se declara “production-grade final”: quedan controles externos deliberadamente marcados como gates antes de una beta pública grande o de ingestión automática de fuentes sensibles.

## Hallazgos P0/P1 corregidos

### P0 — Sin aislamiento real de usuario

**Corregido:** `orbita_workspaces.user_id` referencia `auth.users(id)`, RLS y FORCE RLS están activos, `anon` no tiene acceso y todas las políticas se limitan al propietario autenticado.

### P0 — Riesgo de overwrite entre dispositivos

**Antes:** sync basado principalmente en timestamps / last-write-wins.  
**Ahora:** `revision` es server-controlled y cada PATCH exige la revisión esperada. Un writer obsoleto recibe conflicto y ORBITA no pisa cambios remotos.

### P0 — Fresh browser podía parecer “más nuevo” que cloud

`normalizeStore({})` genera un `updatedAt` actual. En un navegador limpio, esa fecha podía superar la fecha del workspace cloud y provocar un overwrite vacío durante bootstrap si no existía metadata de sync.

**Corregido:** ORBITA distingue si realmente existe un snapshot local. Sin snapshot local confiable, cloud gana siempre.

### P0 — Operación privilegiada de borrado de cuenta

**Corregido:** `delete-account` vive como Supabase Edge Function con JWT obligatorio. La función valida usuario + origen + método + confirmación y usa privilegios administrativos exclusivamente server-side. El workspace se elimina por FK cascade.

### P1 — Cliente podía escribir metadatos de integridad

**Corregido:** permisos de columna limitan INSERT a `user_id/workspace` y UPDATE a `workspace`. Revisión, timestamps, user_id y payload schema se controlan en DB.

### P1 — Políticas RLS con overhead evitable

Supabase Performance Advisor detectó 4 warnings `auth_rls_initplan` en la primera versión de las políticas.

**Corregido:** llamadas Auth quedaron envueltas como subqueries init-plan. Performance Advisor posterior: **0 findings**.

### P1 — Superficie web demasiado genérica

**Corregido:** CSP `connect-src` ya no permite cualquier `*.supabase.co`; acepta únicamente el proyecto ORBITA. Referrer = `no-referrer`, cross-origin headers más restrictivos y runtime `config.js` no-store.

### P1 — Password baseline débil como UX

**Corregido en cliente:** 12+ caracteres con mayúscula, minúscula, número y símbolo.  
**Pendiente manual obligatorio:** reflejar la misma regla en Supabase, porque el cliente no es la frontera de seguridad.

### P1 — Infra no reproducible

**Corregido:** las tres migraciones realmente aplicadas quedan versionadas en `supabase/migrations/`, el snapshot final vive en `supabase/schema.sql` y la Edge Function desplegada también queda en source.

## Verificación real de Supabase

Proyecto: ORBITA, São Paulo.

- ACTIVE_HEALTHY.
- Security Advisor: **0 findings** tras hardening.
- Performance Advisor: **0 findings** tras optimización.
- RLS enabled: **true**.
- FORCE RLS: **true**.
- `anon` SELECT: **false**.
- `anon` INSERT: **false**.
- 4 políticas owner-scoped presentes.
- Edge Function `delete-account`: ACTIVE, JWT verification enabled.

## Riesgos abiertos / gates

### Gate A — Session architecture

Auth client-only persiste tokens en localStorage. Es suficiente para esta etapa con CSP/escaping, pero no se considera arquitectura definitiva para correo, mensajería, redes o datos de alta sensibilidad.

**Antes de ese salto:** revisar PKCE + cookies HttpOnly/Secure/SameSite y mover la sesión a una capa server-assisted.

### Gate B — Anti-abuse / email

Antes de beta pública abierta:

- custom SMTP;
- CAPTCHA/Turnstile;
- rate limits revisados;
- OTP expiry ≤ 3600 s;
- email confirmation server-side;
- password policy server-side.

### Gate C — Gobernanza y acceso administrativo

- MFA/2FA para Supabase org owner;
- 2FA para GitHub/Vercel;
- idealmente segundo owner administrativo cuando el proyecto tenga valor operativo real;
- principio de menor privilegio para futuros colaboradores.

### Gate D — Data governance

Antes de ingestión automática:

- Privacy Policy / Terms;
- consentimiento por fuente;
- política de retención/eliminación;
- trazabilidad de origen de hechos;
- clasificación de datos sensibles;
- política de exportación y portabilidad.

### Gate E — Recovery / escala

Free sirve para construcción y validación. Antes de una ronda, beta con datos valiosos o usuarios de pago, definir formalmente RPO/RTO, backups/PITR, staging/migrations y observabilidad acorde al plan elegido.

## Decisiones que NO tomamos

- No normalizamos todo Postgres sin queries reales.
- No agregamos graph/vector DB por anticipación.
- No agregamos un backend adicional si Supabase ya resuelve el boundary actual.
- No habilitamos OAuth, teléfono o anonymous Auth sin caso de uso.
- No agregamos integraciones sensibles antes de cerrar el modelo de trust.

## Próxima prueba que decide avance

**Cloud activation + E2E de dos usuarios.**

Hasta que no confirmemos signup, email confirmation, login, persistence, recuperación, isolation y conflict behavior en producción/staging real, no corresponde abrir una nueva gran línea de features.

## Observación de infraestructura — Realtime de Supabase (no bloqueante)

Durante la auditoría del proyecto recién provisionado, los logs de Postgres mostraron periódicamente `relation "realtime.subscription" does not exist` y el servicio Realtime informó que todavía no encontraba un supervisor de base para el tenant. El schema `realtime` permanece vacío.

ORBITA V0.5 **no utiliza Supabase Realtime**: Auth y persistencia operan mediante Auth + Data API/PostgREST sobre `public.orbita_workspaces`. Los Security/Performance Advisors permanecen en **0 findings**, por lo que esta observación no bloquea la activación cloud actual.

Decisión: **no crear manualmente tablas administradas por Supabase dentro del schema `realtime`**. Mantener Realtime fuera del alcance de V0.5, monitorear el provisioning y, si el error persiste antes de adoptar Realtime, escalarlo a soporte de Supabase.

## Prueba de aislamiento RLS contra infraestructura real

Se ejecutó una prueba transaccional reversible simulando dos usuarios autenticados distintos contra el proyecto ORBITA real:

- A puede leer su propio workspace: **1 fila**.
- B puede leer el workspace de A: **0 filas**.
- B puede modificar el workspace de A: **0 filas**.
- B puede leer su propio workspace: **1 fila**.
- A puede leer el workspace de B: **0 filas**.

La transacción fue revertida; no quedaron usuarios ni datos de prueba. Resultado: **PASS**.
