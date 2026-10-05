# ORBITA APP — Relational Intelligence

ORBITA es un agente de inteligencia relacional para founders y emprendedores.

Convierte un objetivo actual + el contexto registrado de tu red en oportunidades priorizadas, explicables y accionables:

**OBJETIVO → RED → EVIDENCIA → OPORTUNIDAD → ACCIÓN**

## Estado actual

**Versión:** V0.7.0-alpha.1 Private Alpha  
**Arquitectura:** local-first + workspace cloud aislado por usuario  
**Deploy:** Vercel  
**Producción:** https://orbita-app-kappa.vercel.app

## Private Alpha

La V0.7.0-alpha.1 no amplía el producto. Agrega la infraestructura mínima para aprender con testers reales:

- acceso invite-only;
- Auth real;
- workspace aislado por usuario;
- RLS / FORCE RLS;
- vínculo opcional con respondent previo mediante `survey_response_id`;
- funnel auditable;
- feedback / reporte de problemas;
- demo excluida del funnel PMF;
- GO/NO-GO de cohortes documentado.

Customer Discovery permanece separado del producto. No se copian respuestas de encuesta al workspace ni al tester registry.

Ver `PRIVATE_ALPHA_RUNBOOK.md`.

## Producto

ORBITA tiene **4 superficies canónicas**:

1. **HOY** — objetivo actual, oportunidades explicables y señales que requieren atención.
2. **PERSONAS** — relaciones, contexto, compromisos, oportunidades e historia.
3. **RED** — abre por objetivo cuando existe uno; la red completa queda como vista secundaria.
4. **DATOS** — información, sistema, cuenta, import/export y herramientas avanzadas.

### V0.6.3 — Visual Finish

- Tutoriales contextuales removidos para reducir ruido visual.
- Onboarding compacto y diseñado para entrar completo en un viewport desktop/notebook.
- Scroll del documento bloqueado durante onboarding para evitar doble barra.
- Copy inicial reducido a una promesa escaneable.
- Escala tipográfica de onboarding y HOY moderada para priorizar contenido y acciones.
- Se preservan demo inmediata, objetivo primero, empty states y toda la lógica de producto.

### V0.6.2 — First Value Experience

- Onboarding reducido a una elección inicial + objetivo.
- Demo inmediata en un click para llegar al valor central sin configuración previa.
- Nombre, rol y proyecto dejan de bloquear la primera sesión.
- Empty states orientados a acción: agregar una relación o importar CSV.
- Más respiración horizontal y vertical en desktop sin sacrificar mobile.
- Motor relacional, CRUD, persistencia y arquitectura permanecen sin cambios.

### V0.6.1 — Product Simplification

- Agenda deja de formar parte del MVP.
- No se pueden crear reuniones nuevas desde la UI.
- Meeting Brief deja de existir como superficie visible.
- `meetings[]` se conserva en el schema/store únicamente por compatibilidad histórica.
- La interfaz deja de usar “LOCAL” como branding de producto.
- RED es goal-first.
- “Mi red” completa sigue disponible como fallback secundario.
- CAPTURAR conserva persona, interacción, compromiso y oportunidad.
- Ranking relacional mantiene separación entre evidencia, inferencia y acción.

## Compatibilidad histórica

**Legacy compatibility — not an active product surface.**

Backups anteriores pueden contener `meetings: [...]`. ORBITA sigue pudiendo cargar, normalizar, importar y exportar esos datos para evitar pérdida destructiva, pero no los presenta como feature activa ni permite crear reuniones nuevas desde la interfaz.

## Desarrollo

Requiere Node 22–24. CI y deploy usan Node 24.

```bash
npm run dev
npm run validate
```

## Build / Vercel

```text
npm run build → dist/
```

Vercel construye desde `main` para producción. Las branches/PRs generan previews.

## Cloud stage gate

La arquitectura sigue siendo local-first. Private Alpha habilita cloud únicamente de forma explícita:

```text
ORBITA_ENABLE_CLOUD=true
ORBITA_SUPABASE_URL=https://YOUR_DEDICATED_ORBITA_PROJECT.supabase.co
ORBITA_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
ORBITA_APP_URL=https://orbita-app-kappa.vercel.app
```

Nunca exponer `sb_secret_*` ni `service_role` en browser.

## Telemetría Private Alpha

Eventos mínimos:

- `tester_invited`
- `account_created`
- `first_login`
- `goal_created`
- `first_person_created`
- `third_person_created`
- `first_opportunity_shown`
- `opportunity_opened`
- `opportunity_marked_relevant`
- `action_started`
- `return_session`

No se registra texto del objetivo, nombres de contactos, notas relacionales, emails ni teléfonos dentro de `properties`.

## Documentación

- `PRIVATE_ALPHA_RUNBOOK.md`
- `PROJECT_STATUS.md`
- `ORBITA_V0.6_EXPERIENCE.md`
- `DESIGN-SYSTEM.md`
- `ARCHITECTURE.md`
- `SECURITY.md`
- `AUTH-SETUP.md`

La infraestructura técnica puede describirse como local-first; esa implementación no se usa como branding visible del producto.
