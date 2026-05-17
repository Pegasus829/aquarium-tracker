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

### Authentication

The app is being migrated to Cognito:
- when `COGNITO_DOMAIN` and `COGNITO_CLIENT_ID` are set in `index.html`, the frontend uses Cognito Hosted UI with authorization-code + PKCE
- if those constants are blank, the frontend attempts to discover Cognito settings from public `GET /auth/config`
- until those values are configured, the legacy password gate remains available via `POST /auth/login`
- JWTs are stored in `sessionStorage` (`wqt_token`) and sent as `Authorization: Bearer ...`
- protected API calls currently include `x-api-key` from `API_KEY` in `index.html`
- Cognito setup and migration assets live in `deploy/cognito-auth-template.yaml`, `deploy/setup-cognito-auth.sh`, and `AUTHENTICATION.md`

### Architecture

- **Frontend:** no build step; UI logic lives in a single `index.html`.
- **Data flow:** frontend loads and mutates readings via backend endpoints (`/readings`, `/tap`) using `fetch`.
- `readings` and `tapReadings` arrays are runtime client caches, hydrated from the API.
- **Backend code/artifacts:** `lambda/index.mjs`, `lambda/package.json`, and `deploy/*`.
- No automated tests or linting infrastructure exist in this repo.

### Key notes

- Frontend changes are primarily made by editing `index.html`.
- The app is no longer backend-free; it depends on the configured AWS API backend at runtime.
- If `API_BASE_URL` is missing/unreachable, data/auth operations fail and the app shows error toasts/gate state.
- The static site is deployed to GitHub Pages via the `CNAME` file (`aquarium.vibeai.software`).
