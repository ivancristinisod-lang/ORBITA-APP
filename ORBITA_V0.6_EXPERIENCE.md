# ORBITA V0.6.1 — Product Simplification Patch

Status: **RELEASE CANDIDATE / VALIDATION**

## Mission

**LIMPIAR → SIMPLIFICAR → ALINEAR → PRESERVAR CORE → VALIDAR**

La historia de producto es:

**QUÉ QUIERO LOGRAR → QUIÉN DE MI RED ES RELEVANTE → POR QUÉ → QUÉ OPORTUNIDAD EXISTE → QUÉ HAGO AHORA**

## Canonical surfaces

1. **HOY**
2. **PERSONAS**
3. **RED**
4. **DATOS**

No existe una quinta superficie activa en V0.6.1.

## Agenda removal

Agenda fue removida del MVP activo porque ORBITA no busca competir con un calendario.

Retirado de UI:
- navegación Agenda
- vista Agenda
- calendar UI
- creación/edición de meetings
- Meeting Brief
- próximas reuniones
- signals de meeting en presentation layer
- handlers y helpers exclusivos de Agenda

### Historical data

`meetings[]` puede seguir presente en schema/store para backward compatibility.

**Legacy compatibility — not an active V0.6.1 product surface.**

La aplicación puede cargar, normalizar, importar y exportar workspaces históricos sin destruir ese array, pero no lo muestra ni permite generar meetings nuevos.

## HOY

Orden: objetivo actual → oportunidades → necesita tu atención → memoria relacional. No se reemplaza Agenda por otro widget.

## RED — goal-first

Cuando existe `profile.currentGoal`, RED abre en modo objetivo.

### Modo principal

**RED PARA TU OBJETIVO** muestra objetivo actual, total analizado, cantidad con evidencia relevante, ranking y nodos relevantes destacados. No inventa edges.

### Vista secundaria

**VER RED COMPLETA** preserva la exploración total sin competir como modo primario.

### Sin objetivo

Empty state **DEFINÍ UN OBJETIVO PARA LEER TU RED**. CTA primario → HOY + foco al input; CTA secundario → VER RED COMPLETA.

## Visible implementation language

La UI ya no usa “LOCAL”, “LOCAL ALPHA”, “LOCAL · EXPLICABLE”, “SOLO NAVEGADOR” o “MODO LOCAL” como branding. Cuando hace falta explicar persistencia se usa lenguaje de usuario, por ejemplo: **Tus datos permanecen en este dispositivo.**

La arquitectura técnica puede seguir documentándose como local-first.

## PERSONAS / accessibility

Las filas de PERSONAS son controles semánticos con `aria-label` y activación nativa. No hay nested interactive controls en la fila principal.

## Capture

Tipos activos: Persona, Interacción, Compromiso y Oportunidad. No existe creación de meeting desde la UI.

## Regression contract

Debe preservarse ranking fundraising, cero recomendaciones para objetivos no relacionados, evidencia trazable, CRUD activo, persistencia, import/export, auth/cloud stage gate, seguridad de secretos y compatibilidad histórica de meetings.

## Definition of done

- exactamente 4 rutas canónicas
- Agenda ausente del producto activo
- meetings legacy preservados sin UI
- visible “LOCAL” eliminado como branding
- RED goal-first
- full-network fallback
- CTAs semánticamente correctos
- accessibility de PERSONAS
- checks/tests/build verdes
- preview Vercel disponible
- main intacto
