import { test, expect } from '@playwright/test';

const API_BASE_URL = (
  process.env.WQT_API_BASE_URL || 'https://gnewkvhgwd.execute-api.eu-west-1.amazonaws.com/prod'
).replace(/\/$/, '');

const E2E_PASSWORD = (process.env.WQT_E2E_PASSWORD || '').trim();

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

async function deleteReadingByPh(request, token, markerPh) {
  const res = await request.get(`${API_BASE_URL}/readings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) return;
  const readings = await res.json();
  if (!Array.isArray(readings)) return;
  const match = readings.find(
    (r) => typeof r.ph === 'number' && Math.abs(r.ph - markerPh) < 0.0001
  );
  await deleteTankReading(request, token, match?.id);
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
    await page.getByRole('button', { name: 'Add Reading' }).click();

    await expect(page.locator('#toast')).toContainText('Reading added', { timeout: 20_000 });
    await expect(page.locator('#logBody')).toContainText(markerPhLabel);
    await expect(page.locator('.chart-canvas-wrap:has(#chart-ph)')).toHaveClass(/chart-has-data/);

    const chartReady = await page.evaluate(() => {
      const canvas = document.getElementById('chart-ph');
      return Boolean(canvas && typeof Chart !== 'undefined' && Chart.getChart(canvas));
    });
    expect(chartReady).toBe(true);

    await deleteReadingByPh(request, token, markerPh);
  });
});
