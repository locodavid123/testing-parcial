import { defineConfig, devices } from '@playwright/test';

// Infra E2E - Configuración para Auditoría QA con grabación de evidencias
export default defineConfig({
  testDir: './specs',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    // Graba trazas completas para inspección interactiva
    trace: 'on',
    // Captura de pantalla automática al finalizar cada test
    screenshot: 'on',
    // Grabación de video de la pantalla del navegador para evidencias
    video: 'on',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
