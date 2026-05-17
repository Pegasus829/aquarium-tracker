# Aquarium Tracker — Product Roadmap

Living backlog for features and enhancements. **Reference items by ID** (e.g. “implement AT-017”) in issues, PRs, and agent chats.

**Last reviewed:** 2026-05-17

**Interactive view:** [assets/roadmap.html](assets/roadmap.html) — filter pills (category, status, priority), search, and **Add to Next** (★) for backlog items. In supporting browsers, the page writes Next selections back to this file after you select `ROADMAP.md`. Open via `python3 -m http.server 8000` → http://localhost:8000/assets/roadmap.html

---

## How to use this file

### For humans

- Add ideas under [Backlog](#backlog) with the next free `AT-###` ID and a **Category** (see [Category legend](#category-legend)).
- Move rows to [Delivered](#delivered) when shipped (keep the same ID and category).
- Use **Status** values consistently (see [Status legend](#status-legend)).
- Use **[assets/roadmap.html](assets/roadmap.html)** to filter and queue work: click filter pills (neutral → include → exclude); when the page loads `ROADMAP.md` over HTTP, **Delivered vs Backlog** matches the markdown (fix online drift vs the embedded snapshot). Use **★** for **Next**, **✓** on a backlog row to **mark delivered**, and Save / download fallbacks (`localStorage` still backs up Next selections).
- Filter or sort by category in your editor, or search for e.g. `| Security |` in this file.

### For Cursor agents (including this repo)

1. **Capture new ideas** — When the user or a session implies work, add a backlog row with the next `AT-###` ID, a short title, a **Category**, and **Source** (e.g. `user`, `agent:<topic>`, `security-review`).
2. **Choose category** — Pick the **single best-fit** category per item (see [Category legend](#category-legend)). If unsure, ask the user or default to `Enhancement` for polish on existing behaviour and `New Feature` for net-new capability.
3. **Mine other agent work** — After substantive sessions on this repo, scan transcripts/PRs/commits for follow-ups; add them with **Source** and the appropriate category.
4. **Sync HTML** — When adding or changing items, update **`assets/roadmap.html`** (`ROADMAP_ITEMS` array) as well as this file.
5. **On delivery** — When you implement capability that clearly matches a roadmap ID, **ask the user**: *“Should we mark AT-### as delivered?”* Only move the item after they confirm (or they say to mark it delivered in the same request).
6. **Do not renumber** — IDs are permanent; never reuse a retired ID.

### ID format

| Pattern | Meaning |
|--------|---------|
| `AT-001` … `AT-999` | Product / engineering items (backlog or delivered) |

---

## Category legend

Every item has exactly one category. Use these labels in the **Category** column.

| Category | Use when |
|----------|----------|
| **Security** | Auth, secrets, XSS/CSRF, IAM, encryption, abuse prevention, compliance |
| **Accessibility** | WCAG, screen readers, keyboard nav, contrast, focus, ARIA, reduced motion |
| **New Feature** | New user-visible capability or major new domain (e.g. new parameter, multi-tank) |
| **Enhancement** | Improves something that already exists (UX polish, performance, dev tooling, docs) |
| **Commercial** | Monetization: ads, subscriptions, billing, tiers, public launch gating |
| **Defect** | Bug fix: broken behaviour, regressions, incorrect data or rendering |

---

## Status legend

| Status | Meaning |
|--------|---------|
| `idea` | Captured, not committed to build |
| `planned` | Agreed worth doing, not started |
| `in_progress` | Active development |
| `delivered` | Shipped to production (or merged on `main` and deployed) |
| `deferred` | Valid but intentionally postponed |
| `wont_fix` | Rejected; keep row for history |

---

## Delivered

| ID | Category | Title | Delivered | Source / notes |
|----|----------|-------|-----------|----------------|
| AT-001 | Security | Server-side JWT login (`POST /auth/login`) | 2026 (auth session) | Replaced client-only password gate; see `AGENTS.md` |
| AT-002 | New Feature | KH (carbonate) input, chart, safe zones, log column | 2026-05 (`ef3a8a3`) | Ordered with other tank metrics after reorder |
| AT-003 | New Feature | Profile editor with configurable chart safe zones | 2026 (`7ae384e`) | Profile API + UI |
| AT-004 | Enhancement | Profile avatar (emoji + image upload) | 2026 (`fd8dea1`, PR #33) | |
| AT-005 | Enhancement | Persist profile/settings via AWS profile API | 2026 (`f2e8e77`) | |
| AT-006 | Enhancement | GitHub Actions deploy to AWS (OIDC) | 2026 (`0d28449`) | `deploy-aws.yml` |
| AT-007 | Enhancement | Tank readings: edit, delete confirm, PUT/DELETE API | 2026-05 (`1f337f4`) | |
| AT-008 | Enhancement | Tap readings: edit, delete, PUT/DELETE API | 2026-05 | Modals + `/tap/{id}` routes |
| AT-009 | Security | Escape tap `note` in log (XSS hardening) | 2026 (auth session) | `escapeHtml()` in `renderTapLog` |
| AT-010 | Enhancement | Load tank readings independently of profile | 2026 (`0794eb7`, `a61df5a`) | Faster perceived load |
| AT-011 | Enhancement | App icons, manifest, theme color | 2026 (PR #36) | `/assets/` |
| AT-012 | Enhancement | Dynamic copyright footer | 2026 (PR #38) | |
| AT-013 | Accessibility | Password manager autofill on login | 2026 (PR #37) | |
| AT-014 | Defect | Fix render when legacy readings lack `kh` | 2026-05 (`99dda5f`) | Post–KH rollout |
| AT-015 | Defect | API Gateway CORS JSON for OPTIONS routes | 2026-05 (`1e79788`) | Deploy script fix |
| AT-016 | Enhancement | Roadmap tracking file + agent workflow | 2026-05-17 | This document |
| AT-019 | Security | Content-Security-Policy (and related security headers) | 2026-05-17 | Meta CSP + Lambda security headers; see `SECURITY.md` |
| AT-021 | Security | Reduce exposure of static `API_KEY` in `index.html` | 2026 (Cognito rollout) | `AUTHENTICATION.md`; JWT-only browser requests; `deploy/disable-api-key-requirement.sh` clears stage `apiKeyRequired` |
| AT-028 | Enhancement | Remove duplicate stray files (`index 2.html`, `lambda/index 2.mjs`, etc.) | 2026-05-17 | Added `.gitignore` guard for local duplicate copy artifacts |
| AT-027 | Security | Local dev secrets (`.env` / build inject) instead of committed `API_KEY` | 2026-05-17 | `config.js` + `.env` → `config.local.js`; `scripts/generate-local-config.mjs` |

---

## Backlog

Use the `Next` column to queue near-term work (`next` vs blank); **Add to Next** (★) in [assets/roadmap.html](assets/roadmap.html) edits that column once `ROADMAP.md` loads (with local save / download fallback). You can move rows to Delivered manually from the roadmap page (**✓** on backlog rows) or by editing this file—keep `assets/roadmap.html` `ROADMAP_ITEMS` aligned when you ship so static hosting stays coherent until AT-031 is done.

| Next | ID | Category | Title | Status | Priority | Source | Notes |
|------|----|----------|-------|--------|----------|--------|-------|
|  | AT-017 | Enhancement | Playwright E2E smoke tests (login, add reading, chart render) | idea | medium | `AGENTS.md` gap; `node_modules/playwright` present | No `playwright.config` or CI job yet |
|  | AT-018 | Enhancement | Lint/format tooling for `index.html` + `lambda/` | idea | low | `AGENTS.md` | Single-file frontend; consider HTML/JS checks only |
|  | AT-020 | Enhancement | API Gateway gateway responses: CORS on 5xx/integration failures | idea | low | Auth/deploy session ([391aaea1](391aaea1-337f-4d97-bdd6-f6b88ba882c0)) | Reduces misleading browser “CORS” errors when Lambda fails |
|  | AT-022 | New Feature | Export readings (CSV or JSON download) | idea | medium | Security review (export mentioned) | No `downloadFile` in current `index.html` |
|  | AT-023 | Enhancement | Chart date-range filter / zoom | idea | low | UX | Long histories get crowded |
|  | AT-024 | New Feature | Out-of-range alerts (email/push or on-open banner) | idea | low | user | Would need notification channel + thresholds |
|  | AT-025 | New Feature | Additional parameters (e.g. temperature, GH, Ca, Mg) | idea | low | user | Follow KH pattern; profile safe zones + API validation |
|  | AT-026 | New Feature | Multi-tank / multiple aquarium profiles | idea | low | user | Data model + partition key design |
|  | AT-029 | Enhancement | Backfill UI for missing KH on historical readings | idea | low | KH session ([aff87b27](aff87b27-a3af-4666-855c-02edcc319a66)) | Optional bulk edit or per-row prompt |
|  | AT-030 | Security | Rate-limit / abuse monitoring dashboard or alarms | idea | low | Security review | Usage plan exists; observability not in repo |
|  | AT-031 | Enhancement | Generate interactive roadmap data from `ROADMAP.md` | idea | low | agent:roadmap-next-sync | Avoid maintaining duplicate `ROADMAP_ITEMS` data by hand |
|  | AT-032 | Security | Roadmap permissions with read/write access controls | idea | medium | user | Default no roadmap access; `marc@amphletts.uk` has write access |
|  | AT-033 | Security | Remove inline code so CSP can drop `unsafe-inline` | idea | medium | agent:at-019 | Externalize handlers, styles, and app script or add repeatable nonce/hash generation |

### Commercial (placeholder)

No backlog items yet. When planning a public launch, add items here (e.g. subscription tier, ad placement, usage limits for free tier).

| ID | Category | Title | Status | Priority | Source | Notes |
|----|----------|-------|--------|----------|--------|-------|
| — | Commercial | *(none yet)* | — | — | — | |

---

## Deferred / won’t fix

| ID | Category | Title | Status | Notes |
|----|----------|-------|--------|-------|
| — | — | *(none yet)* | — | |

---

## Changelog (roadmap meta)

| Date | Change |
|------|--------|
| 2026-05-17 | Initial roadmap: IDs AT-001–AT-030, delivered items from git + agent transcripts |
| 2026-05-17 | Added Category column and legend (Security, Accessibility, New Feature, Enhancement, Commercial, Defect) |
| 2026-05-17 | Interactive [assets/roadmap.html](assets/roadmap.html) with filter pills and Add to Next |
| 2026-05-17 | Added markdown-backed `Next` column and local-file save support in [assets/roadmap.html](assets/roadmap.html) |
| 2026-05-17 | Added AT-032 roadmap permissions item |
| 2026-05-17 | Marked AT-021 delivered (API key removed from frontend; JWT-only requests); reconciled backlog table with Delivered section |
| 2026-05-17 | Roadmap page hydrates Delivered/Backlog from `ROADMAP.md` and adds ✓ manual “mark delivered” (updates markdown on save/download) |
| 2026-05-17 | Delivered AT-027: `.env` / `config.local.js` local overrides; `config.js` for production defaults |
