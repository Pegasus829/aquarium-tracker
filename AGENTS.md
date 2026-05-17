## Cursor Cloud specific instructions

This repo contains a Water Quality Tracker with:
- a static frontend (`index.html`, embedded CSS/JS)
- a serverless backend (`lambda/`) and IAM/deploy policy artifacts (`deploy/`)

### Running the app

Serve with any static HTTP server from the repo root:

```
python3 -m http.server 8000
```

Then open http://localhost:8000/ in a browser.
Use HTTP (not `file://`) so browser APIs and API requests work correctly.

### Local configuration (AT-027)

Frontend API/Cognito settings live in `config.js` (committed public defaults) and optional `config.local.js` (gitignored, generated from `.env`):

```bash
cp .env.example .env
# edit .env as needed
node scripts/generate-local-config.mjs
```

On `localhost`, `index.html` loads `config.local.js` when present. Production GitHub Pages uses `config.js` only; Cognito client settings can still be discovered via `GET /auth/config` when left blank.

Legacy `deploy/api-url-and-key.txt` is still read by the generator when `.env` omits values, but API keys are not injected into the browser (JWT-only requests).

### Authentication

The app is being migrated to Cognito:
- when `COGNITO_DOMAIN` and `COGNITO_CLIENT_ID` are set in `config.js` / `config.local.js`, the frontend uses Cognito Hosted UI with authorization-code + PKCE
- if those constants are blank, the frontend attempts to discover Cognito settings from public `GET /auth/config`
- until those values are configured, the legacy password gate remains available via `POST /auth/login`
- JWTs are stored in `sessionStorage` (`wqt_token`) and sent as `Authorization: Bearer ...`
- protected API calls do not include browser API keys; use `deploy/disable-api-key-requirement.sh` to clear API Gateway `apiKeyRequired` (also configures gateway-response CORS via `configure-gateway-cors-responses.sh`)
- API Gateway **gateway responses** (5xx, integration/authorizer failures): `deploy/configure-gateway-cors-responses.sh` (invoked by disable-api-key, profile deploy, Cognito setup, and CI)
- Cognito setup and migration assets live in `deploy/cognito-auth-template.yaml`, `deploy/setup-cognito-auth.sh`, and `AUTHENTICATION.md`

### Architecture

- **Frontend:** no build step; markup in `index.html`, styles in `assets/app.css`, app logic in `assets/app.js` (plus `config.js` / optional `config.local.js`).
- **Data flow:** frontend loads and mutates readings via backend endpoints (`/readings`, `/tap`) using `fetch`.
- `readings` and `tapReadings` arrays are runtime client caches, hydrated from the API.
- **Backend code/artifacts:** `lambda/index.mjs`, `lambda/package.json`, and `deploy/*`.
- **Lint/format (AT-018):** from the repo root, `npm ci` then `npm run lint` (ESLint for `assets/*.js`, `config.js`, `lambda/*.mjs`, `scripts/`; html-validate for `index.html` and `assets/roadmap.html`), `npm run format` / `format:check` (Prettier). CI: `.github/workflows/lint.yml`.
- **E2E smoke (AT-017):** `npm ci`, `npx playwright install chromium`, then `WQT_E2E_PASSWORD=… npm run test:e2e`. Playwright serves the static app on port 8000 and hits the configured API (`config.js` / `WQT_API_BASE_URL`). Tests skip when the password is unset or the API uses Cognito-only auth. CI: `.github/workflows/e2e.yml` (requires repo secret `WQT_E2E_PASSWORD`).

### Roadmap

- Track features and enhancements in **`ROADMAP.md`** (IDs like `AT-017`); keep **`assets/roadmap.html`** in sync for the interactive view.
- Assign each item one **Category**: Security, Accessibility, New Feature, Enhancement, Commercial, or Defect.
- When implementing something that matches a roadmap item, ask whether to mark it **delivered**.
- After substantive agent sessions, add any new follow-up ideas to the backlog with the next free ID and category.

### Key notes

- Frontend changes are primarily made by editing `index.html`.
- The app is no longer backend-free; it depends on the configured AWS API backend at runtime.
- If `API_BASE_URL` is missing/unreachable, data/auth operations fail and the app shows error toasts/gate state.
- The static site is deployed to GitHub Pages via the `CNAME` file (`aquarium.vibeai.software`).
