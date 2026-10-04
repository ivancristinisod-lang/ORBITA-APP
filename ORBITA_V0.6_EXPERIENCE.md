# ORBITA V0.6 — Experience Upgrade

Status: **RELEASE CANDIDATE / VALIDATION**

## Goal

Convertir la inteligencia relacional ya funcional de ORBITA en una experiencia más clara, distintiva y accionable sin reescribir el core ni ampliar el scope del MVP.

El loop protagonista es:

**OBJETIVO → RED → EVIDENCIA → OPORTUNIDAD → ACCIÓN**

## Experience principles

1. El objetivo actual es la principal primitiva de producto.
2. Una recomendación existe solo cuando hay evidencia registrada suficiente.
3. Hecho, inferencia y acción tienen semánticas visuales diferentes.
4. Una relación se presenta como historia y contexto, no como registro de CRM.
5. Cero recomendaciones es un estado válido.
6. Mobile tiene composición propia.
7. La complejidad administrativa vive fuera del flujo principal.

## Information architecture

Se preservan las cinco superficies canónicas:

- **HOY:** inteligencia y acción diaria.
- **PERSONAS:** exploración rápida de relaciones.
- **RED:** estructura general o relevancia respecto del objetivo.
- **AGENDA:** reuniones con contexto relacional.
- **DATOS:** portabilidad, sistema, cuenta y herramientas avanzadas.

## Screen changes

### HOY
- Objetivo actual dominante.
- Acción explícita **ANALIZAR MI RED**.
- Ranking de oportunidades con #1 visualmente dominante.
- Evidencia, confianza y relevancia visibles antes de profundizar.
- Cola única **NECESITA TU ATENCIÓN** en lugar de proliferación de widgets.
- Memoria relacional y próximas reuniones pasan a segundo nivel.

### PERSONAS
- Filas completas clickeables.
- Menos acciones y métricas visibles por fila.
- Estado, último contacto, círculo y pendientes como señales escaneables.
- Edición secundaria dentro del detalle.

### DETALLE DE RELACIÓN
Orden: **AHORA → CONTEXTO → COMPROMISOS → OPORTUNIDADES → HISTORIA**.
La historia combina interacciones, reuniones, compromisos y oportunidades en una timeline longitudinal.

### RED
Dos modos:
- **MI RED:** estructura general.
- **POR OBJETIVO:** atenúa nodos sin evidencia y enfatiza relaciones relevantes para el objetivo actual.

No se dibujan conexiones inexistentes ni se usa prominencia como medida de valor humano.

### AGENDA
Las próximas reuniones se presentan primero como briefs relacionales: persona, último contacto, compromisos, oportunidades y relación con el objetivo actual. El calendario queda como herramienta secundaria; en mobile la experiencia es list-first.

### DATOS
La navegación se simplifica en:
- Mi información
- Sistema
- Cuenta
- Avanzado

Los detalles técnicos dejan de competir con el uso normal.

### CAPTURAR
La entrada comienza con **¿Qué pasó?** y un campo libre grande. Después el usuario elige la estructura en la que quiere guardar el dato. V0.6 no implementa parsing inteligente ficticio.

### ONBOARDING
Tres etapas:
1. Promesa central y loop de producto.
2. Identidad mínima.
3. Objetivo actual.

## Removed / hidden elements

- Pulso relacional y métricas de dashboard dejan de dominar HOY.
- Acciones CRUD repetidas se reducen en PERSONAS.
- Metadatos técnicos se desplazan fuera de la vista principal de DATOS.
- El calendario deja de ser el protagonista de AGENDA en mobile.
- Preferencias de cadencia y objetivos genéricos se retiran del onboarding inicial.

Las capacidades subyacentes no se eliminan si siguen siendo funcionales.

## Design tokens

| Token | Valor | Uso |
|---|---|---|
| Background | `#070807` | Base |
| Surface 1 | `#0D0F0D` | Superficie primaria |
| Surface 2 | `#121411` | Superficie secundaria |
| Surface 3 | `#181A16` | Profundidad |
| Border | `#292C25` | Estructura |
| Acid | `#DCFF00` | Acción / selección |
| Cobalt | `#2747FF` | Inteligencia / inferencia |
| Ivory | `#E9DFCB` | Contexto humano / evidencia |
| Alert | `#FF5738` | Riesgo real |
| Healthy | `#62B36D` | Estado saludable |

## Motion rules

Motion explica orientación, foco o cambio de estado. No hay partículas, cursores custom, WebGL ni animación permanente. `prefers-reduced-motion` desactiva transiciones no esenciales.

## Responsive rules

- HOY: objetivo → análisis → ranking → atención → contexto secundario.
- PERSONA: identidad → ahora → contexto → compromisos → oportunidades → historia.
- RED: superficie de exploración prioritaria.
- AGENDA: list-first en mobile.
- Sin overflow horizontal intencional.
- Targets y controles mantienen tamaño utilizable.

## Accessibility

Baseline: navegación por teclado, focus visible, botones semánticos, dialogs cerrables con ESC, contraste razonable, labels, reduced motion y tamaños de texto legibles.

## Known trade-offs

- Se mantiene la arquitectura vanilla existente para minimizar blast radius.
- La visualización orbital sigue siendo DOM/CSS; no se introduce canvas/WebGL.
- La captura libre no intenta inferir entidades automáticamente.
- El motor de oportunidades sigue siendo determinístico y local.

## Deferred ideas

- Captura por voz.
- Integraciones Gmail / Calendar / LinkedIn / WhatsApp.
- Consultas conversacionales sobre la red.
- Automatización de outreach.
- Graph/vector databases.
- Arquitectura multiagente dentro del producto.

## Regression contract

V0.6 debe preservar:
- CRUD y persistencia.
- Import/export.
- Meeting Brief factual.
- Ranking preparado para fundraising.
- Cero resultados para objetivos sin evidencia.
- Trazabilidad de evidencia.
- Auth/cloud stage gate.
- Seguridad de secretos y permisos.

## Definition of done

V0.6 está lista solo si build y validaciones pasan, los journeys modificados funcionan en desktop/mobile, la jerarquía visual se sostiene, no se rompe el motor relacional y la rama puede revisarse mediante PR sin modificar directamente `main`.
