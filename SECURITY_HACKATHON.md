# ORBITA — Seguridad del candidato Hackathon

## Datos privados

No deben publicarse on-chain ni incluirse en memos: nombres, emails, teléfonos, notas, objetivo del founder, conversaciones, evidencia o contexto relacional.

## Datos demo

El repositorio incluye un dataset sintético para QA y demostración. Los contactos demo usan identidades ficticias y datos de ejemplo.

## Credenciales

- `.env` y `.env.local` están ignorados por Git.
- El browser build rechaza claves con forma `sb_secret_*`.
- La configuración cloud sólo admite claves públicas `sb_publishable_*`.
- Las credenciales privilegiadas de Supabase pertenecen únicamente a Edge Functions/entornos server-side.

## Solana

El adaptador actual genera solamente un digest verificable y un payload mínimo. No contiene claves privadas ni lógica de firma embebida.
