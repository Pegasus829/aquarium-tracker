// Sync from ROADMAP.md when adding items (agents: update both files).
const ROADMAP_ITEMS = [
  { id: 'AT-001', section: 'delivered', category: 'Security', title: 'Server-side JWT login (POST /auth/login)', status: 'delivered', priority: '', delivered: '2026 (auth session)', source: '', notes: 'Replaced client-only password gate; see AGENTS.md' },
  { id: 'AT-002', section: 'delivered', category: 'New Feature', title: 'KH (carbonate) input, chart, safe zones, log column', status: 'delivered', priority: '', delivered: '2026-05 (ef3a8a3)', source: '', notes: 'Ordered with other tank metrics after reorder' },
  { id: 'AT-003', section: 'delivered', category: 'New Feature', title: 'Profile editor with configurable chart safe zones', status: 'delivered', priority: '', delivered: '2026 (7ae384e)', source: '', notes: 'Profile API + UI' },
  { id: 'AT-004', section: 'delivered', category: 'Enhancement', title: 'Profile avatar (emoji + image upload)', status: 'delivered', priority: '', delivered: '2026 (fd8dea1, PR #33)', source: '', notes: '' },
  { id: 'AT-005', section: 'delivered', category: 'Enhancement', title: 'Persist profile/settings via AWS profile API', status: 'delivered', priority: '', delivered: '2026 (f2e8e77)', source: '', notes: '' },
  { id: 'AT-006', section: 'delivered', category: 'Enhancement', title: 'GitHub Actions deploy to AWS (OIDC)', status: 'delivered', priority: '', delivered: '2026 (0d28449)', source: '', notes: 'deploy-aws.yml' },
  { id: 'AT-007', section: 'delivered', category: 'Enhancement', title: 'Tank readings: edit, delete confirm, PUT/DELETE API', status: 'delivered', priority: '', delivered: '2026-05 (1f337f4)', source: '', notes: '' },
  { id: 'AT-008', section: 'delivered', category: 'Enhancement', title: 'Tap readings: edit, delete, PUT/DELETE API', status: 'delivered', priority: '', delivered: '2026-05', source: '', notes: 'Modals + /tap/{id} routes' },
  { id: 'AT-009', section: 'delivered', category: 'Security', title: 'Escape tap note in log (XSS hardening)', status: 'delivered', priority: '', delivered: '2026 (auth session)', source: '', notes: 'escapeHtml() in renderTapLog' },
  { id: 'AT-010', section: 'delivered', category: 'Enhancement', title: 'Load tank readings independently of profile', status: 'delivered', priority: '', delivered: '2026 (0794eb7, a61df5a)', source: '', notes: 'Faster perceived load' },
  { id: 'AT-011', section: 'delivered', category: 'Enhancement', title: 'App icons, manifest, theme color', status: 'delivered', priority: '', delivered: '2026 (PR #36)', source: '', notes: '/assets/' },
  { id: 'AT-012', section: 'delivered', category: 'Enhancement', title: 'Dynamic copyright footer', status: 'delivered', priority: '', delivered: '2026 (PR #38)', source: '', notes: '' },
  { id: 'AT-013', section: 'delivered', category: 'Accessibility', title: 'Password manager autofill on login', status: 'delivered', priority: '', delivered: '2026 (PR #37)', source: '', notes: '' },
  { id: 'AT-014', section: 'delivered', category: 'Defect', title: 'Fix render when legacy readings lack kh', status: 'delivered', priority: '', delivered: '2026-05 (99dda5f)', source: '', notes: 'Post–KH rollout' },
  { id: 'AT-015', section: 'delivered', category: 'Defect', title: 'API Gateway CORS JSON for OPTIONS routes', status: 'delivered', priority: '', delivered: '2026-05 (1e79788)', source: '', notes: 'Deploy script fix' },
  { id: 'AT-016', section: 'delivered', category: 'Enhancement', title: 'Roadmap tracking file + agent workflow', status: 'delivered', priority: '', delivered: '2026-05-17', source: '', notes: 'ROADMAP.md' },
  { id: 'AT-019', section: 'delivered', category: 'Security', title: 'Content-Security-Policy (and related security headers)', status: 'delivered', priority: '', delivered: '2026-05-17', source: '', notes: 'Meta CSP + Lambda security headers; see SECURITY.md' },
  { id: 'AT-033', section: 'delivered', category: 'Security', title: 'Remove inline code so CSP can drop unsafe-inline', status: 'delivered', priority: '', delivered: '2026-05-17', source: 'agent:at-019', notes: 'SA-020: index.html + assets/roadmap.html → app.css/js, roadmap.css/js; CSP without unsafe-inline' },
  { id: 'AT-021', section: 'delivered', category: 'Security', title: 'Reduce exposure of static API_KEY in index.html', status: 'delivered', priority: '', delivered: '2026 (Cognito rollout)', source: '', notes: 'AUTHENTICATION.md; JWT-only browser requests; deploy/disable-api-key-requirement.sh clears stage apiKeyRequired' },
  { id: 'AT-028', section: 'delivered', category: 'Enhancement', title: 'Remove duplicate stray files (index 2.html, lambda/index 2.mjs, etc.)', status: 'delivered', priority: '', delivered: '2026-05-17', source: '', notes: 'Added .gitignore guard for local duplicate copy artifacts' },
  { id: 'AT-017', section: 'delivered', category: 'Enhancement', title: 'Playwright E2E smoke tests (login, add reading, chart render)', status: 'delivered', priority: '', delivered: '2026-05-17', source: '', notes: 'playwright.config.js, e2e/smoke.spec.js, e2e.yml' },
  { id: 'AT-020', section: 'delivered', category: 'Enhancement', title: 'API Gateway gateway responses: CORS on 5xx/integration failures', status: 'delivered', priority: '', delivered: '2026-05-17', source: '', notes: 'deploy/configure-gateway-cors-responses.sh; integration/authorizer failures' },
  { id: 'AT-036', section: 'delivered', category: 'Security', title: 'GitHub deployment protection on main', status: 'delivered', priority: '', delivered: '2026-05-17', source: 'security-review', notes: 'SA-005: production environment + required reviewers; deploy/github-environments.md' },
  { id: 'AT-035', section: 'delivered', category: 'Security', title: 'API Gateway auth safe defaults in deploy scripts', status: 'delivered', priority: '', delivered: '2026-05-17', source: 'security-review', notes: 'SA-004: deploy-profile-api.sh inherits auth from GET /readings; NONE requires ALLOW_INSECURE_AUTH=1' },
  { id: 'AT-018', section: 'backlog', category: 'Enhancement', title: 'Lint/format tooling for index.html + lambda/', status: 'idea', priority: 'low', delivered: '', source: 'AGENTS.md', notes: 'Single-file frontend; consider HTML/JS checks only' },
  { id: 'AT-034', section: 'backlog', category: 'Security', title: 'Cognito-only cutover; remove legacy auth', status: 'idea', priority: 'high', delivered: '', source: 'security-review', notes: 'SA-001, SA-002, SA-008, SA-009: AUTH_MODE=cognito, API GW authorizer, drop POST /auth/login / HS256' },
  { id: 'AT-037', section: 'backlog', category: 'Security', title: 'Vendor Chart.js or add SRI', status: 'idea', priority: 'high', delivered: '', source: 'security-review', notes: 'SA-006: index.html jsDelivr without integrity' },
  { id: 'AT-038', section: 'backlog', category: 'Security', title: 'Delete or isolate legacy DynamoDB partitions', status: 'idea', priority: 'high', delivered: '', source: 'security-review', notes: 'SA-007: post-migration shared tank/tap/profile rows' },
  { id: 'AT-039', section: 'backlog', category: 'Security', title: 'Review WebAuthn SINGLE_FACTOR policy', status: 'idea', priority: 'medium', delivered: '', source: 'security-review', notes: 'SA-010: deploy/cognito-auth-template.yaml' },
  { id: 'AT-040', section: 'backlog', category: 'Security', title: 'Lambda-side JWT verification (defense in depth)', status: 'idea', priority: 'low', delivered: '', source: 'security-review', notes: 'SA-011: optional if API GW + lambda:Invoke locked down' },
  { id: 'AT-041', section: 'backlog', category: 'Security', title: 'Cap API string field sizes', status: 'idea', priority: 'medium', delivered: '', source: 'security-review', notes: 'SA-012: profile names, tank id/date, avatar payload' },
  { id: 'AT-042', section: 'backlog', category: 'Security', title: 'Validate tank metric types and ranges on API', status: 'idea', priority: 'medium', delivered: '', source: 'security-review', notes: 'SA-013: complements AT-025 new parameters' },
  { id: 'AT-043', section: 'backlog', category: 'Security', title: 'Optimistic locking on API writes', status: 'idea', priority: 'medium', delivered: '', source: 'security-review', notes: 'SA-014: ConditionExpression / version on Put' },
  { id: 'AT-044', section: 'backlog', category: 'Enhancement', title: 'Paginate DynamoDB list responses', status: 'idea', priority: 'medium', delivered: '', source: 'security-review', notes: 'SA-015: unbounded Query per partition' },
  { id: 'AT-045', section: 'backlog', category: 'Security', title: 'Frontend auth token hygiene', status: 'idea', priority: 'medium', delivered: '', source: 'security-review', notes: 'SA-016–SA-018: getValidToken in apiFetch; drop wqt_id_token; refresh tokens' },
  { id: 'AT-046', section: 'backlog', category: 'Security', title: 'HSTS and edge security headers (static + API)', status: 'idea', priority: 'medium', delivered: '', source: 'security-review', notes: 'SA-019, SA-034: follow-up to delivered AT-019; CloudFront or similar' },
  { id: 'AT-047', section: 'backlog', category: 'Security', title: 'Parameterize CSP connect-src for local API', status: 'idea', priority: 'medium', delivered: '', source: 'security-review', notes: 'SA-021: hardcoded API host in index.html CSP' },
  { id: 'AT-048', section: 'backlog', category: 'Security', title: 'Restrict GitHub OIDC trust to main', status: 'idea', priority: 'medium', delivered: '', source: 'security-review', notes: 'SA-022: github-oidc-trust-policy.json' },
  { id: 'AT-049', section: 'backlog', category: 'Security', title: 'Narrow CI deploy IAM policies', status: 'idea', priority: 'medium', delivered: '', source: 'security-review', notes: 'SA-023: github-deploy-policy.json Cognito/CFN Resource: *' },
  { id: 'AT-050', section: 'backlog', category: 'Enhancement', title: 'Split infra vs routine Lambda deploy workflow', status: 'idea', priority: 'medium', delivered: '', source: 'security-review', notes: 'SA-024: deploy-aws.yml API key script + stage every push' },
  { id: 'AT-051', section: 'backlog', category: 'Security', title: 'Staging API and credentials for E2E', status: 'idea', priority: 'medium', delivered: '', source: 'security-review', notes: 'SA-025: follow-up to delivered AT-017; do not hit prod API' },
  { id: 'AT-052', section: 'backlog', category: 'Security', title: 'Dependabot and npm audit in CI', status: 'idea', priority: 'medium', delivered: '', source: 'security-review', notes: 'SA-028: root + lambda/' },
  { id: 'AT-053', section: 'backlog', category: 'Security', title: 'DynamoDB encryption at rest and PITR', status: 'idea', priority: 'medium', delivered: '', source: 'security-review', notes: 'SA-029: verify in console / IaC' },
  { id: 'AT-054', section: 'backlog', category: 'Enhancement', title: 'Dev-only API CORS for localhost', status: 'idea', priority: 'low', delivered: '', source: 'security-review', notes: 'SA-032: optional local HTTP dev' },
  { id: 'AT-055', section: 'backlog', category: 'Defect', title: 'Fix ORIGIN in Cognito setup script', status: 'idea', priority: 'low', delivered: '', source: 'security-review', notes: 'SA-033: setup-cognito-auth.sh → gateway CORS' },
  { id: 'AT-056', section: 'backlog', category: 'Security', title: 'Explicit GHA permissions on lint/e2e', status: 'idea', priority: 'low', delivered: '', source: 'security-review', notes: 'SA-038: lint.yml, e2e.yml' },
  { id: 'AT-057', section: 'backlog', category: 'Security', title: 'Scrub sensitive data from Lambda 500 logs', status: 'idea', priority: 'low', delivered: '', source: 'security-review', notes: 'SA-043: avoid full exception dumps in CloudWatch' },
  { id: 'AT-058', section: 'backlog', category: 'Security', title: 'Verify API keys not used for authorization', status: 'idea', priority: 'low', delivered: '', source: 'security-review', notes: 'SA-044: ops follow-up to delivered AT-021' },
  { id: 'AT-022', section: 'backlog', category: 'New Feature', title: 'Export readings (CSV or JSON download)', status: 'idea', priority: 'medium', delivered: '', source: 'Security review', notes: 'SA-040: security review before export; no downloadFile yet' },
  { id: 'AT-023', section: 'backlog', category: 'Enhancement', title: 'Chart date-range filter / zoom', status: 'idea', priority: 'low', delivered: '', source: 'UX', notes: 'Long histories get crowded' },
  { id: 'AT-024', section: 'backlog', category: 'New Feature', title: 'Out-of-range alerts (email/push or on-open banner)', status: 'idea', priority: 'low', delivered: '', source: 'user', notes: 'Would need notification channel + thresholds' },
  { id: 'AT-025', section: 'backlog', category: 'New Feature', title: 'Additional parameters (e.g. temperature, GH, Ca, Mg)', status: 'idea', priority: 'low', delivered: '', source: 'user', notes: 'Follow KH pattern; profile safe zones + API validation' },
  { id: 'AT-026', section: 'backlog', category: 'New Feature', title: 'Multi-tank / multiple aquarium profiles', status: 'idea', priority: 'low', delivered: '', source: 'user', notes: 'SA-030, SA-045: partition design + per-tank authorization' },
  { id: 'AT-027', section: 'delivered', category: 'Security', title: 'Local dev secrets (.env / build inject) instead of committed API_KEY', status: 'delivered', priority: '', delivered: '2026-05-17', source: '', notes: 'config.js + .env → config.local.js; scripts/generate-local-config.mjs' },
  { id: 'AT-029', section: 'backlog', category: 'Enhancement', title: 'Backfill UI for missing KH on historical readings', status: 'idea', priority: 'low', delivered: '', source: 'KH session', notes: 'Optional bulk edit or per-row prompt' },
  { id: 'AT-030', section: 'backlog', category: 'Security', title: 'Rate-limit / abuse monitoring dashboard or alarms', status: 'idea', priority: 'medium', delivered: '', source: 'Security review', notes: 'SA-003, SA-027: WAF/throttle auth endpoints; audit logs and alarms' },
  { id: 'AT-031', section: 'backlog', category: 'Enhancement', title: 'Generate interactive roadmap data from ROADMAP.md', status: 'idea', priority: 'low', delivered: '', source: 'agent:roadmap-next-sync', notes: 'Avoid maintaining duplicate ROADMAP_ITEMS data by hand' },
  { id: 'AT-032', section: 'backlog', category: 'Security', title: 'Roadmap permissions with read/write access controls', status: 'idea', priority: 'medium', delivered: '', source: 'user', notes: 'SA-041: default no roadmap access; marc@amphletts.uk write access' },
];

const ROADMAP_PATH = '/ROADMAP.md';
const STORAGE_NEXT = 'wqt_roadmap_next';
const CATEGORIES = ['Security', 'Accessibility', 'New Feature', 'Enhancement', 'Commercial', 'Defect'];
const STATUSES = ['idea', 'planned', 'in_progress', 'delivered', 'deferred', 'wont_fix'];
const PRIORITIES = ['high', 'medium', 'low'];

/** @type {Record<string, 'neutral'|'include'|'exclude'>} */
const filterState = {};
let nextOnly = false;
let nextIds = new Set();
let roadmapMarkdown = '';
let roadmapFileHandle = null;
let roadmapDownloadUrl = '';
/** @type {typeof ROADMAP_ITEMS | null} */
let displayItems = null;

function compareAtId(a, b) {
  const na = parseInt(String(a.id).slice(3), 10) || 0;
  const nb = parseInt(String(b.id).slice(3), 10) || 0;
  return na - nb;
}

function getItems() {
  return displayItems || ROADMAP_ITEMS;
}

function sortItemRows(rows) {
  return [...rows].sort(compareAtId);
}

function findDeliveredTable(lines) {
  let inDelivered = false;
  for (let i = 0; i < lines.length; i += 1) {
    if (/^##\s+Delivered\b/.test(lines[i])) {
      inDelivered = true;
      continue;
    }
    if (inDelivered && /^##\s+/.test(lines[i])) break;
    if (!inDelivered) continue;
    const cells = splitMarkdownRow(lines[i]);
    if (!cells) continue;
    const headers = cells.map(normalizeHeaderCell);
    if (headers[0] === 'id' && headers.includes('category') && headers.includes('title') && headers.includes('delivered')) {
      return { headerIndex: i };
    }
  }
  return null;
}

function findDeferredTable(lines) {
  let inDeferred = false;
  for (let i = 0; i < lines.length; i += 1) {
    if (/^##\s+Deferred\b/.test(lines[i])) {
      inDeferred = true;
      continue;
    }
    if (inDeferred && /^##\s+/.test(lines[i])) break;
    if (!inDeferred) continue;
    const cells = splitMarkdownRow(lines[i]);
    if (!cells) continue;
    const headers = cells.map(normalizeHeaderCell);
    if (
      headers[0] === 'id' &&
      headers.includes('category') &&
      headers.includes('title') &&
      headers.includes('status') &&
      !headers.includes('delivered')
    ) {
      return { headerIndex: i };
    }
  }
  return null;
}

function deliveredNotesColumnIndex(headers) {
  const j = headers.findIndex((h) => h.includes('source') && h.includes('notes'));
  if (j !== -1) return j;
  return headers.length - 1;
}

function parseMarkdownDeliveredRows(markdown) {
  const lines = markdown.split(/\r?\n/);
  const table = findDeliveredTable(lines);
  if (!table) return [];
  const headerCells = splitMarkdownRow(lines[table.headerIndex]) || [];
  const headers = headerCells.map(normalizeHeaderCell);
  const idx = Object.fromEntries(headers.map((h, i) => [h, i]));
  const notesIdx = deliveredNotesColumnIndex(headers);
  const rows = [];
  const start = dataStartIndex(lines, table.headerIndex);
  for (let i = start; i < lines.length; i += 1) {
    const cells = splitMarkdownRow(lines[i]);
    if (!cells) break;
    if (isMarkdownSeparator(cells)) continue;
    const id = cells[idx.id];
    if (!/^AT-\d{3}$/.test(id)) continue;
    rows.push({
      id,
      category: cells[idx.category] || '',
      title: cells[idx.title] || '',
      delivered: cells[idx.delivered] || '',
      notes: cells[notesIdx] || '',
    });
  }
  return rows;
}

function parseMarkdownBacklogRows(markdown) {
  const lines = markdown.split(/\r?\n/);
  const table = findBacklogTable(lines);
  if (!table) return [];
  const headerCells = splitMarkdownRow(lines[table.headerIndex]) || [];
  const headers = headerCells.map(normalizeHeaderCell);
  const idx = Object.fromEntries(headers.map((h, i) => [h, i]));
  const rows = [];
  const start = dataStartIndex(lines, table.headerIndex);
  for (let i = start; i < lines.length; i += 1) {
    const cells = splitMarkdownRow(lines[i]);
    if (!cells) break;
    if (isMarkdownSeparator(cells)) continue;
    const id = cells[idx.id];
    if (!/^AT-\d{3}$/.test(id)) continue;
    rows.push({
      id,
      category: cells[idx.category] || '',
      title: cells[idx.title] || '',
      status: cells[idx.status] || '',
      priority: cells[idx.priority] || '',
      source: cells[idx.source] || '',
      notes: cells[idx.notes] || '',
    });
  }
  return rows;
}

function parseMarkdownDeferredRows(markdown) {
  const lines = markdown.split(/\r?\n/);
  const table = findDeferredTable(lines);
  if (!table) return [];
  const headerCells = splitMarkdownRow(lines[table.headerIndex]) || [];
  const headers = headerCells.map(normalizeHeaderCell);
  const idx = Object.fromEntries(headers.map((h, i) => [h, i]));
  const rows = [];
  const start = dataStartIndex(lines, table.headerIndex);
  for (let i = start; i < lines.length; i += 1) {
    const cells = splitMarkdownRow(lines[i]);
    if (!cells) break;
    if (isMarkdownSeparator(cells)) continue;
    const id = cells[idx.id];
    if (!/^AT-\d{3}$/.test(id)) continue;
    rows.push({
      id,
      category: cells[idx.category] || '',
      title: cells[idx.title] || '',
      status: cells[idx.status] || 'wont_fix',
      notes: cells[idx.notes] || '',
    });
  }
  return rows;
}

function isDeferredBacklogStatus(status) {
  const s = String(status || '')
    .trim()
    .toLowerCase();
  return s === 'wont_fix' || s === 'deferred';
}

function buildDisplayItemsFromMarkdown(markdown, template) {
  const deliveredRows = parseMarkdownDeliveredRows(markdown);
  const deferredRows = parseMarkdownDeferredRows(markdown);
  const backlogRows = parseMarkdownBacklogRows(markdown);
  const deliveredIds = new Set(deliveredRows.map((r) => r.id));
  const deferredIds = new Set(deferredRows.map((r) => r.id));
  const deliveredById = new Map(deliveredRows.map((r) => [r.id, r]));
  const deferredById = new Map(deferredRows.map((r) => [r.id, r]));
  const backlogById = new Map(backlogRows.map((r) => [r.id, r]));
  const byId = new Map(template.map((item) => [item.id, { ...item }]));

  for (const [id, row] of deliveredById) {
    const base = byId.get(id);
    if (base) {
      byId.set(id, {
        ...base,
        section: 'delivered',
        status: 'delivered',
        category: row.category || base.category,
        title: row.title || base.title,
        delivered: row.delivered || base.delivered,
        notes: row.notes !== undefined && row.notes !== '' ? row.notes : base.notes,
        priority: '',
        source: '',
      });
    } else {
      byId.set(id, {
        id: row.id,
        section: 'delivered',
        category: row.category || '',
        title: row.title || '',
        status: 'delivered',
        priority: '',
        delivered: row.delivered || '',
        source: '',
        notes: row.notes || '',
      });
    }
  }

  for (const [id, row] of deferredById) {
    if (deliveredIds.has(id)) continue;
    const base = byId.get(id);
    const status = row.status || 'wont_fix';
    if (base) {
      byId.set(id, {
        ...base,
        section: 'deferred',
        category: row.category || base.category,
        title: row.title || base.title,
        status,
        notes: row.notes !== undefined && row.notes !== '' ? row.notes : base.notes,
        priority: '',
        source: '',
        delivered: '',
      });
    } else {
      byId.set(id, {
        id: row.id,
        section: 'deferred',
        category: row.category || '',
        title: row.title || '',
        status,
        priority: '',
        delivered: '',
        source: '',
        notes: row.notes || '',
      });
    }
  }

  for (const [id, row] of backlogById) {
    if (deliveredIds.has(id) || deferredIds.has(id)) continue;
    const closed = isDeferredBacklogStatus(row.status);
    const base = byId.get(id);
    if (base) {
      byId.set(id, {
        ...base,
        section: closed ? 'deferred' : 'backlog',
        category: row.category,
        title: row.title,
        status: row.status,
        priority: closed ? '' : row.priority,
        source: closed ? '' : row.source,
        notes: row.notes,
        delivered: '',
      });
    } else {
      byId.set(id, {
        id,
        section: closed ? 'deferred' : 'backlog',
        category: row.category,
        title: row.title,
        status: row.status,
        priority: closed ? '' : row.priority || '',
        delivered: '',
        source: closed ? '' : row.source || '',
        notes: row.notes || '',
      });
    }
  }

  return sortItemRows([...byId.values()]);
}

function formatDeliveredNoteFromBacklog(source, notes) {
  const parts = [];
  if (source && String(source).trim()) parts.push(`\`${String(source).trim()}\``);
  if (notes && String(notes).trim()) parts.push(String(notes).trim());
  return parts.length ? parts.join(' · ') : '—';
}

function moveBacklogItemToDeliveredMarkdown(markdown, id, deliveredLabel) {
  const lines = markdown.split(/\r?\n/);
  const backlogTable = findBacklogTable(lines);
  if (!backlogTable) return markdown;

  const bHeaderCells = splitMarkdownRow(lines[backlogTable.headerIndex]) || [];
  const bHeaders = bHeaderCells.map(normalizeHeaderCell);
  const bIdx = Object.fromEntries(bHeaders.map((h, i) => [h, i]));
  const bid = bIdx.id;
  const dataStart = dataStartIndex(lines, backlogTable.headerIndex);
  let removeIndex = -1;
  /** @type {string[] | null} */
  let rowCells = null;
  for (let i = dataStart; i < lines.length; i += 1) {
    const cells = splitMarkdownRow(lines[i]);
    if (!cells) break;
    if (isMarkdownSeparator(cells)) continue;
    if (cells[bid] === id) {
      removeIndex = i;
      rowCells = cells;
      break;
    }
  }
  if (removeIndex === -1 || !rowCells) return markdown;

  const category = rowCells[bIdx.category] || '';
  const title = rowCells[bIdx.title] || '';
  const source = rowCells[bIdx.source] || '';
  const notes = rowCells[bIdx.notes] || '';
  const combinedNotes = formatDeliveredNoteFromBacklog(source, notes);

  lines.splice(removeIndex, 1);

  const delTable = findDeliveredTable(lines);
  if (!delTable) return lines.join('\n');

  const dHeaderCells = splitMarkdownRow(lines[delTable.headerIndex]) || [];
  const dHeaders = dHeaderCells.map(normalizeHeaderCell);
  const dIdx = Object.fromEntries(dHeaders.map((h, i) => [h, i]));
  const dDataStart = dataStartIndex(lines, delTable.headerIndex);
  const newRow = formatMarkdownRow([id, category, title, deliveredLabel, combinedNotes]);
  const idNum = parseInt(id.slice(3), 10);
  let replaced = false;

  for (let i = dDataStart; i < lines.length; i += 1) {
    const cells = splitMarkdownRow(lines[i]);
    if (!cells) break;
    if (isMarkdownSeparator(cells)) continue;
    const rid = cells[dIdx.id];
    if (!/^AT-\d{3}$/.test(rid)) break;
    if (rid === id) {
      lines[i] = newRow;
      replaced = true;
      break;
    }
  }

  if (!replaced) {
    let insertAt = dDataStart;
    for (let i = dDataStart; i < lines.length; i += 1) {
      const cells = splitMarkdownRow(lines[i]);
      if (!cells) break;
      if (isMarkdownSeparator(cells)) continue;
      const rid = cells[dIdx.id];
      if (!/^AT-\d{3}$/.test(rid)) break;
      const rNum = parseInt(rid.slice(3), 10);
      if (rNum < idNum) insertAt = i + 1;
      else break;
    }
    lines.splice(insertAt, 0, newRow);
  }

  return lines.join('\n');
}

function removeDeferredPlaceholderRow(lines, defTable, dIdx) {
  const dDataStart = dataStartIndex(lines, defTable.headerIndex);
  for (let i = dDataStart; i < lines.length; i += 1) {
    const cells = splitMarkdownRow(lines[i]);
    if (!cells) break;
    if (isMarkdownSeparator(cells)) continue;
    const rid = cells[dIdx.id];
    if (!/^AT-\d{3}$/.test(rid)) {
      lines.splice(i, 1);
    }
    return;
  }
}

function moveBacklogItemToWontFixMarkdown(markdown, id) {
  const lines = markdown.split(/\r?\n/);
  const backlogTable = findBacklogTable(lines);
  if (!backlogTable) return markdown;

  const bHeaderCells = splitMarkdownRow(lines[backlogTable.headerIndex]) || [];
  const bHeaders = bHeaderCells.map(normalizeHeaderCell);
  const bIdx = Object.fromEntries(bHeaders.map((h, i) => [h, i]));
  const bid = bIdx.id;
  const dataStart = dataStartIndex(lines, backlogTable.headerIndex);
  let removeIndex = -1;
  /** @type {string[] | null} */
  let rowCells = null;
  for (let i = dataStart; i < lines.length; i += 1) {
    const cells = splitMarkdownRow(lines[i]);
    if (!cells) break;
    if (isMarkdownSeparator(cells)) continue;
    if (cells[bid] === id) {
      removeIndex = i;
      rowCells = cells;
      break;
    }
  }
  if (removeIndex === -1 || !rowCells) return markdown;

  const category = rowCells[bIdx.category] || '';
  const title = rowCells[bIdx.title] || '';
  const source = rowCells[bIdx.source] || '';
  const notes = rowCells[bIdx.notes] || '';
  const combinedNotes = formatDeliveredNoteFromBacklog(source, notes);

  lines.splice(removeIndex, 1);

  const defTable = findDeferredTable(lines);
  if (!defTable) return lines.join('\n');

  const dHeaderCells = splitMarkdownRow(lines[defTable.headerIndex]) || [];
  const dHeaders = dHeaderCells.map(normalizeHeaderCell);
  const dIdx = Object.fromEntries(dHeaders.map((h, i) => [h, i]));
  const dDataStart = dataStartIndex(lines, defTable.headerIndex);
  const newRow = formatMarkdownRow([id, category, title, 'wont_fix', combinedNotes]);
  const idNum = parseInt(id.slice(3), 10);
  let replaced = false;

  for (let i = dDataStart; i < lines.length; i += 1) {
    const cells = splitMarkdownRow(lines[i]);
    if (!cells) break;
    if (isMarkdownSeparator(cells)) continue;
    const rid = cells[dIdx.id];
    if (!/^AT-\d{3}$/.test(rid)) break;
    if (rid === id) {
      lines[i] = newRow;
      replaced = true;
      break;
    }
  }

  if (!replaced) {
    removeDeferredPlaceholderRow(lines, defTable, dIdx);
    let insertAt = dDataStart;
    for (let i = dDataStart; i < lines.length; i += 1) {
      const cells = splitMarkdownRow(lines[i]);
      if (!cells) break;
      if (isMarkdownSeparator(cells)) continue;
      const rid = cells[dIdx.id];
      if (!/^AT-\d{3}$/.test(rid)) break;
      const rNum = parseInt(rid.slice(3), 10);
      if (rNum < idNum) insertAt = i + 1;
      else break;
    }
    lines.splice(insertAt, 0, newRow);
  }

  return lines.join('\n');
}

async function markItemDelivered(id) {
  const item = getItems().find((i) => i.id === id);
  if (!item || item.section !== 'backlog') return;
  const deliveredLabel = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  })();
  const ok = window.confirm(`Mark ${id} as delivered? Its backlog row will be removed from ROADMAP.md and a Delivered row will be added (date: ${deliveredLabel}).`);
  if (!ok) return;
  if (!roadmapMarkdown) {
    setSyncStatus('ROADMAP.md is not loaded yet. Serve the repo over HTTP (see AGENTS.md) or use Save to ROADMAP.md after it loads.', 'warn');
    return;
  }
  roadmapMarkdown = moveBacklogItemToDeliveredMarkdown(roadmapMarkdown, id, deliveredLabel);
  nextIds.delete(id);
  saveNext();
  updateRoadmapDownload();
  refreshNextUi();
  await persistRoadmapMarkdown({ allowPrompt: true });
}

async function markItemWontFix(id) {
  const item = getItems().find((i) => i.id === id);
  if (!item || item.section !== 'backlog') return;
  const ok = window.confirm(
    `Mark ${id} as won't fix? Its backlog row will be removed and moved to the Deferred / won't fix section in ROADMAP.md.`
  );
  if (!ok) return;
  if (!roadmapMarkdown) {
    setSyncStatus(
      'ROADMAP.md is not loaded yet. Serve the repo over HTTP (see AGENTS.md) or use Save to ROADMAP.md after it loads.',
      'warn'
    );
    return;
  }
  roadmapMarkdown = moveBacklogItemToWontFixMarkdown(roadmapMarkdown, id);
  nextIds.delete(id);
  saveNext();
  updateRoadmapDownload();
  refreshNextUi();
  await persistRoadmapMarkdown({ allowPrompt: true });
}

function loadNext() {
  try {
    const raw = localStorage.getItem(STORAGE_NEXT);
    const parsed = raw ? JSON.parse(raw) : [];
    nextIds = new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    nextIds = new Set();
  }
}

function saveNext() {
  localStorage.setItem(STORAGE_NEXT, JSON.stringify([...nextIds]));
  updateRoadmapDownload();
}

function setSyncStatus(message, kind = '') {
  const el = document.getElementById('syncStatus');
  if (!el) return;
  el.className = `sync-status${kind ? ` sync-status-${kind}` : ''}`;
  el.textContent = message;
}

function splitMarkdownRow(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return null;
  return trimmed.slice(1, -1).split('|').map((cell) => cell.trim());
}

function formatMarkdownRow(cells) {
  return `| ${cells.join(' | ')} |`;
}

function isMarkdownSeparator(cells) {
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function normalizeHeaderCell(cell) {
  return cell.replace(/\s+/g, ' ').trim().toLowerCase();
}

function findBacklogTable(lines) {
  let inBacklog = false;
  for (let i = 0; i < lines.length; i += 1) {
    if (/^##\s+Backlog\b/.test(lines[i])) {
      inBacklog = true;
      continue;
    }
    if (inBacklog && /^##\s+/.test(lines[i])) break;
    if (!inBacklog) continue;

    const cells = splitMarkdownRow(lines[i]);
    if (!cells) continue;
    const headers = cells.map(normalizeHeaderCell);
    if (headers.includes('id') && headers.includes('category') && headers.includes('title') && headers.includes('status')) {
      return { headerIndex: i };
    }
  }
  return null;
}

function isNextMarker(value) {
  return ['next', 'yes', 'true', 'x', '1', 'star', '★'].includes(String(value || '').trim().toLowerCase());
}

function dataStartIndex(lines, headerIndex) {
  const maybeSeparator = splitMarkdownRow(lines[headerIndex + 1] || '');
  return maybeSeparator && isMarkdownSeparator(maybeSeparator) ? headerIndex + 2 : headerIndex + 1;
}

function parseNextIdsFromMarkdown(markdown) {
  const ids = new Set();
  const lines = markdown.split(/\r?\n/);
  const table = findBacklogTable(lines);
  if (!table) return { hasNextColumn: false, ids };

  const headerCells = splitMarkdownRow(lines[table.headerIndex]) || [];
  const headers = headerCells.map(normalizeHeaderCell);
  const idIndex = headers.indexOf('id');
  const nextIndex = headers.indexOf('next');
  const hasNextColumn = nextIndex !== -1;
  if (!hasNextColumn || idIndex === -1) return { hasNextColumn, ids };

  for (let i = dataStartIndex(lines, table.headerIndex); i < lines.length; i += 1) {
    const cells = splitMarkdownRow(lines[i]);
    if (!cells) break;
    if (isMarkdownSeparator(cells)) continue;
    const id = cells[idIndex];
    if (/^AT-\d{3}$/.test(id) && isNextMarker(cells[nextIndex])) {
      ids.add(id);
    }
  }
  return { hasNextColumn, ids };
}

function updateMarkdownNextColumn(markdown, ids) {
  const lines = markdown.split(/\r?\n/);
  const table = findBacklogTable(lines);
  if (!table) return markdown;

  let headerCells = splitMarkdownRow(lines[table.headerIndex]) || [];
  let headers = headerCells.map(normalizeHeaderCell);
  let idIndex = headers.indexOf('id');
  let nextIndex = headers.indexOf('next');
  if (idIndex === -1) return markdown;

  if (nextIndex === -1) {
    headerCells.splice(0, 0, 'Next');
    lines[table.headerIndex] = formatMarkdownRow(headerCells);
    const separatorCells = splitMarkdownRow(lines[table.headerIndex + 1] || '');
    if (separatorCells && isMarkdownSeparator(separatorCells)) {
      separatorCells.splice(0, 0, '------');
      lines[table.headerIndex + 1] = formatMarkdownRow(separatorCells);
    }
    headers = headerCells.map(normalizeHeaderCell);
    idIndex = headers.indexOf('id');
    nextIndex = headers.indexOf('next');
  }

  const width = headerCells.length;
  for (let i = dataStartIndex(lines, table.headerIndex); i < lines.length; i += 1) {
    const cells = splitMarkdownRow(lines[i]);
    if (!cells) break;
    if (isMarkdownSeparator(cells)) continue;
    while (cells.length < width) cells.push('');
    const id = cells[idIndex];
    if (/^AT-\d{3}$/.test(id)) {
      cells[nextIndex] = ids.has(id) ? 'next' : '';
      lines[i] = formatMarkdownRow(cells);
    }
  }
  return lines.join('\n');
}

function updateRoadmapDownload() {
  const link = document.getElementById('btnDownloadRoadmap');
  if (!link) return;
  if (roadmapDownloadUrl) URL.revokeObjectURL(roadmapDownloadUrl);
  roadmapDownloadUrl = '';

  if (!roadmapMarkdown) {
    link.removeAttribute('href');
    link.removeAttribute('download');
    link.setAttribute('aria-disabled', 'true');
    return;
  }

  const updated = updateMarkdownNextColumn(roadmapMarkdown, nextIds);
  roadmapDownloadUrl = URL.createObjectURL(new Blob([updated], { type: 'text/markdown' }));
  link.href = roadmapDownloadUrl;
  link.download = 'ROADMAP.md';
  link.setAttribute('aria-disabled', 'false');
}

function refreshNextUi() {
  displayItems = roadmapMarkdown ? buildDisplayItemsFromMarkdown(roadmapMarkdown, ROADMAP_ITEMS) : null;
  renderTables();
  renderNextPanel();
  syncPillUI();
  applyFilters();
}

async function loadRoadmapMarkdown() {
  try {
    const response = await fetch(ROADMAP_PATH, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    roadmapMarkdown = await response.text();
    const parsed = parseNextIdsFromMarkdown(roadmapMarkdown);
    if (parsed.hasNextColumn) {
      nextIds = parsed.ids;
      saveNext();
      refreshNextUi();
      setSyncStatus('Synced from ROADMAP.md (Delivered vs Backlog + Next column). ★ edits can be saved.', 'ok');
    } else {
      refreshNextUi();
      updateRoadmapDownload();
      setSyncStatus('Loaded ROADMAP.md. Saving Next will add the Next column.', 'warn');
    }
  } catch (_err) {
    roadmapMarkdown = '';
    displayItems = null;
    updateRoadmapDownload();
    setSyncStatus('Could not load ROADMAP.md; showing embedded data until fetch works or you attach a local file.', 'warn');
    refreshNextUi();
  }
}

function canUseFilePicker() {
  return typeof window.showOpenFilePicker === 'function';
}

async function chooseRoadmapFile() {
  if (!canUseFilePicker()) {
    throw new Error('This browser cannot save directly to local files.');
  }

  const [handle] = await window.showOpenFilePicker({
    multiple: false,
    types: [{ description: 'Markdown files', accept: { 'text/markdown': ['.md'] } }],
  });
  roadmapFileHandle = handle;
  const file = await handle.getFile();
  roadmapMarkdown = await file.text();

  const parsed = parseNextIdsFromMarkdown(roadmapMarkdown);
  if (parsed.hasNextColumn) {
    nextIds = parsed.ids;
    saveNext();
  }

  updateRoadmapDownload();
  refreshNextUi();
  return handle;
}

async function writeRoadmapMarkdown() {
  if (!roadmapFileHandle) return false;
  const updated = updateMarkdownNextColumn(roadmapMarkdown, nextIds);
  const writable = await roadmapFileHandle.createWritable();
  await writable.write(updated);
  await writable.close();
  roadmapMarkdown = updated;
  updateRoadmapDownload();
  refreshNextUi();
  setSyncStatus('Saved ROADMAP.md (Delivered, backlog, deferred edits + Next column).', 'ok');
  return true;
}

async function persistRoadmapMarkdown({ allowPrompt = false } = {}) {
  updateRoadmapDownload();
  if (!roadmapMarkdown && !allowPrompt) {
    setSyncStatus('ROADMAP.md is not loaded yet. Use the download fallback once it finishes loading.', 'warn');
    return;
  }

  if (!roadmapFileHandle) {
    if (allowPrompt && canUseFilePicker()) {
      setSyncStatus('Select ROADMAP.md to save your changes.', '');
      try {
        await chooseRoadmapFile();
      } catch (err) {
        if (err && err.name === 'AbortError') {
          setSyncStatus('Changes are in this browser only. Select ROADMAP.md or download the file to update the repo.', 'warn');
        } else {
          setSyncStatus('Could not open ROADMAP.md. Use the download fallback to update the file.', 'error');
        }
        return;
      }
    } else {
      setSyncStatus(canUseFilePicker()
        ? 'Use Save to ROADMAP.md or download to persist changes.'
        : 'Use the download fallback to update ROADMAP.md.', 'warn');
      return;
    }
  }

  try {
    await writeRoadmapMarkdown();
  } catch (err) {
    setSyncStatus('Could not write ROADMAP.md. Use the download fallback to replace the file.', 'error');
  }
}

async function saveRoadmapNow() {
  try {
    await chooseRoadmapFile();
    await writeRoadmapMarkdown();
  } catch (err) {
    if (err && err.name === 'AbortError') {
      setSyncStatus('Save canceled.', 'warn');
    } else {
      setSyncStatus(canUseFilePicker()
        ? 'Could not save ROADMAP.md. Use the download fallback to replace the file.'
        : 'Direct file save is unavailable in this browser. Use the download fallback to update ROADMAP.md.', 'error');
    }
  }
}

function slugLabel(value) {
  return String(value).replace(/\s+/g, '-');
}

function tagClass(kind, value) {
  if (!value) return 'tag';
  return `tag tag-${kind}-${slugLabel(value)}`;
}

function cycleFilter(key) {
  const cur = filterState[key] || 'neutral';
  filterState[key] = cur === 'neutral' ? 'include' : cur === 'include' ? 'exclude' : 'neutral';
  syncPillUI();
  applyFilters();
}

function syncPillUI() {
  document.querySelectorAll('[data-filter-key]').forEach((el) => {
    const key = el.dataset.filterKey;
    const state = filterState[key] || 'neutral';
    el.classList.remove('state-include', 'state-exclude');
    if (state === 'include') el.classList.add('state-include');
    if (state === 'exclude') el.classList.add('state-exclude');
  });
  document.getElementById('btnNextOnly').classList.toggle('active', nextOnly);
}

function matchesDimension(value, prefix) {
  const includes = [];
  const excludes = [];
  for (const [key, state] of Object.entries(filterState)) {
    if (!key.startsWith(prefix + ':') || state === 'neutral') continue;
    const v = key.slice(prefix.length + 1);
    if (state === 'include') includes.push(v);
    if (state === 'exclude') excludes.push(v);
  }
  const v = value || '';
  if (excludes.includes(v)) return false;
  if (includes.length && !includes.includes(v)) return false;
  return true;
}

function itemVisible(item, query) {
  if (nextOnly && item.section === 'backlog' && !nextIds.has(item.id)) return false;
  if (nextOnly && item.section !== 'backlog') return false;
  if (!matchesDimension(item.category, 'cat')) return false;
  if (!matchesDimension(item.status, 'st')) return false;
  if (item.section === 'backlog' && item.priority && !matchesDimension(item.priority, 'pr')) return false;
  if (item.section === 'backlog' && !item.priority) {
    const prIncludes = Object.entries(filterState).some(([k, s]) => k.startsWith('pr:') && s === 'include');
    if (prIncludes) return false;
  }
  if (query) {
    const hay = [item.id, item.title, item.notes, item.source, item.category, item.status, item.priority].join(' ').toLowerCase();
    if (!hay.includes(query)) return false;
  }
  return true;
}

function renderPills(containerId, prefix, values) {
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  values.forEach((v) => {
    const key = `${prefix}:${v}`;
    filterState[key] = filterState[key] || 'neutral';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pill';
    btn.dataset.filterKey = key;
    btn.textContent = v;
    btn.addEventListener('click', () => cycleFilter(key));
    el.appendChild(btn);
  });
}

function toggleNext(id) {
  if (nextIds.has(id)) nextIds.delete(id);
  else nextIds.add(id);
  saveNext();
  persistRoadmapMarkdown({ allowPrompt: true });
  renderNextPanel();
  applyFilters();
  document.querySelectorAll(`[data-next-id="${id}"]`).forEach((btn) => {
    btn.classList.toggle('on', nextIds.has(id));
    btn.setAttribute('aria-pressed', nextIds.has(id) ? 'true' : 'false');
  });
  document.querySelectorAll(`tr[data-id="${id}"]`).forEach((tr) => {
    tr.classList.toggle('row-next', nextIds.has(id));
  });
}

function renderNextPanel() {
  const list = document.getElementById('nextList');
  const backlogNext = getItems().filter((i) => i.section === 'backlog' && nextIds.has(i.id));
  if (!backlogNext.length) {
    list.innerHTML = '<span class="next-empty">No items queued yet.</span>';
    return;
  }
  list.innerHTML = backlogNext.map((i) => `
    <span class="next-chip">
      <strong>${i.id}</strong> ${escapeHtml(i.title)}
      <button type="button" aria-label="Remove ${i.id} from next" data-remove-next="${i.id}">×</button>
    </span>
  `).join('');
  list.querySelectorAll('[data-remove-next]').forEach((btn) => {
    btn.addEventListener('click', () => toggleNext(btn.dataset.removeNext));
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderTables() {
  const tbodyB = document.getElementById('tbodyBacklog');
  const tbodyD = document.getElementById('tbodyDelivered');
  const tbodyX = document.getElementById('tbodyDeferred');

  tbodyB.innerHTML = sortItemRows(getItems().filter((i) => i.section === 'backlog')).map((i) => {
    const on = nextIds.has(i.id);
    return `<tr data-id="${i.id}" class="${on ? 'row-next' : ''}">
      <td><button type="button" class="next-btn ${on ? 'on' : ''}" data-next-id="${i.id}" aria-pressed="${on}" title="Add to next">★</button></td>
      <td><button type="button" class="deliver-btn" data-deliver-id="${i.id}" aria-label="Mark ${i.id} delivered" title="Mark delivered">✓</button></td>
      <td><button type="button" class="wontfix-btn" data-wontfix-id="${i.id}" aria-label="Mark ${i.id} won't fix" title="Mark won't fix">×</button></td>
      <td class="id-cell">${i.id}</td>
      <td><span class="${tagClass('cat', i.category)}">${escapeHtml(i.category)}</span></td>
      <td>${escapeHtml(i.title)}</td>
      <td><span class="${tagClass('st', i.status)}">${escapeHtml(i.status)}</span></td>
      <td>${i.priority ? `<span class="${tagClass('pr', i.priority)}">${escapeHtml(i.priority)}</span>` : '—'}</td>
      <td>${escapeHtml(i.source)}</td>
      <td class="notes-cell">${escapeHtml(i.notes)}</td>
    </tr>`;
  }).join('');

  tbodyD.innerHTML = sortItemRows(getItems().filter((i) => i.section === 'delivered')).map((i) => `
    <tr data-id="${i.id}">
      <td class="id-cell">${i.id}</td>
      <td><span class="${tagClass('cat', i.category)}">${escapeHtml(i.category)}</span></td>
      <td>${escapeHtml(i.title)}</td>
      <td><span class="${tagClass('st', i.status)}">${escapeHtml(i.status)}</span></td>
      <td>${escapeHtml(i.delivered)}</td>
      <td class="notes-cell">${escapeHtml(i.notes)}</td>
    </tr>
  `).join('');

  const deferred = sortItemRows(getItems().filter((i) => i.section === 'deferred'));
  if (!deferred.length) {
    tbodyX.innerHTML = '<tr><td colspan="5" class="empty-section">Nothing deferred yet.</td></tr>';
  } else {
    tbodyX.innerHTML = deferred.map((i) => `
      <tr data-id="${i.id}">
        <td class="id-cell">${i.id}</td>
        <td><span class="${tagClass('cat', i.category)}">${escapeHtml(i.category)}</span></td>
        <td>${escapeHtml(i.title)}</td>
        <td><span class="${tagClass('st', i.status)}">${escapeHtml(i.status)}</span></td>
        <td class="notes-cell">${escapeHtml(i.notes)}</td>
      </tr>
    `).join('');
  }

  document.querySelectorAll('[data-next-id]').forEach((btn) => {
    btn.addEventListener('click', () => toggleNext(btn.dataset.nextId));
  });
  document.querySelectorAll('[data-deliver-id]').forEach((btn) => {
    btn.addEventListener('click', () => markItemDelivered(btn.dataset.deliverId));
  });
  document.querySelectorAll('[data-wontfix-id]').forEach((btn) => {
    btn.addEventListener('click', () => markItemWontFix(btn.dataset.wontfixId));
  });
}

function applyFilters() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  let visible = 0;
  let total = 0;

  document.querySelectorAll('tbody tr[data-id]').forEach((row) => {
    const id = row.dataset.id;
    const item = getItems().find((i) => i.id === id);
    if (!item) return;
    total += 1;
    const show = itemVisible(item, query);
    row.classList.toggle('hidden', !show);
    if (show) visible += 1;
  });

  document.getElementById('visibleCount').textContent = `${visible} of ${total} rows visible`;
  const bVis = getItems().filter((i) => i.section === 'backlog' && itemVisible(i, query)).length;
  const bTot = getItems().filter((i) => i.section === 'backlog').length;
  document.getElementById('backlogCount').textContent = `${bVis} / ${bTot} shown`;
  const dVis = getItems().filter((i) => i.section === 'delivered' && itemVisible(i, query)).length;
  const dTot = getItems().filter((i) => i.section === 'delivered').length;
  document.getElementById('deliveredCount').textContent = `${dVis} / ${dTot} shown`;
  const xVis = getItems().filter((i) => i.section === 'deferred' && itemVisible(i, query)).length;
  const xTot = getItems().filter((i) => i.section === 'deferred').length;
  const deferredCountEl = document.getElementById('deferredCount');
  if (deferredCountEl) deferredCountEl.textContent = `${xVis} / ${xTot} shown`;
}

function resetFilters() {
  Object.keys(filterState).forEach((k) => { filterState[k] = 'neutral'; });
  nextOnly = false;
  syncPillUI();
  applyFilters();
}

loadNext();
renderPills('pillsCategory', 'cat', CATEGORIES);
renderPills('pillsStatus', 'st', STATUSES);
renderPills('pillsPriority', 'pr', PRIORITIES);
renderTables();
renderNextPanel();
syncPillUI();
applyFilters();
loadRoadmapMarkdown();

document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('btnResetFilters').addEventListener('click', resetFilters);
document.getElementById('btnSelectRoadmap').addEventListener('click', saveRoadmapNow);
document.getElementById('btnNextOnly').addEventListener('click', () => {
  nextOnly = !nextOnly;
  syncPillUI();
  applyFilters();
});
