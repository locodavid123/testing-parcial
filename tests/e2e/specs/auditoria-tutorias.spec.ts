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

// Credenciales del coordinador
const EMAIL_COORD = process.env.E2E_EMAIL ?? 'coordinador@tutorias.local';
const PASSWORD_COORD = process.env.E2E_PASSWORD ?? 'coordinador-dev-123';

/**
 * Helper reutilizable para iniciar sesión como coordinador.
 */
async function iniciarSesion(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Correo').fill(EMAIL_COORD);
  await page.getByLabel('Contraseña').fill(PASSWORD_COORD);
  await page.getByRole('button', { name: /Ingresar/i }).click();
  await expect(page).toHaveURL(/(\/$|\/#|\/solicitudes)/);
}

test.describe('Auditoría QA - TutorAssigner E2E', () => {
  // Ejecución serial para garantizar coherencia en datos compartidos
  test.describe.configure({ mode: 'serial' });

  test('CP-AUT-01: Autenticación exitosa del coordinador y carga del panel', async ({ page }) => {
    // 1. Navegar a la pantalla de login
    await page.goto('/login');
    await expect(page).toHaveTitle(/Tutor/i);

    // 2. Localizar campos mediante etiquetas semánticas accesibles
    const inputEmail = page.getByLabel('Correo');
    const inputPassword = page.getByLabel('Contraseña');
    const botonSubmit = page.getByRole('button', { name: /Ingresar/i });

    await expect(inputEmail).toBeVisible();
    await expect(inputPassword).toBeVisible();

    // 3. Diligenciar credenciales válidas y enviar formulario
    await inputEmail.fill(EMAIL_COORD);
    await inputPassword.fill(PASSWORD_COORD);
    await botonSubmit.click();

    // 4. Verificar redirección y carga del panel de control
    await expect(page).toHaveURL(/(\/$|\/#)/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Panel del coordinador/i);
    await expect(page.locator('.tarjetas')).toBeVisible();
  });

  test('CP-AUT-02: Registro de nuevo tutor con validación de disponibilidad horaria', async ({ page }) => {
    // 1. Iniciar sesión
    await iniciarSesion(page);

    // 2. Navegar al catálogo de tutores
    await page.goto('/tutores');
    await expect(page.getByRole('heading', { level: 1, name: 'Tutores' })).toBeVisible();

    // 3. Abrir el formulario de alta
    const botonNuevo = page.getByRole('button', { name: '+ Nuevo tutor' });
    await botonNuevo.click();

    const formulario = page.locator('form.formulario');
    await expect(formulario).toBeVisible();

    // 4. Diligenciar datos utilizando selectores semánticos basados en etiquetas (labels)
    const timestamp = Date.now();
    const nombreTutor = `Tutor QA Auditor ${timestamp}`;
    const emailTutor = `tutor_qa_${timestamp}@tutorias.test`;

    await page.getByLabel('Nombre').fill(nombreTutor);
    await page.getByLabel('Correo').fill(emailTutor);
    await page.getByLabel(/Prioridad/i).fill('4');
    await page.getByLabel('Modalidad').selectOption('AMBAS');
    await page.getByLabel('Capacidad máxima').fill('3');

    // Seleccionar primera materia disponible si existe en el catálogo
    const selectMateria = page.getByLabel('Materia que domina');
    const opcionesMateria = await selectMateria.locator('option').all();
    if (opcionesMateria.length > 1) {
      await selectMateria.selectOption({ index: 1 });
      await page.getByLabel(/Nivel de dominio/i).fill('4');
    }

    // 5. Guardar tutor y esperar que el formulario se cierre y se actualice la tabla
    const botonGuardar = page.getByRole('button', { name: 'Guardar tutor' });
    await botonGuardar.click();

    await expect(formulario).toBeHidden({ timeout: 5000 });

    // 6. Verificar persistencia y visualización en la tabla de tutores
    const tablaTutores = page.locator('table');
    await expect(tablaTutores).toContainText(nombreTutor);
    await expect(tablaTutores).toContainText(emailTutor);
  });

  test('CP-AUT-03: Creación de una nueva solicitud de tutoría', async ({ page }) => {
    // 1. Iniciar sesión
    await iniciarSesion(page);

    // 2. Navegar a Solicitudes
    await page.goto('/solicitudes');
    await expect(page.getByRole('heading', { level: 1, name: 'Solicitudes' })).toBeVisible();

    // 3. Abrir formulario de solicitud
    await page.getByRole('button', { name: '+ Nueva solicitud' }).click();
    const formulario = page.locator('form.formulario');
    await expect(formulario).toBeVisible();

    // 4. Seleccionar estudiante y materia de los selectores disponibles
    const selectEstudiante = page.getByLabel('Estudiante');
    const selectMateria = page.getByLabel('Materia');

    await selectEstudiante.selectOption({ index: 1 });
    await selectMateria.selectOption({ index: 1 });

    const temaPrueba = `Auditoría QA - Cálculo Diferencial ${Date.now()}`;
    await page.getByLabel('Tema').fill(temaPrueba);

    // 5. Enviar formulario (crea solicitud y navega automáticamente a la recomendación)
    await page.getByRole('button', { name: 'Crear y recomendar tutor' }).click();

    // 6. Validar redirección automática hacia la pantalla de recomendación
    await expect(page).toHaveURL(/.*\/solicitudes\/.*\/recomendacion/);
    await expect(page.getByRole('heading', { level: 1, name: 'Recomendación de tutor' })).toBeVisible();
    await expect(page.locator('.resumen')).toContainText(temaPrueba);
  });

  test('CP-AUT-04: Verificación del cálculo de recomendación y desglose de matching', async ({ page }) => {
    // 1. Iniciar sesión
    await iniciarSesion(page);

    // 2. Navegar a Solicitudes
    await page.goto('/solicitudes');
    const linkRecomendacion = page.locator('a.boton:has-text("Recomendación")').first();
    await expect(linkRecomendacion).toBeVisible({ timeout: 10000 });
    await linkRecomendacion.click();

    // 3. Validar encabezado y tarjeta de justificación explicativa
    await expect(page.getByRole('heading', { level: 1, name: 'Recomendación de tutor' })).toBeVisible();
    const justificacion = page.locator('.justificacion');
    await expect(justificacion).toBeVisible();
    await expect(justificacion).toContainText(/Pesos versión/i);

    // 4. Verificar candidato recomendado en primera posición (#1)
    const candidatoTop = page.locator('.candidato.top').first();
    await expect(candidatoTop).toBeVisible();
    await expect(candidatoTop.locator('.pos')).toHaveText('#1');
    await expect(candidatoTop.locator('.score')).toBeVisible();

    // 5. Validar tabla de desglose multicriterio (Dominio, Horario, Prioridad, etc.)
    const tablaDesglose = candidatoTop.locator('table.desglose');
    await expect(tablaDesglose).toBeVisible();
    await expect(tablaDesglose).toContainText(/Dominio|Horario|Prioridad|Carga|Preferencias/i);
  });

  test('CP-AUT-05: Confirmación de asignación de tutor y verificación de estado', async ({ page }) => {
    // 1. Iniciar sesión
    await iniciarSesion(page);

    // 2. Ir a solicitudes y buscar una abierta
    await page.goto('/solicitudes');
    const filaAbierta = page.locator('tr:has(.badge.ABIERTA)').first();

    // Si no hubiera abierta en la tabla, creamos una para garantizar la ejecución
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

    // 3. Configurar interceptor del diálogo nativo del navegador (window.confirm)
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('¿Asignar a');
      await dialog.accept();
    });

    // 4. Ejecutar confirmación de la asignación
    const botonConfirmar = page.locator('button:has-text("Confirmar asignación")').first();
    await expect(botonConfirmar).toBeVisible();
    await botonConfirmar.click();

    // 5. Verificar redirección automática al módulo de asignaciones y listado de la tabla
    await expect(page).toHaveURL(/.*\/asignaciones/);
    await expect(page.getByRole('heading', { level: 1, name: 'Asignaciones' })).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });
});
