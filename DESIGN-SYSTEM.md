# ORBITA — Design System 0.6.1

## Product expression

ORBITA debe sentirse premium, editorial, tecnológico y humano. La interfaz prioriza comprensión y confianza sobre densidad visual.

## Product hierarchy

**OBJETIVO → RED → EVIDENCIA → OPORTUNIDAD → ACCIÓN**

En HOY:

**OBJETIVO → OPORTUNIDADES → NECESITA TU ATENCIÓN → MEMORIA RELACIONAL**

## Navigation

Solo cuatro superficies principales:

**HOY / PERSONAS / RED / DATOS**

Agenda no forma parte del MVP V0.6.1.

## Palette

- Background: `#070807`
- Surface 1: `#0D0F0D`
- Surface 2: `#121411`
- Surface 3: `#181A16`
- Border: `#292C25`
- Acid: `#DCFF00` — acción / selección
- Cobalt: `#2747FF` — inteligencia / inferencia
- Ivory: `#E9DFCB` — evidencia / lectura humana
- Alert: `#FF5738` — riesgo real
- Healthy: `#62B36D` — estado saludable

## Evidence semantics

- **HECHO:** ivory / neutral.
- **INFERENCIA:** cobalt.
- **ACCIÓN:** acid.
- **RIESGO:** alert.

Una inferencia nunca se presenta como hecho.

## RED

RED es goal-first. Con objetivo, el objetivo actual domina, las relaciones relevantes se destacan y las irrelevantes se atenúan. No se inventan edges.

La **RED COMPLETA** se conserva como vista secundaria. Sin objetivo se muestra un empty state con **DEFINIR OBJETIVO** y fallback **VER RED COMPLETA**.

## PERSONAS

La fila completa debe ser semánticamente interactiva y accesible. Evitar pseudo-buttons y nested interactive controls inválidos.

El detalle mantiene: **AHORA → CONTEXTO → COMPROMISOS → OPORTUNIDADES → HISTORIA**. Meetings legacy no se muestran.

## Motion

Motion explica orientación o cambio de estado. Sin partículas, glow permanente ni WebGL ornamental. Respetar `prefers-reduced-motion`.

## Principle

**Las personas no son leads y una relación no es un score.**

La relevancia contextual existe para una tarea concreta; no mide el valor de una persona.
