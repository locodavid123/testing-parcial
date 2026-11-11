# Auditoría de Calidad de Software — TutorAssigner
## Proyecto Final · Electiva Testing y QA

> **Rol Asumido:** Empresa Consultora de Quality Assurance (QA) — *QA Advisory & Testing Partners*  
> **Aplicación Auditada:** TutorAssigner (Matching de Tutorías entre Pares)  
> **Modalidad:** Equipo de 2 Estudiantes  
> **Herramienta de Automatización:** Playwright Test (v1.63.0) + TypeScript  
> **Framework de Pruebas Unitarias / Cobertura:** Vitest (v3.2.4) + V8 Coverage  

---

## 📁 Índice de Entregables del Proyecto

Todos los documentos requeridos en la guía del proyecto final han sido estructurados y redactados con rigor técnico e imparcialidad profesional:

| Entregable | Documento | Descripción y Contenido Principal |
| :--- | :--- | :--- |
| **Entregable 1** | [**01-PLAN-DE-PRUEBAS.md**](./01-PLAN-DE-PRUEBAS.md) | Objetivo de la auditoría, alcance (in/out), funcionalidades por evaluar y matriz de riesgos (ISO 29119 / ISTQB). |
| **Entregable 2** | [**02-CASOS-DE-PRUEBA-30.md**](./02-CASOS-DE-PRUEBA-30.md) | Catálogo maestro de **30 casos de prueba** distribuidos en: Pruebas Positivas (6), Negativas (6), Valores Límite (6), Tablas de Decisión (6) y Transición de Estados (6). |
| **Entregable 3** | [**03-REPORTE-DE-DEFECTOS-10.md**](./03-REPORTE-DE-DEFECTOS-10.md) | Reporte formal de **10 defectos reales y reproducibles** con severidad (Crítica, Alta, Media, Baja), prioridad (P1-P4), pasos para reproducir y evidencias. |
| **Entregable 4** | [**04-AUTOMATIZACION-PLAYWRIGHT.md**](./04-AUTOMATIZACION-PLAYWRIGHT.md) | Suite de automatización E2E con Playwright: justificación de los 5 casos críticos, código fuente, guía de ejecución y resultados. |
| **Entregable 5** | [**05-REPORTE-DE-COBERTURA.md**](./05-REPORTE-DE-COBERTURA.md) | Reporte de cobertura superior al 50% (**79.9% en código**, **100% en requisitos**, **100% en casos**), diferenciando los 3 tipos de cobertura. |
| **Entregable 6** | [**06-INFORME-FINAL-AUDITORIA.md**](./06-INFORME-FINAL-AUDITORIA.md) | Informe ejecutivo de consultoría para el cliente con el **Concepto Final justificado: ¿Está lista para producción? (Dictamen: NO condicionado)**. |
| **Sustentación** | [**07-GUION-SUSTENTACION-10MIN.md**](./07-GUION-SUSTENTACION-10MIN.md) | Estructura de diapositivas y guion minuto a minuto para la exposición oral de 10 minutos entre los 2 integrantes. |

---

## 🚀 Código de Automatización E2E

El código de las 5 pruebas automatizadas solicitadas en el Entregable 4 está disponible en:
- [`tests/e2e/specs/auditoria-tutorias.spec.ts`](../../tests/e2e/specs/auditoria-tutorias.spec.ts)

### Comandos Rápidos de Ejecución

```bash
# 1. Levantar la aplicación con Docker Compose
docker compose up -d

# 2. Correr las pruebas automatizadas en contenedor oficial de Playwright
docker compose --profile e2e run --rm e2e

# 3. O correr localmente en modo interactivo (requiere Node 22+)
cd tests/e2e
npm install
npx playwright test --ui
```

---

## 📊 Métricas Consolidadas de la Auditoría

- **Casos de Prueba:** 30 ejecutados (24 Aprobados · 6 Fallidos)
- **Defectos Reportados:** 10 defectos (1 Crítico · 2 Altos · 5 Medios · 2 Bajas)
- **Cobertura de Código Fuente:** **79.9%** (Meta: > 50%)
- **Cobertura del Motor de Matching:** **92.4%**
- **Tasa de Éxito de Automatización:** **100%** (5/5 pruebas pasadas en ~10.1 segundos)
- **Concepto Técnico:** **NO está lista para producción** hasta mitigar los defectos críticos de concurrencia y gestión de tutores.

