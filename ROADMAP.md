# Aquarium Tracker — Product Roadmap

Living backlog for features and enhancements. **Reference items by ID** (e.g. “implement AT-015”) in issues, PRs, and agent chats.

**Last reviewed:** 2026-05-17

---

## How to use this file

### For humans

- Add ideas under [Backlog](#backlog) with the next free `AT-###` ID.
- Move rows to [Delivered](#delivered) when shipped (keep the same ID).
- Use **Status** values consistently (see [Status legend](#status-legend)).

### For Cursor agents (including this repo)

1. **Capture new ideas** — When the user or a session implies a feature, add a backlog row with the next `AT-###` ID, a short title, and **Source** (e.g. `user`, `agent:<topic>`, `security-review`).
2. **Mine other agent work** — After substantive sessions on this repo, scan transcripts/PRs/commits for follow-ups, “optional”, “polish”, or “later” items not yet listed here; add them with **Source** noting the session or PR.
3. **On delivery** — When you implement capability that clearly matches a roadmap ID, **ask the user**: *“Should we mark AT-### as delivered?”* Only move the item after they confirm (or they say to mark it delivered in the same request).
4. **Do not renumber** — IDs are permanent; never reuse a retired ID.

### ID format

| Pattern | Meaning |
|--------|---------|
| `AT-001` … `AT-999` | Product / engineering items (backlog or delivered) |

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

| ID | Title | Delivered | Source / notes |
|----|-------|-----------|----------------|
| AT-001 | Server-side JWT login (`POST /auth/login`) | 2026 (auth session) | Replaced client-only password gate; see `AGENTS.md` |
| AT-002 | KH (carbonate) input, chart, safe zones, log column | 2026-05 (`ef3a8a3`) | Ordered with other tank metrics after reorder |
| AT-003 | Profile editor with configurable chart safe zones | 2026 (`7ae384e`) | Profile API + UI |
| AT-004 | Profile avatar (emoji + image upload) | 2026 (`fd8dea1`, PR #33) | |
| AT-005 | Persist profile/settings via AWS profile API | 2026 (`f2e8e77`) | |
| AT-006 | GitHub Actions deploy to AWS (OIDC) | 2026 (`0d28449`) | `deploy-aws.yml` |
| AT-007 | Tank readings: edit, delete confirm, PUT/DELETE API | 2026-05 (`1f337f4`) | |
| AT-008 | Tap readings: edit, delete, PUT/DELETE API | 2026-05 | Modals + `/tap/{id}` routes |
| AT-009 | Escape tap `note` in log (XSS hardening) | 2026 (auth session) | `escapeHtml()` in `renderTapLog` |
| AT-010 | Load tank readings independently of profile | 2026 (`0794eb7`, `a61df5a`) | Faster perceived load |
| AT-011 | App icons, manifest, theme color | 2026 (PR #36) | `/assets/` |
| AT-012 | Dynamic copyright footer | 2026 (PR #38) | |
| AT-013 | Password manager autofill on login | 2026 (PR #37) | |
| AT-014 | Fix render when legacy readings lack `kh` | 2026-05 (`99dda5f`) | Post–KH rollout |
| AT-015 | API Gateway CORS JSON for OPTIONS routes | 2026-05 (`1e79788`) | Deploy script fix |
| AT-016 | Roadmap tracking file + agent workflow | 2026-05-17 | This document |

---

## Backlog

| ID | Title | Status | Priority | Source | Notes |
|----|-------|--------|----------|--------|-------|
| AT-017 | Playwright E2E smoke tests (login, add reading, chart render) | idea | medium | `AGENTS.md` gap; `node_modules/playwright` present | No `playwright.config` or CI job yet |
| AT-018 | Lint/format tooling for `index.html` + `lambda/` | idea | low | `AGENTS.md` | Single-file frontend; consider HTML/JS checks only |
| AT-019 | Content-Security-Policy (and related security headers) | idea | medium | Security review ([391aaea1](391aaea1-337f-4d97-bdd6-f6b88ba882c0)) | GitHub Pages limits; document what’s feasible |
| AT-020 | API Gateway gateway responses: CORS on 5xx/integration failures | idea | low | Auth/deploy session ([391aaea1](391aaea1-337f-4d97-bdd6-f6b88ba882c0)) | Reduces misleading browser “CORS” errors when Lambda fails |
| AT-021 | Reduce exposure of static `API_KEY` in `index.html` | idea | medium | Security review | JWT helps; key still public to anyone loading the page |
| AT-022 | Export readings (CSV or JSON download) | idea | medium | Security review (export mentioned) | No `downloadFile` in current `index.html` |
| AT-023 | Chart date-range filter / zoom | idea | low | UX | Long histories get crowded |
| AT-024 | Out-of-range alerts (email/push or on-open banner) | idea | low | user | Would need notification channel + thresholds |
| AT-025 | Additional parameters (e.g. temperature, GH, Ca, Mg) | idea | low | user | Follow KH pattern; profile safe zones + API validation |
| AT-026 | Multi-tank / multiple aquarium profiles | idea | low | user | Data model + partition key design |
| AT-027 | Local dev secrets (`.env` / build inject) instead of committed `API_KEY` | idea | medium | deploy sessions | Safer forks and PR previews |
| AT-028 | Remove duplicate stray files (`index 2.html`, `lambda/index 2.mjs`, etc.) | planned | low | git status / agent cleanup | Untracked duplicates; avoid confusion |
| AT-029 | Backfill UI for missing KH on historical readings | idea | low | KH session ([aff87b27](aff87b27-a3af-4666-855c-02edcc319a66)) | Optional bulk edit or per-row prompt |
| AT-030 | Rate-limit / abuse monitoring dashboard or alarms | idea | low | Security review | Usage plan exists; observability not in repo |

---

## Deferred / won’t fix

| ID | Title | Status | Notes |
|----|-------|--------|-------|
| — | *(none yet)* | — | |

---

## Changelog (roadmap meta)

| Date | Change |
|------|--------|
| 2026-05-17 | Initial roadmap: IDs AT-001–AT-030, delivered items from git + agent transcripts |
