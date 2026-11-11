# SISTEMA MULTI-AGENTE & LAS 22 REGLAS DE ORO — INVITACIONES DE MATRIMONIO

> **ESTÁNDAR OPERATIVO UNIVERSAL ACTIVO:**
> Este proyecto se rige de forma estricta e incondicional por las **22 Reglas Inmutables de Desarrollo**, la **Matriz de 15 Agentes Especializados** y el **Pipeline de 7 Fases** definidos en [AGENTS_PIPELINE.md](./AGENTS_PIPELINE.md) y en la carpeta [.agents/](./.agents/README.md).
>
> Todo cambio, diagnóstico o nuevo desarrollo debe satisfacer las **22 Reglas**, las pruebas locales previas y el **Bloqueo Absoluto de Git (Reglas 10 y 21)**.

---

## 1. LAS 22 REGLAS INMUTABLES DE DESARROLLO

### BLOQUE 1 — PROTOCOLO POR SOLUCIÓN DE UN ERROR (BUGFIX / HOTFIX)
*Aplica de forma inmediata e incondicional ante cualquier reporte de bug, falla, excepción, caída de servicio o comportamiento anómalo.*

1. Analizar y revisar a fondo el error que se está enviando.
2. Revisar detenidamente los insumos compartidos (logs, capturas, trazas, payloads, configuraciones) para revisar el error a fondo.
3. Utilizar 15 subagentes para la comprensión y lectura del error, y llegar a una solución óptima que cubra estos errores en su totalidad.
4. No asumir nada.
5. 100% REAL, nada de suposición. Toda afirmación o cambio debe basarse en evidencia tangible en código y logs reales.
6. No romper nada: estabilidad y retrocompatibilidad críticas.
7. Seguir estrictamente los lineamientos y directrices del proyecto (convenciones de código, arquitectura y estándares).
8. Verificar que la solución no dé errores colaterales, transversales o secundarios provocados por la implementación.
9. Realizar primero las pruebas de la implementación (el agente) y luego el usuario las confirma localmente.
10. No hacer commit ni push antes de que el usuario lo indique (primero se prueba local; si es satisfactorio, se hace commit + push).
11. No agregar comentarios con nombres o alusiones a nombres del cliente o proveedor. Comentarios descriptivos, objetivos, directos, funcionales y de negocio.

### BLOQUE 2 — PROTOCOLO POR NUEVO DESARROLLO O REQUERIMIENTO (HUs / TAREAS)
*Aplica de forma incondicional ante nuevas funcionalidades, módulos, HUs, endpoints, vistas o integraciones.*

12. Analizar y revisar a fondo el nuevo requerimiento que se está enviando.
13. Revisar detenidamente todos los insumos compartidos para cubrir el 100% de lo que solicita la HU o tarea.
14. Utilizar entre 10 a 15 subagentes para la comprensión y lectura del requerimiento y llegar a una solución óptima.
15. No asumir nada.
16. 100% REAL, nada de suposición. Todo diseño responde a especificaciones reales y validadas.
17. No romper nada: cero regresiones en funcionalidades existentes.
18. Seguir estrictamente los lineamientos y directrices del proyecto actual.
19. Verificar que la solución no genere errores colaterales, transversales o secundarios.
20. Realizar primero las pruebas de la implementación y luego el usuario las confirma localmente.
21. No hacer commit ni push antes de que el usuario lo indique.
22. No agregar comentarios con nombres o alusiones a nombres del cliente o proveedor.

---

## 2. PIPELINE DE 7 FASES Y MATRIZ DE AGENTES
- **Fuente modular operativa:** [.agents/](./.agents/README.md)
- **Orquestación:** [AGENTS_PIPELINE.md](./AGENTS_PIPELINE.md)
- **Arquitectura base objetivo:** Clean Architecture (`Domain <- Application <- Infrastructure / Presentation`), TypeScript estricto, base de datos independiente y contenerización Docker.
- **Estado actual del proyecto:** Fase 1 (Intake y levantamiento de requerimientos). Stack y módulos en validación con el usuario.
