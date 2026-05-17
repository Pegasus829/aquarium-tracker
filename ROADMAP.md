# Aquarium Tracker — Product Roadmap

Living backlog for features and enhancements. **Reference items by ID** (e.g. “implement AT-017”) in issues, PRs, and agent chats.

**Last reviewed:** 2026-05-17 (security audit matrix added)

**Interactive view:** [assets/roadmap.html](assets/roadmap.html) — filter pills (category, status, priority), search, and **Add to Next** (★) for backlog items. In supporting browsers, the page writes Next selections back to this file after you select `ROADMAP.md`. Open via `python3 -m http.server 8000` → http://localhost:8000/assets/roadmap.html

## Security audit matrix (SA-### → roadmap)

2026-05-17 security review of repo + AWS architecture. **`SA-###` IDs are audit findings only**; they are not backlog IDs until promoted to **`AT-###`**.

| Action | Meaning |
|--------|---------|
| **new** | No matching backlog item — add a new `AT-###` row (or batch related findings into one item). |
| **extend** | Existing **backlog** `AT-###` should absorb this finding (update Notes; no duplicate row unless scope is too large). |
| **partial** | A **delivered** `AT-###` addressed related work only — remaining gap still needs **new** or **extend** on backlog. |
| **none** | No roadmap item required: accepted risk, documentation/ops only, or finding is informational. |

| SA | Severity | Finding (short) | AT | Notes |
|----|----------|-----------------|-----|-------|
| SA-001 | High | Complete Cognito-only cutover | AT-034 | With SA-002, SA-008, SA-009 |
| SA-002 | High | Replace unsalted SHA-256 legacy password | AT-034 | Or drop with SA-001 |
| SA-003 | High | Rate-limit auth endpoints | AT-030 | With SA-027 |
| SA-004 | High | Prevent API Gateway auth misconfiguration | AT-035 | Delivered 2026-05-17: `deploy-profile-api.sh` inherits from GET `/readings` |
| SA-005 | High | Deployment protection on `main` | AT-036 | GitHub Environment reviewers |
| SA-006 | High | Chart.js CDN / SRI or vendor locally | AT-037 | `index.html` jsDelivr without `integrity` |
| SA-007 | High | Delete or isolate legacy DynamoDB partitions | AT-038 | Post-migration shared rows |
| SA-008 | Medium | Harden legacy JWT (`iss`/`aud`, TTL) | AT-034 | Low priority if cutover ships first |
| SA-009 | Medium | Block legacy login when Cognito intended | AT-034 | Same work as SA-001 |
| SA-010 | Medium | Review WebAuthn `SINGLE_FACTOR` policy | AT-039 | `cognito-auth-template.yaml` |
| SA-011 | Medium | Lambda-side JWT verification (defense in depth) | AT-040 | Optional if API GW + invoke perms stay tight |
| SA-012 | Medium | Cap API string field sizes | AT-041 | Profile names, tank `id`/`date`, avatar |
| SA-013 | Medium | Validate tank metric types/ranges | AT-042 | Complements AT-025 |
| SA-014 | Medium | Optimistic locking / `ConditionExpression` | AT-043 | Last-write-wins on Put |
| SA-015 | Medium | Paginate DynamoDB list queries | AT-044 | Unbounded partition reads |
| SA-016 | Medium | `apiFetch` use `getValidToken()` | AT-045 | With SA-017, SA-018 |
| SA-017 | Medium | Stop storing unused Cognito ID token | AT-045 | `wqt_id_token` |
| SA-018 | Medium | Token refresh / session renewal | AT-045 | SPA re-auth on expiry |
| SA-019 | Medium | HSTS and edge security headers | AT-046 | Follow-up to delivered AT-019 |
| SA-020 | Medium | Tighten `roadmap.html` CSP | AT-033 | Delivered 2026-05-17: `assets/roadmap.css` + `roadmap.js`; CSP without `unsafe-inline` |
| SA-021 | Medium | Parameterize CSP `connect-src` for local API | AT-047 | Hardcoded API host in `index.html` |
| SA-022 | Medium | Restrict OIDC trust to `main` (or tags) | AT-048 | `github-oidc-trust-policy.json` |
| SA-023 | Medium | Narrow CI deploy role `Resource: "*"` | AT-049 | `github-deploy-policy.json` |
| SA-024 | Medium | Split infra vs routine Lambda deploy | AT-050 | Delivered 2026-05-17: `deploy-aws.yml` (Lambda); `deploy-aws-infra.yml` (manual) |
| SA-025 | Medium | Staging API/credentials for E2E | AT-051 | Follow-up to delivered AT-017 |
| SA-026 | Medium | Rotate/limit `MARC_CURRENT_PASSWORD` secret use | — | Ops only; no backlog row |
| SA-027 | Medium | Auth-failure / security audit logging | AT-030 | With SA-003 |
| SA-028 | Medium | Dependabot + `npm audit` in CI | AT-052 | Root + `lambda/` |
| SA-029 | Medium | DynamoDB encryption at rest + PITR | AT-053 | Verify in console / IaC |
| SA-030 | Medium | Document/enforce single-user data model | AT-026 | Before multi-tank |
| SA-031 | Low | `GET /auth/config` disclosure | — | Intentional SPA discovery |
| SA-032 | Low | Dev-only API CORS for localhost | AT-054 | Optional; low priority |
| SA-033 | Low | Fix `ORIGIN` in Cognito setup script | AT-055 | Small deploy script fix |
| SA-034 | Low | HSTS on API custom domain | AT-046 | Bundled with SA-019 |
| SA-035 | Low | OIDC `nonce` (optional) | — | PKCE + `state` already present |
| SA-036 | Low | Reduce infra IDs in repo | — | Reconnaissance, not secret |
| SA-037 | Low | Remove default email from deploy scripts | — | PII in git; cosmetic |
| SA-038 | Low | Explicit GHA `permissions` on lint/e2e | AT-056 | Small CI hardening |
| SA-039 | Low | Branch protection for Pages `main` | — | GitHub repo settings, not code |
| SA-040 | Low | Export feature security review | AT-022 | When export ships |
| SA-041 | Low | Roadmap page access controls | AT-032 | Same feature |
| SA-042 | Low | Cognito password require symbols | — | Policy choice; 12+ chars already |
| SA-043 | Low | Scrub Lambda 500 logs | AT-057 | Optional; low |
| SA-044 | Low | Confirm no clients use API keys for auth | AT-058 | Ops follow-up to delivered AT-021 |
| SA-045 | Low | Multi-tank authorization design | AT-026 | Security slice of multi-tank |

| Roadmap action | Count |
|----------------|------:|
| **Tracked** (`AT-###` in backlog) | 37 |
| **none** (no backlog row) | 7 |

**Promoted 2026-05-17:** **new** → AT-034–AT-058; **extend** → AT-030, AT-033, AT-026, AT-022, AT-032; **partial** → AT-046 (SA-019), AT-051 (SA-025), AT-058 (SA-044). **none** (SA-026, SA-031, SA-035–SA-037, SA-039, SA-042) — no backlog row.

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
| AT-017 | Enhancement | Playwright E2E smoke tests (login, add reading, chart render) | 2026-05-17 | `playwright.config.js`, `e2e/smoke.spec.js`, `.github/workflows/e2e.yml` |
| AT-020 | Enhancement | API Gateway gateway responses: CORS on 5xx/integration failures | 2026-05-17 | `deploy/configure-gateway-cors-responses.sh`; CI + deploy scripts |
| AT-036 | Security | GitHub deployment protection on `main` | 2026-05-17 | `production` environment + required reviewers; `deploy/github-environments.md` |
| AT-035 | Security | API Gateway auth safe defaults in deploy scripts | 2026-05-17 | SA-004: `deploy-profile-api.sh` inherits auth from GET `/readings`; `NONE` requires `ALLOW_INSECURE_AUTH=1` |
| AT-044 | Enhancement | Paginate DynamoDB list responses | 2026-05-17 | SA-015: paged `Query` for GET `/readings`, `/tap`, `/profile`; optional `limit` + `nextToken` |
| AT-033 | Security | Remove inline code so CSP can drop `unsafe-inline` | 2026-05-17 | SA-020: `index.html` + `assets/roadmap.html` → `app.css`/`app.js`, `roadmap.css`/`roadmap.js`; CSP `script-src`/`style-src` `'self'` only |

---

## Backlog

Use the `Next` column to queue near-term work (`next` vs blank); **Add to Next** (★) in [assets/roadmap.html](assets/roadmap.html) edits that column once `ROADMAP.md` loads (with local save / download fallback). You can move rows to Delivered manually from the roadmap page (**✓** on backlog rows) or by editing this file—keep `assets/roadmap.html` `ROADMAP_ITEMS` aligned when you ship so static hosting stays coherent until AT-031 is done.

| Next | ID | Category | Title | Status | Priority | Source | Notes |
|------|----|----------|-------|--------|----------|--------|-------|
|  | AT-018 | Enhancement | Lint/format tooling for `index.html` + `lambda/` | idea | low | `AGENTS.md` | Single-file frontend; consider HTML/JS checks only |
|  | AT-034 | Security | Cognito-only cutover; remove legacy auth | idea | high | security-review (SA-001, SA-002, SA-008, SA-009) | `AUTH_MODE=cognito`, API GW authorizer, drop `POST /auth/login` / HS256 path |
|  | AT-037 | Security | Vendor Chart.js or add SRI | idea | high | security-review (SA-006) | `index.html` loads jsDelivr without `integrity` |
|  | AT-038 | Security | Delete or isolate legacy DynamoDB partitions | idea | high | security-review (SA-007) | Post-migration shared `tank`/`tap`/`profile` rows |
|  | AT-039 | Security | Review WebAuthn `SINGLE_FACTOR` policy | idea | medium | security-review (SA-010) | `deploy/cognito-auth-template.yaml` |
|  | AT-040 | Security | Lambda-side JWT verification (defense in depth) | idea | low | security-review (SA-011) | Optional if API GW + `lambda:Invoke` stay locked down |
|  | AT-041 | Security | Cap API string field sizes | idea | medium | security-review (SA-012) | Profile names, tank `id`/`date`, avatar payload |
|  | AT-042 | Security | Validate tank metric types and ranges on API | idea | medium | security-review (SA-013) | API-wide; complements AT-025 new parameters |
|  | AT-043 | Security | Optimistic locking on API writes | idea | medium | security-review (SA-014) | `ConditionExpression` / version attribute on Put |
|  | AT-045 | Security | Frontend auth token hygiene | idea | medium | security-review (SA-016, SA-017, SA-018) | `getValidToken` in `apiFetch`; drop `wqt_id_token`; refresh tokens |
|  | AT-046 | Security | HSTS and edge security headers (static + API) | idea | medium | security-review (SA-019, SA-034) | Follow-up to delivered AT-019; CloudFront or similar |
|  | AT-047 | Security | Parameterize CSP `connect-src` for local API | idea | medium | security-review (SA-021) | Hardcoded API host in `index.html` CSP |
|  | AT-048 | Security | Restrict GitHub OIDC trust to `main` | idea | medium | security-review (SA-022) | `deploy/github-oidc-trust-policy.json` |
|  | AT-049 | Security | Narrow CI deploy IAM policies | idea | medium | security-review (SA-023) | `github-deploy-policy.json` Cognito/CFN `Resource: "*"` |
|  | AT-051 | Security | Staging API and credentials for E2E | idea | medium | security-review (SA-025) | Follow-up to delivered AT-017; do not hit prod API |
|  | AT-052 | Security | Dependabot and `npm audit` in CI | idea | medium | security-review (SA-028) | Root + `lambda/` |
|  | AT-053 | Security | DynamoDB encryption at rest and PITR | idea | medium | security-review (SA-029) | Verify in console / IaC |
|  | AT-054 | Enhancement | Dev-only API CORS for localhost | idea | low | security-review (SA-032) | Optional local HTTP dev |
|  | AT-055 | Defect | Fix `ORIGIN` in Cognito setup script | idea | low | security-review (SA-033) | `setup-cognito-auth.sh` → gateway CORS |
|  | AT-056 | Security | Explicit GHA `permissions` on lint/e2e | idea | low | security-review (SA-038) | `.github/workflows/lint.yml`, `e2e.yml` |
|  | AT-057 | Security | Scrub sensitive data from Lambda 500 logs | idea | low | security-review (SA-043) | Avoid full exception dumps in CloudWatch |
|  | AT-058 | Security | Verify API keys not used for authorization | idea | low | security-review (SA-044) | Ops follow-up to delivered AT-021 |
|  | AT-022 | New Feature | Export readings (CSV or JSON download) | idea | medium | Security review (export mentioned) | SA-040: security review before export ships; no `downloadFile` yet |
|  | AT-023 | Enhancement | Chart date-range filter / zoom | idea | low | UX | Long histories get crowded |
|  | AT-024 | New Feature | Out-of-range alerts (email/push or on-open banner) | idea | low | user | Would need notification channel + thresholds |
|  | AT-025 | New Feature | Additional parameters (e.g. temperature, GH, Ca, Mg) | idea | low | user | Follow KH pattern; profile safe zones + API validation |
|  | AT-026 | New Feature | Multi-tank / multiple aquarium profiles | idea | low | user | SA-030, SA-045: partition design + per-tank authorization before multi-user scale |
|  | AT-029 | Enhancement | Backfill UI for missing KH on historical readings | idea | low | KH session ([aff87b27](aff87b27-a3af-4666-855c-02edcc319a66)) | Optional bulk edit or per-row prompt |
|  | AT-030 | Security | Rate-limit / abuse monitoring dashboard or alarms | idea | medium | Security review | SA-003, SA-027: WAF/throttle `/auth/login` + token abuse; auth-failure audit logs and alarms |
|  | AT-031 | Enhancement | Generate interactive roadmap data from `ROADMAP.md` | idea | low | agent:roadmap-next-sync | Avoid maintaining duplicate `ROADMAP_ITEMS` data by hand |
|  | AT-032 | Security | Roadmap permissions with read/write access controls | idea | medium | user | SA-041: default no roadmap access; `marc@amphletts.uk` write access |

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
| 2026-05-17 | Delivered AT-017: Playwright smoke tests + `e2e.yml` CI workflow |
| 2026-05-17 | Delivered AT-020: API Gateway gateway response CORS (`configure-gateway-cors-responses.sh`) |
| 2026-05-17 | Added [Security audit matrix](#security-audit-matrix-sa--roadmap) (SA-001–SA-045 → roadmap action) |
| 2026-05-17 | Promoted security audit: AT-034–AT-058 backlog; extended AT-030, AT-033, AT-026, AT-022, AT-032 |
| 2026-05-17 | Delivered AT-036: GitHub `production` environment gate on `deploy-aws.yml` |
| 2026-05-17 | Delivered AT-050: split Lambda (`deploy-aws.yml`) vs infra (`deploy-aws-infra.yml`) workflows |
| 2026-05-17 | Delivered AT-033: externalized roadmap page assets; CSP without `unsafe-inline` on main app and roadmap |
