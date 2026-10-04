# ORBITA — Project Status

**Product generation:** V0.6  
**Patch:** 0.6.0 — Experience Upgrade release candidate  
**Stage:** Functional Alpha / Pre-MVP → Experience validation  
**Frontend:** Vercel  
**Backend-ready:** Supabase ORBITA (`sa-east-1`), desacoplado hasta activación  
**Primary user:** founders / entrepreneurs

## V0.6 Experience Upgrade

- [x] Objetivo actual convertido en primitiva central de HOY
- [x] Ranking explicable con #1 dominante
- [x] Cola priorizada “Necesita tu atención”
- [x] Evidence drawer con hecho / inferencia / acción diferenciados
- [x] PERSONAS reducida a relaciones escaneables
- [x] Detalle como historia longitudinal
- [x] RED con modo MI RED / POR OBJETIVO
- [x] AGENDA relation-first y mobile list-first
- [x] DATOS agrupado en Información / Sistema / Cuenta / Avanzado
- [x] Captura libre “¿Qué pasó?” + CRUD estructurado
- [x] Onboarding reducido a tres etapas
- [x] Design system y responsive pass V0.6
- [ ] CI / preview / visual QA final antes de merge

## Producto utilizable hoy

- [x] 5 rutas canónicas: Hoy, Personas, Red, Agenda, Datos
- [x] CRUD manual de personas, interacciones, compromisos, oportunidades y reuniones
- [x] dataset demo de 16 relaciones
- [x] Meeting Brief factual
- [x] Agenda Día / Semana / Mes
- [x] import/export JSON / CSV / Markdown
- [x] onboarding y ayuda contextual
- [x] búsqueda / command palette
- [x] responsive UI
- [x] persistencia local
- [x] entrada funcional sin backend

## Backend preparado, no bloqueante

- [x] proyecto Supabase dedicado en São Paulo
- [x] cliente de Email/Password Auth preparado
- [x] workspace cloud por usuario preparado
- [x] cache local por usuario preparada
- [x] RLS + FORCE RLS
- [x] acceso anónimo DB revocado
- [x] control de concurrencia / revision server-side
- [x] Edge Function autenticada para eliminación de cuenta
- [x] migraciones versionadas
- [x] Security Advisor: 0 findings en última auditoría
- [x] Performance Advisor: 0 findings en última auditoría

## Stage Gate V0.6

ORBITA corre por defecto como **LOCAL ALPHA**. Variables parciales de backend no pueden romper el deploy.

Cloud se activa solamente con:

`ORBITA_ENABLE_CLOUD=true`

junto a URL + publishable key válidas.

## Gate antes de activar Cloud Alpha

- [ ] Site URL / Redirect URL exactas
- [ ] confirmación de email
- [ ] política de contraseña server-side
- [ ] signup/login/recovery E2E
- [ ] test real con 2 usuarios
- [ ] sync entre 2 dispositivos
- [ ] logout/login sin pérdida de datos

## Gate antes de beta pública

- [ ] custom SMTP
- [ ] CAPTCHA / Turnstile
- [ ] MFA/2FA administrativa
- [ ] rate-limit review
- [ ] Privacy Policy / Terms / retention
- [ ] dominio productivo propio
- [ ] analytics de activación/retención

## Intencionalmente diferido

- OAuth social
- Gmail / Calendar / LinkedIn / WhatsApp ingestion
- AI recommendations
- equipos/shared workspaces
- vector DB / graph DB
- billing
- Realtime

## Prioridad #1

**Validar V0.6 con usuarios reales, observar comprensión/retorno y corregir experiencia antes de ampliar integraciones o infraestructura.**
