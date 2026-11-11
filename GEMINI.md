# GEMINI.md — Contexto Operativo del Proyecto

Este repositorio sigue estrictamente la arquitectura multi-agente definida en:
- [AGENTS.md](./AGENTS.md) (Single Source of Truth — 22 Reglas Inmutables)
- [AGENTS_PIPELINE.md](./AGENTS_PIPELINE.md) (Suite de 15 Agentes y Pipeline de 7 Fases)
- [.agents/](./.agents/README.md) (Reglas, roles y skills modulares)

## Reglas no negociables
1. Cero suposiciones (100% evidencia real en código, esquemas y logs).
2. Clean Architecture estricta y base de datos autónoma del proyecto.
3. Bloqueo absoluto de Git (Reglas 10 y 21): nunca hacer `commit`, `push`, `merge` ni `reset` sin autorización explícita del usuario tras sus pruebas locales.
4. Comentarios limpios (Reglas 11 y 22): cero referencias a clientes o proveedores en comentarios o código.
5. Validar pruebas (`typecheck`, `lint`, `test`, `build`) antes de dar una entrega por finalizada.
