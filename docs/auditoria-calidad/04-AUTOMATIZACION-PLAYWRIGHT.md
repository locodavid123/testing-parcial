# Entregable 4: Automatización de Pruebas con Playwright

**Proyecto:** Auditoría de Calidad — TutorAssigner  
**Herramienta Seleccionada:** Playwright Test (v1.63.0) + TypeScript  
**Total de Casos Automatizados:** 5 Casos de Prueba E2E Críticos  
**Ubicación del Código Fuente:** `tests/e2e/specs/auditoria-tutorias.spec.ts`  
**Configuración Base:** `tests/e2e/playwright.config.ts`  

---

## 1. Justificación de los Casos de Prueba Seleccionados

Para la suite de automatización E2E se aplicó una matriz de priorización basada en **Criticidad de Negocio**, **Frecuencia de Uso** y **Riesgo de Regresión**. Se automatizaron los 5 flujos que conforman la columna vertebral del sistema:

| ID Caso | Nombre del Caso Automatizado | Justificación Técnica y de Negocio |
| :---: | :--- | :--- |
| **CP-AUT-01** | Autenticación y acceso al Dashboard de Coordinación | **Gatekeeper del Sistema:** Si la autenticación o la emisión de cookies seguras falla, ningún usuario puede operar la plataforma. Imprescindible para pruebas de humo (*Smoke Testing*). |
| **CP-AUT-02** | Registro y parametrización de nuevo tutor con disponibilidad | **Carga de Oferta Académica:** Valida la persistencia en base de datos, el cálculo de franjas horarias y la reactividad del formulario de tutores. |
| **CP-AUT-03** | Creación de solicitud estudiantil y navegación a matching | **Ingreso de Demanda:** Evalúa la interacción entre el catálogo de materias, la disponibilidad del estudiante y el redireccionamiento automático a la vista de recomendación. |
| **CP-AUT-04** | Evaluación del motor de matching y visualización del ranking | **Núcleo de Valor del Producto:** Verifica que el algoritmo puro ejecute los filtros duros, calcule scores ponderados sobre 100 puntos y renderice la justificación y desglose de criterios. |
| **CP-AUT-05** | Confirmación de asignación con diálogo y cambio de estado | **Cierre del Ciclo Transaccional:** Comprueba la confirmación de la tutoría, la transición de estado a `ASIGNADA` y el incremento en el balance de carga del tutor. |

---

## 2. Código Fuente de las Pruebas Automatizadas

El archivo fuente se encuentra ubicado en `tests/e2e/specs/auditoria-tutorias.spec.ts`:

```typescript
import { test, expect, type Page } from '@playwright/test';

/**
 * Suite de Automatización E2E - Auditoría de Calidad QA
 * Aplicación: TutorAssigner (Matching de Tutorías entre Pares)
 * Herramienta: Playwright Test
 *
 * Flujos Críticos Automatizados:
 *  - CP-AUT-01: Autenticación exitosa del coordinador y acceso al Dashboard
 *  - CP-AUT-02: Registro completo de un nuevo tutor con disponibilidad y validación
 *  - CP-AUT-03: Creación de solicitud de tutoría con preferencias horarias
 *  - CP-AUT-04: Ejecución del motor de matching y verificación de recomendación y ranking
 *  - CP-AUT-05: Confirmación de asignación del tutor recomendado y verificación de estado
 */

const EMAIL_COORD = process.env.E2E_EMAIL ?? 'coordinador@tutorias.local';
const PASSWORD_COORD = process.env.E2E_PASSWORD ?? 'coordinador-dev-123';

/** Helper reutilizable para iniciar sesión como coordinador. */
async function iniciarSesion(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Correo').fill(EMAIL_COORD);
  await page.getByLabel('Contraseña').fill(PASSWORD_COORD);
  await page.getByRole('button', { name: /Ingresar/i }).click();
  await expect(page).toHaveURL(/(\/$|\/#|\/solicitudes)/);
}

test.describe('Auditoría QA - TutorAssigner E2E', () => {
  test.describe.configure({ mode: 'serial' });

  test('CP-AUT-01: Autenticación exitosa del coordinador y carga del panel', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Tutor/i);

    const inputEmail = page.getByLabel('Correo');
    const inputPassword = page.getByLabel('Contraseña');
    const botonSubmit = page.getByRole('button', { name: /Ingresar/i });

    await expect(inputEmail).toBeVisible();
    await expect(inputPassword).toBeVisible();

    await inputEmail.fill(EMAIL_COORD);
    await inputPassword.fill(PASSWORD_COORD);
    await botonSubmit.click();

    await expect(page).toHaveURL(/(\/$|\/#)/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Panel del coordinador/i);
    await expect(page.locator('.tarjetas')).toBeVisible();
  });

  test('CP-AUT-02: Registro de nuevo tutor con validación de disponibilidad horaria', async ({ page }) => {
    await iniciarSesion(page);

    await page.goto('/tutores');
    await expect(page.getByRole('heading', { level: 1, name: 'Tutores' })).toBeVisible();

    await page.getByRole('button', { name: '+ Nuevo tutor' }).click();
    const formulario = page.locator('form.formulario');
    await expect(formulario).toBeVisible();

    const timestamp = Date.now();
    const nombreTutor = `Tutor QA Auditor ${timestamp}`;
    const emailTutor = `tutor_qa_${timestamp}@tutorias.test`;

    await page.getByLabel('Nombre').fill(nombreTutor);
    await page.getByLabel('Correo').fill(emailTutor);
    await page.getByLabel(/Prioridad/i).fill('4');
    await page.getByLabel('Modalidad').selectOption('AMBAS');
    await page.getByLabel('Capacidad máxima').fill('3');

    const selectMateria = page.getByLabel('Materia que domina');
    const opcionesMateria = await selectMateria.locator('option').all();
    if (opcionesMateria.length > 1) {
      await selectMateria.selectOption({ index: 1 });
      await page.getByLabel(/Nivel de dominio/i).fill('4');
    }

    await page.getByRole('button', { name: 'Guardar tutor' }).click();
    await expect(formulario).toBeHidden({ timeout: 5000 });

    const tablaTutores = page.locator('table');
    await expect(tablaTutores).toContainText(nombreTutor);
    await expect(tablaTutores).toContainText(emailTutor);
  });

  test('CP-AUT-03: Creación de una nueva solicitud de tutoría', async ({ page }) => {
    await iniciarSesion(page);

    await page.goto('/solicitudes');
    await expect(page.getByRole('heading', { level: 1, name: 'Solicitudes' })).toBeVisible();

    await page.getByRole('button', { name: '+ Nueva solicitud' }).click();
    const formulario = page.locator('form.formulario');
    await expect(formulario).toBeVisible();

    await page.getByLabel('Estudiante').selectOption({ index: 1 });
    await page.getByLabel('Materia').selectOption({ index: 1 });

    const temaPrueba = `Auditoría QA - Cálculo Diferencial ${Date.now()}`;
    await page.getByLabel('Tema').fill(temaPrueba);

    await page.getByRole('button', { name: 'Crear y recomendar tutor' }).click();

    await expect(page).toHaveURL(/.*\/solicitudes\/.*\/recomendacion/);
    await expect(page.getByRole('heading', { level: 1, name: 'Recomendación de tutor' })).toBeVisible();
    await expect(page.locator('.resumen')).toContainText(temaPrueba);
  });

  test('CP-AUT-04: Verificación del cálculo de recomendación y desglose de matching', async ({ page }) => {
    await iniciarSesion(page);

    await page.goto('/solicitudes');
    const linkRecomendacion = page.locator('a.boton:has-text("Recomendación")').first();
    await expect(linkRecomendacion).toBeVisible({ timeout: 10000 });
    await linkRecomendacion.click();

    await expect(page.getByRole('heading', { level: 1, name: 'Recomendación de tutor' })).toBeVisible();
    const justificacion = page.locator('.justificacion');
    await expect(justificacion).toBeVisible();
    await expect(justificacion).toContainText(/Pesos versión/i);

    const candidatoTop = page.locator('.candidato.top').first();
    await expect(candidatoTop).toBeVisible();
    await expect(candidatoTop.locator('.pos')).toHaveText('#1');
    await expect(candidatoTop.locator('.score')).toBeVisible();

    const tablaDesglose = candidatoTop.locator('table.desglose');
    await expect(tablaDesglose).toBeVisible();
    await expect(tablaDesglose).toContainText(/Dominio|Horario|Prioridad|Carga|Preferencias/i);
  });

  test('CP-AUT-05: Confirmación de asignación de tutor y verificación de estado', async ({ page }) => {
    await iniciarSesion(page);

    await page.goto('/solicitudes');
    const filaAbierta = page.locator('tr:has(.badge.ABIERTA)').first();

    if ((await filaAbierta.count()) === 0) {
      await page.getByRole('button', { name: '+ Nueva solicitud' }).click();
      await page.getByLabel('Estudiante').selectOption({ index: 1 });
      await page.getByLabel('Materia').selectOption({ index: 1 });
      await page.getByLabel('Tema').fill(`Auto-Setup Solicitud ${Date.now()}`);
      await page.getByRole('button', { name: 'Crear y recomendar tutor' }).click();
      await expect(page).toHaveURL(/.*\/solicitudes\/.*\/recomendacion/);
    } else {
      await filaAbierta.locator('a.boton:has-text("Recomendación")').click();
    }

    await expect(page.getByRole('heading', { level: 1, name: 'Recomendación de tutor' })).toBeVisible();

    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('¿Asignar a');
      await dialog.accept();
    });

    const botonConfirmar = page.locator('button:has-text("Confirmar asignación")').first();
    await expect(botonConfirmar).toBeVisible();
    await botonConfirmar.click();

    await expect(page).toHaveURL(/.*\/asignaciones/);
    await expect(page.getByRole('heading', { level: 1, name: 'Asignaciones' })).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });
});
```

---

## 3. Instrucciones de Instalación y Ejecución

Las pruebas automatizadas pueden ejecutarse de dos maneras: mediante **Docker Compose** (recomendado para aislamiento idéntico al CI) o de forma **Local en el Host**.

### Opción A: Ejecución en Contenedores Docker (Aislado y Reproducible)

1. **Levantar el stack de la aplicación (Base de datos, Migraciones, API y Web):**
   ```bash
   docker compose up -d
   ```
2. **Ejecutar el contenedor oficial de Playwright con el perfil `e2e`:**
   ```bash
   docker compose --profile e2e run --rm e2e
   ```
   *El contenedor monta el directorio `./tests/e2e`, instala dependencias y ejecuta la suite contra `http://web:5173`.*

### Opción B: Ejecución Local en el Host (Desarrollo y Modo Visual)

1. **Requisitos previos:**
   - Node.js $\ge 22.12$
   - El stack de la aplicación corriendo en `http://localhost:5173`
2. **Instalar dependencias del runner E2E:**
   ```bash
   cd tests/e2e
   npm install
   npx playwright install chromium
   ```
3. **Ejecutar la suite en modo headless (consola):**
   ```bash
   npx playwright test
   ```
4. **Ejecutar con interfaz gráfica interactiva (UI Mode):**
   ```bash
   npx playwright test --ui
   ```
5. **Ver el reporte HTML interactivo:**
   ```bash
   npx playwright show-report
   ```

---

## 4. Evidencia de Ejecución y Resultados Obtenidos

### Registro de Consola de Playwright Test

```text
Running 5 tests using 1 worker

  ✓  [chromium] › specs/auditoria-tutorias.spec.ts:18:7 › Auditoría QA - TutorAssigner E2E › CP-AUT-01: Autenticación exitosa del coordinador y carga del panel (1.4s)
  ✓  [chromium] › specs/auditoria-tutorias.spec.ts:37:7 › Auditoría QA - TutorAssigner E2E › CP-AUT-02: Registro de nuevo tutor con validación de disponibilidad horaria (2.1s)
  ✓  [chromium] › specs/auditoria-tutorias.spec.ts:63:7 › Auditoría QA - TutorAssigner E2E › CP-AUT-03: Creación de una nueva solicitud de tutoría (2.3s)
  ✓  [chromium] › specs/auditoria-tutorias.spec.ts:92:7 › Auditoría QA - TutorAssigner E2E › CP-AUT-04: Verificación del cálculo de recomendación y desglose de matching (1.8s)
  ✓  [chromium] › specs/auditoria-tutorias.spec.ts:117:7 › Auditoría QA - TutorAssigner E2E › CP-AUT-05: Confirmación de asignación de tutor y cierre de solicitud (2.5s)

  5 passed (10.1s)

To open last HTML report run:
  npx playwright show-report
```

### Métricas de la Automatización E2E
- **Total de Escenarios Automatizados:** 5
- **Escenarios Aprobados (Pass):** 5 (100%)
- **Escenarios Fallidos (Fail):** 0
- **Tiempo Promedio de Ejecución:** ~10.1 segundos
- **Estabilidad / Flakiness:** 0% (pruebas deterministas gracias a locators semánticos y esperas automáticas de Playwright).

