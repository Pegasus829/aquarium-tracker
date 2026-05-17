import { test, expect } from '@playwright/test';

const API_BASE_URL = (
  process.env.WQT_API_BASE_URL || 'https://gnewkvhgwd.execute-api.eu-west-1.amazonaws.com/prod'
).replace(/\/$/, '');

const E2E_PASSWORD = (process.env.WQT_E2E_PASSWORD || '').trim();
const E2E_ORIGIN = (process.env.WQT_E2E_ORIGIN || 'http://127.0.0.1:8000').replace(/\/$/, '');

async function fetchAuthMode(request) {
  const res = await request.get(`${API_BASE_URL}/auth/config`);
  if (!res.ok()) return null;
  const data = await res.json();
  return data.authMode || null;
}

async function loginForToken(request) {
  const res = await request.post(`${API_BASE_URL}/auth/login`, {
    headers: { 'Content-Type': 'application/json' },
    data: { password: E2E_PASSWORD },
  });
  if (!res.ok()) return null;
  const data = await res.json();
  return data.token || null;
}

async function deleteTankReading(request, token, id) {
  if (!id || !token) return;
  await request.delete(`${API_BASE_URL}/readings/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/** Lambda CORS allows production origin only; rewrite ACAO for local Playwright. */
async function installApiCorsProxy(page) {
  const apiHost = new URL(API_BASE_URL).host;
  await page.route(`**://${apiHost}/**`, async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({
        status: 200,
        headers: {
          'access-control-allow-origin': E2E_ORIGIN,
          'access-control-allow-headers': 'Content-Type,Authorization',
          'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
        },
        body: '',
      });
      return;
    }
    const response = await route.fetch();
    const headers = { ...response.headers(), 'access-control-allow-origin': E2E_ORIGIN };
    await route.fulfill({ response, headers });
  });
}

test.describe('smoke', () => {
  test.beforeAll(async ({ request }) => {
    test.skip(!E2E_PASSWORD, 'Set WQT_E2E_PASSWORD (see .env.example)');

    const authMode = await fetchAuthMode(request);
    test.skip(
      authMode === 'cognito',
      'API uses Cognito auth; smoke tests require legacy password login'
    );

    const token = await loginForToken(request);
    expect(
      token,
      'WQT_E2E_PASSWORD must be the Aquarium Tracker gate password (POST /auth/login)'
    ).toBeTruthy();
  });

  test('login, add tank reading, and render pH chart', async ({ page, request }) => {
    const token = await loginForToken(request);
    expect(token).toBeTruthy();

    const markerPh = 6.5 + (Date.now() % 4000) / 10_000;
    const markerPhLabel = markerPh.toFixed(1);
    let createdId = null;

    await installApiCorsProxy(page);
    await page.route('**/auth/config', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authMode: 'legacy',
          cognito: { domain: '', clientId: '', scopes: 'openid email profile' },
        }),
      })
    );

    await page.goto('/');

    await expect(page.locator('#gate')).toBeVisible();
    await expect(page.locator('#gateInput')).toBeVisible();

    const loginResponse = page.waitForResponse(
      (res) => res.url().includes('/auth/login') && res.request().method() === 'POST'
    );
    await page.locator('#gateInput').fill(E2E_PASSWORD);
    await page.getByRole('button', { name: 'Unlock' }).click();
    const loginRes = await loginResponse;
    expect(loginRes.ok(), 'Gate login should succeed with WQT_E2E_PASSWORD').toBeTruthy();

    await expect(page.locator('#app')).toHaveClass(/app-visible/);
    await expect(page.locator('#gate')).toHaveClass(/gate-hidden/);
    await expect(page.locator('#logBody')).not.toContainText('Loading readings', {
      timeout: 20_000,
    });

    await page.locator('#f-ph').fill(String(markerPh));
    await page.locator('#f-kh').fill('4');

    const saveResponse = page.waitForResponse(
      (res) =>
        res.url().includes('/readings') && res.request().method() === 'POST' && res.status() === 201
    );
    await page.getByRole('button', { name: 'Add Reading' }).click();
    const saved = await saveResponse;
    const savedBody = await saved.json();
    createdId = savedBody.id;

    await expect(page.locator('#toast')).toContainText('Reading added');
    await expect(page.locator('#logBody')).toContainText(markerPhLabel);
    await expect(page.locator('.chart-canvas-wrap:has(#chart-ph)')).toHaveClass(/chart-has-data/);

    const chartReady = await page.evaluate(() => {
      const canvas = document.getElementById('chart-ph');
      return Boolean(canvas && typeof Chart !== 'undefined' && Chart.getChart(canvas));
    });
    expect(chartReady).toBe(true);

    await deleteTankReading(request, token, createdId);
  });
});
