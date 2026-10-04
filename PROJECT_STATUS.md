# ORBITA — Project Status

**Product generation:** V0.5  
**Patch:** 0.5.2 — Local Alpha Stage Gate  
**Stage:** Productized High-Fidelity Prototype → Functional Alpha / Pre-MVP  
**Frontend:** Vercel  
**Backend-ready:** Supabase ORBITA (`sa-east-1`), desacoplado hasta activación  
**Primary user:** founders / entrepreneurs

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

## Stage Gate V0.5

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

**Usar ORBITA como producto funcional, terminar convergencia UX y preparar la primera prueba real con usuarios antes de ampliar el scope.**
