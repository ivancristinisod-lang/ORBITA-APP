# ORBITA CANON — V0.5

Status: **ACTIVE / HQ APPROVED DIRECTION**

## Definition

ORBITA es un **agente de inteligencia relacional**. No es un CRM, red social, gestor de leads ni automatizador de outreach.

## Usuario inicial

Founders, emprendedores y operadores con una red profesional activa que pierden contexto, seguimientos, compromisos u oportunidades entre conversaciones.

## Wedge actual

**Networking profesional manual-first.**

## Tesis

> ORBITA no maximiza contactos. Maximiza relaciones valiosas mediante mejor contexto y mejores acciones.

## Loop V0.5

```text
CAPTURAR
  ↓
ORGANIZAR CONTEXTO
  ↓
DETECTAR QUÉ MERECE ATENCIÓN
  ↓
PREPARAR LA CONVERSACIÓN
  ↓
ACTUAR
  ↓
REGISTRAR QUÉ PASÓ
```

## Superficies canónicas

1. **HOY** — qué merece atención ahora.
2. **PERSONAS** — historia y contexto de cada relación.
3. **RED** — representación de círculos e intención.
4. **AGENDA** — reuniones, compromisos y preparación.
5. **DATOS** — portabilidad, actividad, oportunidades, cuenta y salud del workspace.

No agregar una sexta superficie principal sin demostrar que el problema no puede resolverse claramente dentro de estas cinco.

## Entrada actual

Manual-first:

- persona;
- interacción;
- compromiso;
- oportunidad;
- reunión;
- CSV de contactos;
- JSON de backup.

Integraciones automáticas se deciden después de observar qué información los usuarios realmente consideran valiosa.

## Principios relacionales

- Las personas no son leads.
- Una relación no se reduce a un score opaco.
- Toda señal debe poder explicarse desde datos observables.
- Hecho e inferencia deben permanecer diferenciados.
- Frecuencia no equivale a calidad humana.
- Automatización no debe degradar autenticidad.
- Privacidad, portabilidad y corrección forman parte del producto.

## Auth / persistencia V0.5

- Backend/Auth actual: Supabase.
- Región actual: São Paulo para la beta inicial.
- Persistencia MVP: un workspace JSONB por `auth.users.id`.
- Aislamiento: RLS + FORCE RLS por propietario.
- Cache: `localStorage` scoped por usuario.
- Sin cloud config: Modo local explícito, nunca auth simulada.
- Publishable key puede existir en browser; secret/service credentials nunca.
- Metadatos de integridad (`revision`, timestamps, payload schema) son server-controlled.
- Sync usa **optimistic concurrency**. Un dispositivo con revisión obsoleta no puede pisar silenciosamente un cambio más nuevo.
- Conflictos se detienen y se exponen al usuario; no se hace merge destructivo automático.
- Eliminación de cuenta es una operación privilegiada server-side y borra el workspace por cascada.

Esta arquitectura es una decisión MVP deliberadamente migrable, no un compromiso irreversible de largo plazo.

## Seguridad como gate de producto

Antes de ingestión automática de fuentes especialmente sensibles o una expansión pública significativa, ORBITA debe revisar la arquitectura de sesión client-only y migrar a una estrategia server-assisted/HttpOnly cuando corresponda.

No se agrega una integración porque sea técnicamente posible: antes debe existir consentimiento, minimización, retención, trazabilidad y un modelo claro de confianza.

## No objetivos actuales

- OAuth social.
- Gmail/Calendar/LinkedIn/WhatsApp.
- Automatización de mensajes.
- IA ficticia.
- Graph DB o vector DB sin necesidad demostrada.
- Equipos colaborativos.
- CRM de ventas.
- Gamificación de relaciones.

## Gate siguiente

Antes de sumar otra gran capa:

1. activar Auth cloud real en producción;
2. validar aislamiento con dos usuarios;
3. validar onboarding y primeras relaciones;
4. observar retorno al producto;
5. validar utilidad de señales y Meeting Brief;
6. descubrir qué input manual merece automatizarse primero.
