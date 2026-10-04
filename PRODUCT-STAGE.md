# ORBITA — Product Stage

**Product generation:** V0.5  
**Patch:** 0.5.2  
**Stage:** Productized High-Fidelity Prototype → Functional Alpha / Pre-MVP

## Qué significa

ORBITA ya no es una idea, una landing ni un mockup. La experiencia principal existe en código real, es navegable y permite usar los flujos manuales centrales de punta a punta.

La prioridad actual es **ejecución + convergencia + validación**, no expansión indiscriminada de features.

## Capas ya resueltas

- tesis inicial de producto y wedge de founders/emprendedores;
- arquitectura de información y navegación;
- cinco superficies canónicas: Hoy, Personas, Red, Agenda y Datos;
- high-fidelity frontend en código;
- CRUD manual y persistencia local;
- onboarding, ayuda, búsqueda y export/import;
- modelo inicial de datos y contratos de backend;
- adaptadores de Auth/cloud desacoplados del frontend;
- baseline de seguridad para futura activación multiusuario.

## Definición de Functional Alpha para ORBITA

Entramos plenamente en Functional Alpha cuando un usuario real pueda:

1. crear una cuenta;
2. completar onboarding;
3. cargar y editar relaciones;
4. registrar interacciones, compromisos, oportunidades y reuniones;
5. cerrar sesión;
6. volver desde otro dispositivo;
7. recuperar exactamente su información;
8. hacerlo con aislamiento real entre usuarios.

## Stage gate actual

La aplicación corre por defecto en **LOCAL ALPHA**. El frontend nunca queda bloqueado por una integración incompleta.

Cloud requiere activación explícita:

`ORBITA_ENABLE_CLOUD=true`

Solo se habilita después de validar Auth, RLS, redirects, recuperación, aislamiento multiusuario y persistencia.

## Qué NO declaramos todavía

- MVP validado;
- Product-Market Fit;
- producto terminado;
- inteligencia relacional autónoma;
- ingestión automática de redes/email/calendar.

## Próximo milestone de producto

**Primer usuario externo → primera sesión real → primera semana de uso → primer retorno voluntario.**

A partir de ahí ORBITA deja de ser evaluado solamente por lo que construimos y empieza a ser evaluado por lo que las personas realmente usan.
