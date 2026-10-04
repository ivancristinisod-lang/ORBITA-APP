# ORBITA — Project Status

**Product generation:** V0.6  
**Patch:** 0.6.2 — First Value Experience  
**Stage:** Functional Alpha / Pre-MVP → Experience validation  
**Frontend:** Vercel  
**Backend-ready:** Supabase ORBITA (`sa-east-1`), desacoplado hasta activación  
**Primary user:** founders / entrepreneurs

## V0.6.2 — first value

- [x] onboarding máximo 2 pasos
- [x] demo inmediata en un click
- [x] objetivo antes que identidad/perfil
- [x] perfil diferido a DATOS
- [x] tutoriales contextuales cerrables
- [x] dismissals de tutorial persistidos fuera del schema del workspace
- [x] empty states accionables
- [x] más espacio entre superficies y márgenes laterales
- [x] mobile mantiene composición compacta
- [x] core relacional / datos / auth / cloud sin cambios funcionales

## V0.6.1 — producto activo

- [x] 4 rutas canónicas: Hoy, Personas, Red, Datos
- [x] Agenda removida de navegación y superficie activa
- [x] Meeting Brief removido de la UI
- [x] creación/edición de meetings removida de la UI
- [x] meetings históricos preservados a nivel de store para compatibilidad
- [x] lenguaje visible “LOCAL” retirado como branding
- [x] RED abre por objetivo cuando existe `currentGoal`
- [x] HOY → RED activa explícitamente modo goal
- [x] RED completa preservada como vista secundaria
- [x] empty state fuerte cuando no existe objetivo
- [x] PERSONAS con filas semánticas accesibles
- [x] objetivo → evidencia → oportunidad → acción preservado
- [x] CRUD de personas, interacciones, compromisos y oportunidades
- [x] import/export JSON / CSV / Markdown
- [x] persistencia y compatibilidad histórica
- [x] onboarding goal-first
- [x] responsive + reduced motion

## Legacy compatibility

`meetings[]` puede seguir existiendo en workspaces y backups anteriores.

**Legacy compatibility — not an active V0.6.1 product surface.**

No se realiza una migración destructiva para borrar esos datos.

## Backend preparado, no bloqueante

- [x] Supabase Auth adapter
- [x] workspace cloud por usuario
- [x] cache por usuario
- [x] RLS + FORCE RLS
- [x] optimistic concurrency
- [x] eliminación de cuenta server-side

## Gate antes de beta pública

- [ ] cloud activation QA real con dos usuarios
- [ ] sync entre dispositivos
- [ ] custom SMTP
- [ ] CAPTCHA / Turnstile
- [ ] MFA/2FA administrativa
- [ ] Privacy Policy / Terms / retention
- [ ] dominio productivo propio
- [ ] analytics de activación/retención

## Intencionalmente diferido

- Calendar product surface
- OAuth social
- Gmail / Calendar / LinkedIn / WhatsApp ingestion
- outreach automation
- AI API externa
- graph/vector DB
- equipos colaborativos
- billing
- Realtime

## Prioridad #1

**Validar si ORBITA ayuda a entender qué quiero lograr y qué relaciones de mi red pueden moverme hacia ese objetivo.**
