# ORBITA — QA Report V0.5.1

## Objetivo

Validar que el patch de seguridad mantiene el producto V0.5 funcional y que el source code coincide con la infraestructura real provisionada.

## Validación local automatizada

Comando canónico:

```bash
npm run validate
```

Cubre:

- archivos y documentación requeridos;
- cinco rutas canónicas;
- acciones UI declaradas vs handlers;
- sintaxis JavaScript;
- tests de dominio;
- build de producción;
- RLS/FORCE RLS en schema source;
- least-privilege grants;
- optimistic concurrency en cloud client;
- delete-account UI/client/source function;
- password baseline;
- CSP exacta;
- detección de secretos en browser source.


## Browser regression harness

El runtime administrado bloquea navegación directa a localhost/URLs externas desde Chromium. Para probar la interfaz igualmente, se ejecutó un harness aislado sobre `about:blank` que carga **el mismo HTML/CSS/JS actual**, reescribe solamente los imports de módulos a `data:` URLs y reemplaza `localStorage` por un store in-memory para el entorno opaco de test. No reemplaza lógica de producto.

Resultado 0.5.1:

- auth gate local: PASS
- onboarding completo: PASS
- 5 rutas canónicas: PASS
- creación de persona: PASS
- Command Palette: PASS
- Agenda Día/Semana/Mes: PASS
- ayuda contextual: PASS
- responsive 1440/1024/390: PASS
- overflow de página: 0
- console errors: 0
- page/runtime errors: 0

HTTP smoke local de 8 assets críticos: PASS.

## Supabase real

Validado sobre el proyecto ORBITA:

- proyecto ACTIVE_HEALTHY;
- tabla `public.orbita_workspaces` creada;
- FK a `auth.users`;
- RLS enabled;
- FORCE RLS enabled;
- `anon` sin SELECT/INSERT;
- 4 políticas por propietario;
- Security Advisor: 0 findings;
- Performance Advisor: 0 findings;
- Edge Function `delete-account`: ACTIVE + JWT verification.

## Regression corregida durante esta auditoría

Un navegador completamente nuevo no tenía snapshot local, pero `normalizeStore({})` generaba un `updatedAt` actual. En el branch sin sync metadata, ese store vacío podía ser considerado más nuevo que cloud.

La V0.5.1 comprueba primero si existe un snapshot local real; si no existe, el workspace cloud es autoritativo.

## E2E cloud pendiente

No se declara PASS todavía para:

1. signup real + email confirmation;
2. login/logout + refresh real;
3. password recovery redirect;
4. dos usuarios intentando acceder a datos ajenos vía API;
5. dos dispositivos provocando conflicto de revisión;
6. account deletion con usuario descartable;
7. offline/retry en red real.

Estos tests requieren que Vercel tenga las variables públicas y que Auth Site/Redirect URL esté configurado.

## Release gate

El patch 0.5.1 puede desplegarse; **la apertura a beta externa queda condicionada al E2E cloud y a los controles manuales de `AUTH-SETUP.md`.**

## Infraestructura real — aislamiento multiusuario

Prueba RLS transaccional en Supabase ORBITA (`tbxrglthrieafejxjecm`): **PASS**.

- owner A → own workspace: visible
- owner B → workspace A: invisible
- owner B → update workspace A: 0 rows
- owner B → own workspace: visible
- owner A → workspace B: invisible
- test rolled back completely

Security Advisor: **0 findings**.  
Performance Advisor: **0 findings**.

### Observación Realtime

El proyecto nuevo presenta logs internos de provisioning de Realtime (`realtime.subscription` ausente / database supervisor no encontrado). ORBITA V0.5 no usa Realtime y su flujo Auth/Data API no depende de ese servicio. No se modificará manualmente el schema administrado `realtime`; monitorear y escalar a Supabase si persiste antes de habilitar esa capacidad.
