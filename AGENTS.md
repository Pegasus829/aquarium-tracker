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

The app shows a client-side password gate UI, but password verification is server-side:
- login call: `POST /auth/login` on `API_BASE_URL`
- JWT is stored in `sessionStorage` (`wqt_token`) and sent as `Authorization: Bearer ...`
- protected API calls include `x-api-key` from `API_KEY` in `index.html`

### Architecture

- **Frontend:** no build step; UI logic lives in a single `index.html`.
- **Data flow:** frontend loads and mutates readings via backend endpoints (`/readings`, `/tap`) using `fetch`.
- `readings` and `tapReadings` arrays are runtime client caches, hydrated from the API.
- **Backend code/artifacts:** `lambda/index.mjs`, `lambda/package.json`, and `deploy/*.json`.
- No automated tests or linting infrastructure exist in this repo.

### Roadmap

- Track features and enhancements in **`ROADMAP.md`** (IDs like `AT-017`).
- Assign each item one **Category**: Security, Accessibility, New Feature, Enhancement, Commercial, or Defect.
- When implementing something that matches a roadmap item, ask whether to mark it **delivered**.
- After substantive agent sessions, add any new follow-up ideas to the backlog with the next free ID and category.

### Key notes

- Frontend changes are primarily made by editing `index.html`.
- The app is no longer backend-free; it depends on the configured AWS API backend at runtime.
- If `API_BASE_URL` is missing/unreachable, data/auth operations fail and the app shows error toasts/gate state.
- The static site is deployed to GitHub Pages via the `CNAME` file (`aquarium.vibeai.software`).
