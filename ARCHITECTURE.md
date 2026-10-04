# ORBITA — Architecture Notes

## Estado actual

Esta maqueta es deliberadamente frontend-only y dependency-free.

### Razones

- validar producto antes de infraestructura;
- deploy rápido;
- cero secretos;
- fácil de auditar;
- fácil de migrar;
- mínima superficie de fallos.

## Arquitectura de esta versión

```text
Browser
  ├─ index.html
  ├─ styles.css
  ├─ app.js
  └─ data.js (fixtures)
```

Build:

```text
src/ → scripts/build.mjs → dist/
```

## Arquitectura futura candidata

```text
Frontend
    ↓
Application API
    ↓
Identity / Permissions
    ↓
Relational Intelligence Layer
    ├─ People
    ├─ Relationships
    ├─ Interactions
    ├─ Facts
    ├─ Inferences
    ├─ Commitments
    ├─ Opportunities
    └─ Events
    ↓
Memory Layer
    ├─ Relational database
    ├─ Semantic retrieval
    └─ Relationship graph
```

## Regla crítica

No decidir todavía que ORBITA "necesita" vector DB, graph DB o una arquitectura multiagente.

Primero deben existir:

1. casos de uso;
2. queries reales;
3. modelo de datos;
4. volumen esperado;
5. requisitos de trazabilidad.

La tecnología se elige después.

## Modelo conceptual preliminar

```text
User
 ├─ Person
 │   ├─ Interaction
 │   │   ├─ Fact
 │   │   └─ Commitment
 │   ├─ Topic
 │   └─ Opportunity
 └─ Relationship
     ├─ Evidence
     ├─ State
     └─ Inference
```

`Inference` nunca debería reemplazar a `Evidence`.
