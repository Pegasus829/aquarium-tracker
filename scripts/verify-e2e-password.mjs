#!/usr/bin/env node
/**
 * Quick check that WQT_E2E_PASSWORD matches legacy gate login.
 * Usage: WQT_E2E_PASSWORD='…' node scripts/verify-e2e-password.mjs
 */
const API_BASE_URL = (
  process.env.WQT_API_BASE_URL || 'https://gnewkvhgwd.execute-api.eu-west-1.amazonaws.com/prod'
).replace(/\/$/, '');
const password = process.env.WQT_E2E_PASSWORD || '';

if (!password) {
  console.error(
    'Set WQT_E2E_PASSWORD to the password you use on the Aquarium Tracker unlock screen.'
  );
  process.exit(1);
}

const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ password }),
});
const loginBody = await loginRes.json().catch(() => ({}));

if (loginRes.status === 410) {
  console.error('API is Cognito-only; legacy gate password login is disabled.');
  process.exit(1);
}

if (!loginRes.ok || !loginBody.token) {
  console.error(
    `Login failed (${loginRes.status}): ${loginBody.error || 'no token'} — this is not the correct gate password.`
  );
  process.exit(1);
}

console.log('OK: WQT_E2E_PASSWORD matches legacy gate login (JWT issued).');
console.log('Run the full smoke suite: WQT_E2E_PASSWORD=… npm run test:e2e');
