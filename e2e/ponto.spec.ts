import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await expect(page).toHaveTitle(/PontoGO/);
});

test('can register a point offline', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  // Simula offline
  await page.route('**/rest/v1/registros*', (route) => route.abort('failed'));
  
  // Interage com o app (ajuste os seletores conforme sua UI real)
  await page.getByRole('button', { name: /Entrada/i }).click();
  
  // Verifica se o indicador de pendência aparece (App Badge)
  await expect(page.locator('.offline-indicator')).toBeVisible();
});
