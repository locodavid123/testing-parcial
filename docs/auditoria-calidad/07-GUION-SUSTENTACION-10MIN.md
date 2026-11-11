# Entregable 7: Guion y Estructura de Sustentación (10 Minutos)

**Proyecto:** Auditoría de Calidad — TutorAssigner  
**Rol del Equipo:** Consultores Senior de QA frente al Cliente / Jurado  
**Duración Total:** 10 Minutos cronometrados (5 minutos por integrante)  
**Modalidad:** Equipo de 2 Estudiantes (Consultor 1 y Consultor 2)  

---

## Estructura General de los 10 Minutos

```text
[00:00 - 02:00] Bloque 1: Aplicación Evaluada, Alcance y Metodología (Consultor 1)
[02:00 - 04:00] Bloque 2: Estrategia de Pruebas y Principales Escenarios (Consultor 2)
[04:00 - 06:00] Bloque 3: Defectos Más Relevantes Encontrados (Consultor 1)
[06:00 - 08:00] Bloque 4: Demostración de Automatización E2E y Cobertura (Consultor 2)
[08:00 - 10:00] Bloque 5: Concepto Final, Roadmap y Recomendaciones (Ambos Consultores)
```

---

## Diapositiva 1 (00:00 - 01:00): Presentación y Aplicación Evaluada
- **Responsable:** Consultor 1
- **Contenido Visual:**
  - Título: *Auditoría de Calidad y Concepto Técnico de Salida a Producción — TutorAssigner*.
  - Nombre de la consultora: *QA Advisory & Testing Partners*.
  - Arquitectura del sistema: Monolito modular (React 19 + Vite, Node.js + Express, PostgreSQL 17, motor determinista `packages/matching`).
- **Guion Oral:**
  > "Buenos días, miembros del comité. En representación de nuestra firma consultora QA Advisory & Testing Partners, hoy les presentamos los resultados de la auditoría integral de calidad realizada sobre la plataforma web **TutorAssigner**, un sistema orientado a automatizar el emparejamiento inteligente de tutorías entre pares universitarios. Nuestro objetivo como auditores independientes fue someter el sistema a pruebas rigurosas, evaluar su robustez algorítmica y emitir un concepto técnico objetivo sobre si la aplicación está lista para salir a producción."

---

## Diapositiva 2 (01:00 - 02:00): Alcance de la Auditoría
- **Responsable:** Consultor 1
- **Contenido Visual:**
  - Tabla In-Scope vs. Out-of-Scope.
  - Módulos auditados: Autenticación, Tutores y Franjas, Solicitudes, Motor de Matching, Asignaciones, Configuración de Pesos.
  - Exclusiones justificadas: Integraciones SMTP externas, Pasarelas de pago, Aplicaciones móviles nativas.
- **Guion Oral:**
  > "El alcance de nuestra auditoría cubrió de extremo a extremo los 6 módulos nucleares del sistema: desde el control de acceso del coordinador, la disponibilidad horaria de los tutores, el registro de solicitudes estudiantiles, hasta el motor algorítmico de matching con criterios ponderados y la confirmación de asignaciones. Dejamos fuera del alcance las integraciones externas que no forman parte del MVP contratado, garantizando un foco estricto en la lógica de negocio y la estabilidad del producto."

---

## Diapositiva 3 (02:00 - 04:00): Estrategia de Pruebas y Matriz de 30 Casos
- **Responsable:** Consultor 2
- **Contenido Visual:**
  - Distribución de los 30 casos de prueba por técnicas ISTQB:
    * Pruebas Positivas (6)
    * Pruebas Negativas (6)
    * Análisis de Valores Límite (6)
    * Tablas de Decisión (6)
    * Transición de Estados (6)
  - Gráfico de resultados: 24 Aprobados (80%) vs. 6 Fallidos (20%).
- **Guion Oral:**
  > "Para garantizar una evaluación integral, diseñamos y ejecutamos un catálogo maestro de **30 casos de prueba** estructurados en 5 enfoques formales:
  > - Validamos los flujos felices con **pruebas positivas** de punta a punta.
  > - Evaluamos la resiliencia con **pruebas negativas**, forzando credenciales inválidas, duplicidad de correos y solapamientos de franjas horarias.
  > - Con **análisis de valores límite (BVA)**, probamos los extremos de las duraciones de sesión en 29, 30, 240 y 241 minutos, y los límites de normalización de prioridades y dominio de 1 a 5.
  > - Mediante **tablas de decisión**, pusimos a prueba los 4 filtros de elegibilidad del motor de matching: tutor activo, dominio de materia, solape de franja horaria suficiente y cupo disponible.
  > - Y con **transición de estados**, verificamos el ciclo de vida de las solicitudes entre ABIERTA, ASIGNADA y CANCELADA.
  > El resultado global fue de **24 casos aprobados (80%)** y **6 casos fallidos (20%)**, que nos permitieron aislar defectos reales de la aplicación."

---

## Diapositiva 4 (04:00 - 06:00): Hallazgos Críticos y Reporte de Defectos
- **Responsable:** Consultor 1
- **Contenido Visual:**
  - Matriz de Severidad: 1 Crítico, 2 Altos, 5 Medios, 2 Bajas (Total: 10 bugs).
  - Destacados:
    * **BUG-04 (Crítico):** Condición de carrera en concurrencia que permite sobreasignar tutores más allá de su capacidad máxima.
    * **BUG-01 (Alto):** Falta de array de dependencias en `useEffect` de la página de recomendaciones.
    * **BUG-07 (Alto):** Desactivación de tutores con asignaciones activas huérfanas.
- **Guion Oral:**
  > "Documentamos formalmente **10 defectos reales y verificables**, respaldados con evidencias de código y red. Destacamos tres de alto impacto:
  > Primero, el **BUG-04, de severidad Crítica**: identificamos un riesgo de condición de carrera en el servicio de asignaciones. Si dos coordinadores confirman casi simultáneamente solicitudes recomendadas al mismo tutor cuando le queda un solo cupo, el sistema puede sobrepasar su capacidad máxima, violando el balance de carga docente.
  > Segundo, el **BUG-01, de severidad Alta**: en el frontend, la pantalla de recomendaciones omitió el arreglo de dependencias en su `useEffect`, lo que provoca evaluaciones innecesarias y riesgos de saturación al servidor.
  > Y tercero, el **BUG-07**: el sistema permite apagar a un tutor sin alertar que tiene tutorías activas pendientes, dejando a estudiantes en un limbo operativo. Estos hallazgos demuestran la importancia de una auditoría exhaustiva antes de abrir el sistema a usuarios reales."

---

## Diapositiva 5 (06:00 - 08:00): Demostración de Automatización E2E y Cobertura
- **Responsable:** Consultor 2
- **Contenido Visual:**
  - Capturas / Video o consola de ejecución de Playwright: 5 pruebas ejecutadas en 10.1 segundos (100% pass).
  - Reporte de Cobertura triple:
    * Cobertura de Requisitos (RTM): 100%
    * Cobertura de Ejecución de Casos: 100%
    * Cobertura de Código Fuente (Vitest): **79.9%** (Statements), **92.4%** en el motor de matching.
- **Guion Oral:**
  > "Para asegurar la no regresión de la plataforma, implementamos una suite automatizada End-to-End con **Playwright Test** en TypeScript. Automatizamos 5 casos neurálgicos: login del coordinador, alta de tutor con validación de disponibilidad, creación de solicitud, cálculo algorítmico de matching con desglose, y confirmación de la asignación. La suite corre de forma desatendida en tan solo **10.1 segundos** con una tasa de éxito del **100%**.
  > En cuanto a cobertura, queremos ser muy claros: diferenciamos formalmente cobertura de requisitos, de casos y de código. Logramos una **cobertura de código del 79.9%** en sentencias, superando ampliamente el umbral del 50% exigido. Más aún, el núcleo algorítmico del matching alcanza un contundente **92.4%** de cobertura, lo que certifica la precisión de la lógica matemática del producto."

---

## Diapositiva 6 (08:00 - 10:00): Concepto Técnico Final y Recomendaciones
- **Responsable:** Ambos Consultores
- **Contenido Visual:**
  - Dictamen en grande: **NO (Condicionado a remediación de defectos críticos y altos)**.
  - Semáforo de preparación:
    * Arquitectura y Algoritmo: **VERDE (Excelente)**
    * Cobertura y Automatización: **VERDE (Excelente, 79.9%)**
    * Concurrencia y Validaciones Frontend: **ROJO (Requiere Hardening)**
  - Plan de remediación: Sprint de Hardening de 1 a 2 semanas.
- **Guion Oral:**
  > *(Consultor 1)*: "Llegamos al punto determinante: **¿Está la aplicación lista para producción?**
  > La respuesta concluyente de nuestro dictamen técnico es: **NO, en su estado actual no está lista para producción**."
  >
  > *(Consultor 2)*: "Queremos ser muy justos con el equipo de desarrollo: la arquitectura es sólida, la modularidad está muy bien lograda y el motor de matching es excepcional. Sin embargo, como consultores de calidad no podemos avalar un pase a producción mientras persista el defecto crítico **BUG-04 de concurrencia** y los defectos altos de gestión de tutores. Permitir que el sistema salga hoy a producción expondría a la institución a inconsistencias en asignaciones docentes y solicitudes abandonadas."
  >
  > *(Consultor 1)*: "Por ello, nuestra recomendación ejecutiva es implementar un **Sprint de Hardening de 1 a 2 semanas** enfocado en aplicar bloqueos transaccionales a nivel de base de datos (`pg_advisory_xact_lock`), corregir los hooks en React y blindar la desactivación de tutores. Una vez remediados y verificados estos tres puntos mediante una ronda de re-testing con nuestra suite de Playwright, **TutorAssigner obtendrá con total solvencia la certificación técnica de Go-Live para producción**.
  > Muchas gracias. Quedamos a su disposición para resolver cualquier pregunta técnica del comité."

