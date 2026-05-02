## Cursor Cloud specific instructions

This is a zero-dependency static web application (single `index.html` file) — a Water Quality Tracker for aquarium monitoring.

### Running the app

Serve with any static HTTP server from the repo root:

```
python3 -m http.server 8000
```

Then open http://localhost:8000/ in a browser. The Web Crypto API (used for password hashing) requires an HTTP origin (not `file://`), so always use a local server.

### Authentication

The app has a client-side password gate. Default password: `aquarium2025`

### Architecture

- **No build step, no package manager, no dependencies.** The entire app is a single `index.html` with embedded CSS and JS.
- Data is stored in-memory as JS arrays embedded in the HTML. The "Save" feature downloads an updated copy of the HTML file with current data.
- No automated tests or linting infrastructure exist in this repo.

### Key notes

- There is no backend — all logic is client-side vanilla JavaScript.
- Changes to the app are made by editing `index.html` directly.
- The site is deployed to GitHub Pages via the `CNAME` file (`aquarium.vibeai.software`).
