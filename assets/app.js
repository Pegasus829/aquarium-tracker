function showGate() {
  document.getElementById('gate')?.classList.remove('gate-hidden');
  document.getElementById('app')?.classList.remove('app-visible');
}

function showApp() {
  document.getElementById('gate')?.classList.add('gate-hidden');
  document.getElementById('app')?.classList.add('app-visible');
}

function isAppVisible() {
  return document.getElementById('app')?.classList.contains('app-visible') === true;
}

function isGateHidden() {
  return document.getElementById('gate')?.classList.contains('gate-hidden') === true;
}

function setChartHasData(canvasId, hasData) {
  const canvas = document.getElementById(canvasId);
  const wrap = canvas?.closest('.chart-canvas-wrap');
  if (wrap) wrap.classList.toggle('chart-has-data', hasData);
}

function wireAppEventListeners() {
  document.getElementById('profileButton')?.addEventListener('click', openProfilePage);
  document.getElementById('tap-feature-toggle')?.addEventListener('change', (e) => {
    setTapFeatureEnabled(e.target.checked);
  });
  document.querySelector('.btn-add:not(.tap-btn)')?.addEventListener('click', addReading);
  document.querySelector('.btn-add.tap-btn')?.addEventListener('click', addTapReading);
  document.getElementById('profilePage')?.addEventListener('click', onProfileBackdropClick);
  document.querySelector('.profile-save-btn')?.addEventListener('click', saveProfile);
  document.querySelector('.profile-close-btn')?.addEventListener('click', closeProfilePage);
  document.querySelector('.avatar-preview')?.addEventListener('click', triggerAvatarUpload);
  document.querySelectorAll('.avatar-option[data-avatar-emoji]').forEach((btn) => {
    btn.addEventListener('click', () => selectAvatarEmoji(btn.getAttribute('data-avatar-emoji')));
  });
  document.querySelectorAll('.avatar-action-btn').forEach((btn) => {
    if (btn.id === 'removeAvatarImageBtn') btn.addEventListener('click', removeAvatarImage);
    else btn.addEventListener('click', triggerAvatarUpload);
  });
  document.getElementById('profileAvatarFile')?.addEventListener('change', handleAvatarUpload);
  document.querySelector('.profile-logout-btn')?.addEventListener('click', logOut);
  document
    .querySelector('#confirmModal .modal-btn-secondary')
    ?.addEventListener('click', closeConfirmModal);
  document
    .getElementById('confirmModalConfirmBtn')
    ?.addEventListener('click', runConfirmModalAction);
  document
    .querySelector('#editTankModal .modal-btn-secondary')
    ?.addEventListener('click', closeEditTankModal);
  document
    .querySelector('#editTankModal .modal-btn-primary')
    ?.addEventListener('click', saveEditTankReading);
  document
    .querySelector('#editTapModal .modal-btn-secondary')
    ?.addEventListener('click', closeEditTapModal);
  document
    .querySelector('#editTapModal .modal-btn-primary')
    ?.addEventListener('click', saveEditTapReading);
}

function wqtMergedConfig() {
  return Object.assign({}, window.WQT_CONFIG || {}, window.WQT_LOCAL_CONFIG || {});
}
const _wqtCfg = wqtMergedConfig();
// API Gateway base URL (no trailing slash). Data/auth endpoints require Authorization.
const API_BASE_URL = (_wqtCfg.apiBaseUrl || '').trim();
// Fill via .env + scripts/generate-local-config.mjs, or leave blank for GET /auth/config.
const COGNITO_DOMAIN = (_wqtCfg.cognitoDomain || '').trim();
const COGNITO_CLIENT_ID = (_wqtCfg.cognitoClientId || '').trim();
const COGNITO_SCOPES =
  (_wqtCfg.cognitoScopes || 'openid email profile').trim() || 'openid email profile';
var authConfig = { domain: COGNITO_DOMAIN, clientId: COGNITO_CLIENT_ID, scopes: COGNITO_SCOPES };
const TOKEN_STORAGE_KEY = 'wqt_token';
const ID_TOKEN_STORAGE_KEY = 'wqt_id_token';
const COGNITO_PKCE_VERIFIER_KEY = 'wqt_pkce_verifier';
const COGNITO_OAUTH_STATE_KEY = 'wqt_oauth_state';
const DEFAULT_AVATAR_EMOJI = '👤';
const AVATAR_EMOJIS = [DEFAULT_AVATAR_EMOJI, '🐠', '🐟', '🐡', '🐙', '🦐'];
const AVATAR_UPLOAD_MAX_BYTES = 6 * 1024 * 1024;
const AVATAR_IMAGE_MAX_CHARS = 220000;

function defaultProfile() {
  return {
    userName: 'Aquarist',
    aquariumName: 'Fluval Flex 2.0',
    aquariumSize: 57,
    aquariumUnits: 'litres',
    avatar: { type: 'emoji', emoji: DEFAULT_AVATAR_EMOJI, imageDataUrl: '' },
    settings: { trackTapWater: true },
    safeZones: {
      kh: { min: 2, max: 6 },
      ph: { min: 6.5, max: 7.0 },
      nh3: { min: 0, max: 0.25 },
      no2: { min: 0, max: 0.25 },
      no3: { min: 0, max: 20 },
    },
  };
}

function sanitizeRange(raw, fallback, minCap, maxCap) {
  const rawMin = Number(raw?.min);
  const rawMax = Number(raw?.max);
  let min = Number.isFinite(rawMin) ? rawMin : fallback.min;
  let max = Number.isFinite(rawMax) ? rawMax : fallback.max;
  min = Math.max(minCap, Math.min(maxCap, min));
  max = Math.max(minCap, Math.min(maxCap, max));
  if (min > max) [min, max] = [max, min];
  return { min, max };
}

function isSafeAvatarImageDataUrl(value) {
  return (
    typeof value === 'string' &&
    value.length <= AVATAR_IMAGE_MAX_CHARS &&
    /^data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/.test(value)
  );
}

function normalizeAvatar(raw = {}) {
  const emoji = AVATAR_EMOJIS.includes(raw?.emoji) ? raw.emoji : DEFAULT_AVATAR_EMOJI;
  const imageDataUrl = isSafeAvatarImageDataUrl(raw?.imageDataUrl) ? raw.imageDataUrl : '';
  return {
    type: raw?.type === 'image' && imageDataUrl ? 'image' : 'emoji',
    emoji,
    imageDataUrl,
  };
}

function normalizeProfile(raw = {}) {
  const defaults = defaultProfile();
  return {
    userName:
      typeof raw.userName === 'string' && raw.userName.trim()
        ? raw.userName.trim()
        : defaults.userName,
    aquariumName:
      typeof raw.aquariumName === 'string' && raw.aquariumName.trim()
        ? raw.aquariumName.trim()
        : defaults.aquariumName,
    aquariumSize: Number.isFinite(Number(raw.aquariumSize))
      ? Number(raw.aquariumSize)
      : defaults.aquariumSize,
    aquariumUnits: raw.aquariumUnits === 'gallons' ? 'gallons' : 'litres',
    avatar: normalizeAvatar(raw.avatar),
    settings: {
      trackTapWater:
        typeof raw.settings?.trackTapWater === 'boolean'
          ? raw.settings.trackTapWater
          : defaults.settings.trackTapWater,
    },
    safeZones: {
      kh: sanitizeRange(raw.safeZones?.kh, defaults.safeZones.kh, 0, 30),
      ph: sanitizeRange(raw.safeZones?.ph, defaults.safeZones.ph, 0, 14),
      nh3: sanitizeRange(raw.safeZones?.nh3, defaults.safeZones.nh3, 0, 500),
      no2: sanitizeRange(raw.safeZones?.no2, defaults.safeZones.no2, 0, 500),
      no3: sanitizeRange(raw.safeZones?.no3, defaults.safeZones.no3, 0, 500),
    },
  };
}

async function saveProfileToApi(silent = false) {
  try {
    const res = await apiFetch('/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
    if (!res.ok) {
      if (!silent) showToast('Could not save profile');
      return false;
    }
    const saved = await res.json().catch(() => null);
    if (saved && typeof saved === 'object') {
      profile = normalizeProfile(saved);
    }
    return true;
  } catch {
    if (!silent) showToast('Could not save profile');
    return false;
  }
}

function formatRangeValue(value, decimals = 2) {
  if (!Number.isFinite(value)) return '0';
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(decimals).replace(/\.?0+$/, '');
}

function getNo3WarningRange(safeZone = profile.safeZones.no3) {
  const min = safeZone.max;
  const max = Math.max(min + 20, min * 2);
  return { min, max };
}

function getKhWarningRange(safeZone = profile.safeZones.kh) {
  return {
    min: Math.max(0, safeZone.min - 1),
    max: safeZone.max + 2,
  };
}

function getPhWarningRange(safeZone = profile.safeZones.ph) {
  return {
    min: Math.max(0, safeZone.min - 0.3),
    max: Math.min(14, safeZone.max + 0.5),
  };
}

function updateChartRangeLabels() {
  const kh = profile.safeZones.kh;
  const ph = profile.safeZones.ph;
  const nh3 = profile.safeZones.nh3;
  const no2 = profile.safeZones.no2;
  const no3 = profile.safeZones.no3;
  const no3Warn = getNo3WarningRange(no3);

  const rangeKh = document.getElementById('range-kh');
  if (rangeKh)
    rangeKh.textContent = `Target: ${formatRangeValue(kh.min, 1)}-${formatRangeValue(kh.max, 1)} dKH`;

  const rangePh = document.getElementById('range-ph');
  if (rangePh)
    rangePh.textContent = `Target: ${formatRangeValue(ph.min, 1)}-${formatRangeValue(ph.max, 1)}`;

  const rangeNh3 = document.getElementById('range-nh3');
  if (rangeNh3) {
    rangeNh3.textContent =
      nh3.min === 0 && nh3.max === 0
        ? 'Target: 0 ppm'
        : `Safe: ${formatRangeValue(nh3.min)}-${formatRangeValue(nh3.max)} ppm`;
  }

  const rangeNo2 = document.getElementById('range-no2');
  if (rangeNo2) {
    rangeNo2.textContent =
      no2.min === 0 && no2.max === 0
        ? 'Target: 0 ppm'
        : `Safe: ${formatRangeValue(no2.min)}-${formatRangeValue(no2.max)} ppm`;
  }

  const rangeNo3 = document.getElementById('range-no3');
  if (rangeNo3) {
    rangeNo3.textContent = `Safe: ${formatRangeValue(no3.min)}-${formatRangeValue(no3.max)} ppm · Warning: ${formatRangeValue(no3Warn.min)}-${formatRangeValue(no3Warn.max)} ppm`;
  }
}

function updateHeaderMeta() {
  const unitLabel = profile.aquariumUnits === 'gallons' ? 'gal' : 'L';
  const size = Number.isFinite(profile.aquariumSize)
    ? formatRangeValue(profile.aquariumSize, 1)
    : '';
  const subtitle = `${profile.aquariumName} · ${size}${unitLabel === 'L' ? 'L' : ` ${unitLabel}`}`;
  const gateSub = document.getElementById('gateSub');
  if (gateSub) gateSub.textContent = subtitle;
  const headerSub = document.getElementById('headerSub');
  if (headerSub) headerSub.textContent = subtitle;
}

function renderAvatarInto(target, avatar) {
  if (!target) return;
  const safeAvatar = normalizeAvatar(avatar);
  target.replaceChildren();
  if (safeAvatar.type === 'image') {
    const img = document.createElement('img');
    img.src = safeAvatar.imageDataUrl;
    img.alt = '';
    target.appendChild(img);
    return;
  }
  const span = document.createElement('span');
  span.className = 'avatar-emoji';
  span.textContent = safeAvatar.emoji;
  target.appendChild(span);
}

function updateHeaderAvatar() {
  renderAvatarInto(document.getElementById('profileButton'), profile.avatar);
}

function applyProfileToUI() {
  updateHeaderMeta();
  updateHeaderAvatar();
  updateChartRangeLabels();
}

function populateProfileForm() {
  profileAvatarDraft = normalizeAvatar(profile.avatar);
  updateProfileAvatarPreview();
  document.getElementById('profileUserName').value = profile.userName;
  document.getElementById('profileAquariumName').value = profile.aquariumName;
  document.getElementById('profileAquariumSize').value = profile.aquariumSize;
  document.getElementById('profileAquariumUnits').value = profile.aquariumUnits;

  document.getElementById('profileSafeKhMin').value = profile.safeZones.kh.min;
  document.getElementById('profileSafeKhMax').value = profile.safeZones.kh.max;
  document.getElementById('profileSafePhMin').value = profile.safeZones.ph.min;
  document.getElementById('profileSafePhMax').value = profile.safeZones.ph.max;
  document.getElementById('profileSafeNh3Min').value = profile.safeZones.nh3.min;
  document.getElementById('profileSafeNh3Max').value = profile.safeZones.nh3.max;
  document.getElementById('profileSafeNo2Min').value = profile.safeZones.no2.min;
  document.getElementById('profileSafeNo2Max').value = profile.safeZones.no2.max;
  document.getElementById('profileSafeNo3Min').value = profile.safeZones.no3.min;
  document.getElementById('profileSafeNo3Max').value = profile.safeZones.no3.max;
}

function openProfilePage() {
  populateProfileForm();
  const page = document.getElementById('profilePage');
  if (page) page.classList.add('show');
  document.body.classList.add('profile-open');
}

function closeProfilePage() {
  const page = document.getElementById('profilePage');
  if (page) page.classList.remove('show');
  document.body.classList.remove('profile-open');
  profileAvatarDraft = null;
}

function onProfileBackdropClick(event) {
  if (event.target.id === 'profilePage') closeProfilePage();
}

function logOut() {
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(ID_TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(COGNITO_PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(COGNITO_OAUTH_STATE_KEY);
  closeProfilePage();
  readings = [];
  tapReadings = [];
  profile = defaultProfile();
  applyProfileToUI();
  initTapFeatureToggle();
  const gateInput = document.getElementById('gateInput');
  if (gateInput) gateInput.value = '';
  const gateError = document.getElementById('gateError');
  if (gateError) gateError.textContent = '';
  showGate();
  if (isCognitoConfigured()) {
    const params = new URLSearchParams({
      client_id: authConfig.clientId,
      logout_uri: getRedirectUri(),
    });
    window.location.assign(`${authConfig.domain.replace(/\/$/, '')}/logout?${params.toString()}`);
    return;
  }
  showToast('Logged out');
}

function updateProfileAvatarPreview() {
  const avatar = normalizeAvatar(profileAvatarDraft || profile.avatar);
  const emojiEl = document.getElementById('profileAvatarEmoji');
  const imageEl = document.getElementById('profileAvatarImage');
  if (emojiEl) {
    emojiEl.textContent = avatar.emoji;
    emojiEl.hidden = avatar.type === 'image';
  }
  if (imageEl) {
    imageEl.src = avatar.type === 'image' ? avatar.imageDataUrl : '';
    imageEl.hidden = avatar.type !== 'image';
  }
  document.querySelectorAll('.avatar-option').forEach((button) => {
    const isActive = button.dataset.avatarEmoji === avatar.emoji && avatar.type !== 'image';
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-checked', isActive ? 'true' : 'false');
  });
  const removeBtn = document.getElementById('removeAvatarImageBtn');
  if (removeBtn) removeBtn.disabled = avatar.type !== 'image';
}

function selectAvatarEmoji(emoji) {
  const safeEmoji = AVATAR_EMOJIS.includes(emoji) ? emoji : DEFAULT_AVATAR_EMOJI;
  profileAvatarDraft = { type: 'emoji', emoji: safeEmoji, imageDataUrl: '' };
  updateProfileAvatarPreview();
}

function removeAvatarImage() {
  const avatar = normalizeAvatar(profileAvatarDraft || profile.avatar);
  profileAvatarDraft = { type: 'emoji', emoji: avatar.emoji, imageDataUrl: '' };
  updateProfileAvatarPreview();
}

function triggerAvatarUpload() {
  const input = document.getElementById('profileAvatarFile');
  if (input) input.click();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read image'));
    reader.readAsDataURL(file);
  });
}

function loadAvatarImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not load image'));
    image.src = src;
  });
}

async function resizeAvatarImage(file) {
  const source = await readFileAsDataUrl(file);
  const image = await loadAvatarImage(source);
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const sourceSize = Math.min(sourceWidth, sourceHeight);
  if (!sourceSize) throw new Error('Invalid image dimensions');

  const outputSize = 256;
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable');

  ctx.drawImage(
    image,
    (sourceWidth - sourceSize) / 2,
    (sourceHeight - sourceSize) / 2,
    sourceSize,
    sourceSize,
    0,
    0,
    outputSize,
    outputSize
  );

  const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
  if (!isSafeAvatarImageDataUrl(dataUrl)) throw new Error('Avatar image is too large');
  return dataUrl;
}

async function handleAvatarUpload(event) {
  const input = event.target;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    showToast('Use a JPG, PNG, or WebP image');
    return;
  }
  if (file.size > AVATAR_UPLOAD_MAX_BYTES) {
    showToast('Avatar image must be under 6 MB');
    return;
  }

  try {
    const avatar = normalizeAvatar(profileAvatarDraft || profile.avatar);
    profileAvatarDraft = {
      type: 'image',
      emoji: avatar.emoji,
      imageDataUrl: await resizeAvatarImage(file),
    };
    updateProfileAvatarPreview();
    showToast('Avatar ready to save');
  } catch {
    showToast('Could not use avatar image');
  }
}

async function saveProfile() {
  const nextProfile = {
    userName: document.getElementById('profileUserName').value.trim() || profile.userName,
    aquariumName:
      document.getElementById('profileAquariumName').value.trim() || profile.aquariumName,
    aquariumSize: Number(document.getElementById('profileAquariumSize').value),
    aquariumUnits:
      document.getElementById('profileAquariumUnits').value === 'gallons' ? 'gallons' : 'litres',
    avatar: normalizeAvatar(profileAvatarDraft || profile.avatar),
    safeZones: {
      kh: {
        min: Number(document.getElementById('profileSafeKhMin').value),
        max: Number(document.getElementById('profileSafeKhMax').value),
      },
      ph: {
        min: Number(document.getElementById('profileSafePhMin').value),
        max: Number(document.getElementById('profileSafePhMax').value),
      },
      nh3: {
        min: Number(document.getElementById('profileSafeNh3Min').value),
        max: Number(document.getElementById('profileSafeNh3Max').value),
      },
      no2: {
        min: Number(document.getElementById('profileSafeNo2Min').value),
        max: Number(document.getElementById('profileSafeNo2Max').value),
      },
      no3: {
        min: Number(document.getElementById('profileSafeNo3Min').value),
        max: Number(document.getElementById('profileSafeNo3Max').value),
      },
    },
  };
  const defaults = defaultProfile();
  profile = {
    userName: nextProfile.userName,
    aquariumName: nextProfile.aquariumName,
    aquariumSize: Number.isFinite(nextProfile.aquariumSize)
      ? nextProfile.aquariumSize
      : defaults.aquariumSize,
    aquariumUnits: nextProfile.aquariumUnits,
    avatar: nextProfile.avatar,
    settings: {
      trackTapWater: profile.settings?.trackTapWater !== false,
    },
    safeZones: {
      kh: sanitizeRange(nextProfile.safeZones.kh, defaults.safeZones.kh, 0, 30),
      ph: sanitizeRange(nextProfile.safeZones.ph, defaults.safeZones.ph, 0, 14),
      nh3: sanitizeRange(nextProfile.safeZones.nh3, defaults.safeZones.nh3, 0, 500),
      no2: sanitizeRange(nextProfile.safeZones.no2, defaults.safeZones.no2, 0, 500),
      no3: sanitizeRange(nextProfile.safeZones.no3, defaults.safeZones.no3, 0, 500),
    },
  };

  const saved = await saveProfileToApi();
  if (!saved) return;
  applyProfileToUI();
  setTapFeatureEnabled(profile.settings.trackTapWater !== false, false);
  render();
  closeProfilePage();
  showToast('Profile updated ✓');
}

function isCognitoConfigured() {
  return Boolean(authConfig.domain.trim() && authConfig.clientId.trim());
}

function getRedirectUri() {
  return window.location.origin + window.location.pathname;
}

async function loadAuthConfig() {
  authConfig = {
    domain: COGNITO_DOMAIN.trim(),
    clientId: COGNITO_CLIENT_ID.trim(),
    scopes: COGNITO_SCOPES,
  };
  if (isCognitoConfigured() || !API_BASE_URL.trim()) return;
  try {
    const res = await fetch(API_BASE_URL + '/auth/config');
    if (!res.ok) return;
    const data = await res.json();
    const cognito = data?.cognito || {};
    authConfig = {
      domain: typeof cognito.domain === 'string' ? cognito.domain.trim() : '',
      clientId: typeof cognito.clientId === 'string' ? cognito.clientId.trim() : '',
      scopes:
        typeof cognito.scopes === 'string' && cognito.scopes.trim()
          ? cognito.scopes
          : COGNITO_SCOPES,
    };
  } catch {
    authConfig = { domain: '', clientId: '', scopes: COGNITO_SCOPES };
  }
}

function base64UrlFromBytes(bytes) {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256Base64Url(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return base64UrlFromBytes(new Uint8Array(digest));
}

function randomBase64Url(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlFromBytes(bytes);
}

async function startCognitoSignIn() {
  if (!isCognitoConfigured()) return false;
  const verifier = randomBase64Url(64);
  const state = randomBase64Url(24);
  sessionStorage.setItem(COGNITO_PKCE_VERIFIER_KEY, verifier);
  sessionStorage.setItem(COGNITO_OAUTH_STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: authConfig.clientId,
    response_type: 'code',
    scope: authConfig.scopes,
    redirect_uri: getRedirectUri(),
    state,
    code_challenge_method: 'S256',
    code_challenge: await sha256Base64Url(verifier),
  });
  window.location.assign(
    `${authConfig.domain.replace(/\/$/, '')}/oauth2/authorize?${params.toString()}`
  );
  return true;
}

async function exchangeCognitoCode(code) {
  const verifier = sessionStorage.getItem(COGNITO_PKCE_VERIFIER_KEY);
  if (!verifier) throw new Error('Missing sign-in verifier');
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: authConfig.clientId,
    code,
    redirect_uri: getRedirectUri(),
    code_verifier: verifier,
  });
  const res = await fetch(`${authConfig.domain.replace(/\/$/, '')}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token)
    throw new Error(data.error_description || 'Token exchange failed');
  sessionStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
  if (data.id_token) sessionStorage.setItem(ID_TOKEN_STORAGE_KEY, data.id_token);
  sessionStorage.removeItem(COGNITO_PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(COGNITO_OAUTH_STATE_KEY);
}

async function handleCognitoRedirect() {
  if (!isCognitoConfigured()) return false;
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code) return false;
  const expectedState = sessionStorage.getItem(COGNITO_OAUTH_STATE_KEY);
  if (!expectedState || state !== expectedState) {
    showToast('Sign-in response could not be verified');
    return false;
  }
  try {
    await exchangeCognitoCode(code);
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
    return true;
  } catch {
    sessionStorage.removeItem(COGNITO_PKCE_VERIFIER_KEY);
    sessionStorage.removeItem(COGNITO_OAUTH_STATE_KEY);
    showToast('Could not complete sign-in');
    return false;
  }
}

function initAuthUi() {
  const input = document.getElementById('gateInput');
  const button = document.querySelector('#gateForm .gate-btn');
  const hint = document.querySelector('.gate-hint');
  if (!isCognitoConfigured()) return;
  if (input) input.hidden = true;
  if (button) button.textContent = 'Sign in';
  if (hint) hint.textContent = 'Use email, password, or passkey via secure hosted sign-in';
}

function parseJwtPayload(token) {
  try {
    const p = token.split('.')[1];
    if (!p) return null;
    let b64 = p.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const payload = JSON.parse(atob(b64));
    if (payload.exp && payload.exp * 1000 <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function getValidToken() {
  const t = sessionStorage.getItem(TOKEN_STORAGE_KEY);
  if (!t || !parseJwtPayload(t)) {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(ID_TOKEN_STORAGE_KEY);
    return null;
  }
  return t;
}

function apiFetch(path, options = {}) {
  const token = sessionStorage.getItem(TOKEN_STORAGE_KEY);
  return fetch(API_BASE_URL + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(options.headers ?? {}),
    },
  });
}

let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 5000);
}

function setLoadingState(loading) {
  isDataLoading = loading;

  ['nd-ph', 'nd-nh3', 'nd-no2', 'nd-no3', 'nd-kh'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = loading ? 'Loading…' : 'No readings yet';
  });

  document.querySelectorAll('.btn-add').forEach((btn) => {
    btn.disabled = loading;
  });

  if (!loading) return;

  const tankPills = document.querySelectorAll('#statusBar .stat-pill');
  const tankLabels = ['pH', 'Ammonia', 'Nitrite', 'Nitrate', 'KH'];
  tankPills.forEach((pill, idx) => {
    pill.innerHTML = `<div class="stat-label">${tankLabels[idx]}</div><div class="stat-value c-muted">Loading…</div><div class="stat-status c-muted">Sync</div>`;
  });

  const tapPills = document.querySelectorAll('#tapStatusBar .stat-pill');
  if (tapPills[0]) {
    tapPills[0].innerHTML =
      '<div class="stat-label">Latest Filtered Tap NO₃</div><div class="stat-value c-muted">Loading…</div><div class="stat-status c-muted">Sync</div>';
  }
  if (tapPills[1]) {
    tapPills[1].innerHTML =
      '<div class="stat-label">Last Tested</div><div class="stat-value c-muted stat-value-compact">Loading…</div>';
  }

  const logCount = document.getElementById('logCount');
  if (logCount) logCount.textContent = 'Loading…';
  const tapLogCount = document.getElementById('tapLogCount');
  if (tapLogCount) tapLogCount.textContent = 'Loading…';

  const logBody = document.getElementById('logBody');
  if (logBody) logBody.innerHTML = '<div class="log-empty">Loading readings...</div>';
  const tapLogBody = document.getElementById('tapLogBody');
  if (tapLogBody) tapLogBody.innerHTML = '<div class="log-empty">Loading tap tests...</div>';
}

function showSessionExpired() {
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(ID_TOKEN_STORAGE_KEY);
  showGate();
  showToast('Session expired — sign in again');
}

async function loadJsonResource(path) {
  const res = await apiFetch(path);
  if (res.status === 401) return { unauthorized: true };
  if (!res.ok) return { ok: false };
  const data = await res.json();
  return { ok: true, data };
}

async function loadData() {
  if (!API_BASE_URL.trim()) {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(ID_TOKEN_STORAGE_KEY);
    showGate();
    showToast('Set WQT_API_BASE_URL in .env and run node scripts/generate-local-config.mjs');
    return;
  }
  setLoadingState(true);
  try {
    const readingsResult = await loadJsonResource('/readings');
    if (readingsResult.unauthorized) {
      showSessionExpired();
      return;
    }
    if (!readingsResult.ok || !Array.isArray(readingsResult.data)) {
      showToast('Could not load readings');
      return;
    }
    readings = readingsResult.data;
    readings.sort((a, b) => new Date(a.date) - new Date(b.date));

    await Promise.all([loadTapReadings(), loadProfileSettings()]);
  } catch {
    showToast('Could not load readings');
  } finally {
    setLoadingState(false);
    if (isAppVisible()) render();
  }
}

async function loadTapReadings() {
  try {
    const tapResult = await loadJsonResource('/tap');
    if (tapResult.unauthorized) {
      showSessionExpired();
      return false;
    }
    if (!tapResult.ok || !Array.isArray(tapResult.data)) {
      tapReadings = [];
      showToast('Could not load tap tests');
      return false;
    }
    tapReadings = tapResult.data;
    tapReadings.sort((a, b) => new Date(a.date) - new Date(b.date));
    return true;
  } catch {
    tapReadings = [];
    showToast('Could not load tap tests');
    return false;
  }
}

async function loadProfileSettings() {
  try {
    const profileResult = await loadJsonResource('/profile');
    if (profileResult.unauthorized) {
      showSessionExpired();
      return false;
    }
    if (!profileResult.ok) {
      showToast('Could not load profile settings');
      return false;
    }
    profile = normalizeProfile(profileResult.data || {});
    applyProfileToUI();
    setTapFeatureEnabled(profile.settings.trackTapWater !== false, false);
    return true;
  } catch {
    showToast('Could not load profile settings');
    return false;
  }
}

const GATE_AUTOFILL_SUBMIT_DELAY_MS = 300;
let gateUnlockInFlight = false;
let gateAutofillTimer = null;
let lastGateInputValue = '';

function setGateSubmitting(isSubmitting) {
  const button = document.querySelector('#gateForm .gate-btn');
  if (button) button.disabled = isSubmitting;
}

function queueGateAutofillSubmit() {
  const input = document.getElementById('gateInput');
  if (!input || !input.value || gateUnlockInFlight || isGateHidden()) return;
  clearTimeout(gateAutofillTimer);
  gateAutofillTimer = setTimeout(() => {
    if (input.value && !gateUnlockInFlight) unlock();
  }, GATE_AUTOFILL_SUBMIT_DELAY_MS);
}

function handleGatePasswordInput(event) {
  const value = event.currentTarget.value;
  const insertedLength = value.length - lastGateInputValue.length;
  lastGateInputValue = value;
  if (!value) {
    clearTimeout(gateAutofillTimer);
    return;
  }

  const inputType = event.inputType || '';
  const likelyAutofill = !inputType || inputType === 'insertReplacementText' || insertedLength > 1;
  if (likelyAutofill) queueGateAutofillSubmit();
}

function handleGatePasswordChange(event) {
  const value = event.currentTarget.value;
  const insertedLength = value.length - lastGateInputValue.length;
  lastGateInputValue = value;
  if (value && insertedLength > 1) queueGateAutofillSubmit();
}

function handleGateAutofillAnimation(event) {
  if (event.animationName !== 'gate-autofill') return;
  lastGateInputValue = event.currentTarget.value;
  queueGateAutofillSubmit();
}

function initGateForm() {
  const form = document.getElementById('gateForm');
  const input = document.getElementById('gateInput');
  if (form) form.addEventListener('submit', unlock);
  initAuthUi();
  if (isCognitoConfigured()) return;
  if (!input) return;

  lastGateInputValue = input.value;
  input.addEventListener('input', handleGatePasswordInput);
  input.addEventListener('change', handleGatePasswordChange);
  input.addEventListener('animationstart', handleGateAutofillAnimation);

  if (input.value) setTimeout(queueGateAutofillSubmit, 100);

  let pollCount = 0;
  const autofillPoll = setInterval(() => {
    pollCount += 1;
    const value = input.value;
    const insertedLength = value.length - lastGateInputValue.length;
    if (value && value !== lastGateInputValue) {
      lastGateInputValue = value;
      if (insertedLength > 1) {
        queueGateAutofillSubmit();
        clearInterval(autofillPoll);
      }
    }
    if (pollCount >= 25 || isGateHidden()) clearInterval(autofillPoll);
  }, 100);
}

async function unlock(event) {
  if (event) event.preventDefault();
  if (isCognitoConfigured()) {
    await startCognitoSignIn();
    return;
  }
  const input = document.getElementById('gateInput');
  const error = document.getElementById('gateError');
  const val = input.value;
  if (!val || gateUnlockInFlight) return;
  if (!API_BASE_URL.trim()) {
    error.textContent = 'Set WQT_API_BASE_URL in .env (see .env.example)';
    return;
  }
  error.textContent = '';
  gateUnlockInFlight = true;
  setGateSubmitting(true);
  try {
    const res = await fetch(API_BASE_URL + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: val }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      error.textContent = data.error || 'Sign-in failed';
      input.classList.add('error');
      input.value = '';
      lastGateInputValue = '';
      setTimeout(() => {
        input.classList.remove('error');
        error.textContent = '';
      }, 2000);
      return;
    }
    if (!data.token) {
      error.textContent = 'Invalid server response';
      return;
    }
    sessionStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    input.value = '';
    lastGateInputValue = '';
    showApp();
    await loadData();
  } catch {
    error.textContent = 'Cannot reach API';
    input.classList.add('error');
    setTimeout(() => {
      input.classList.remove('error');
      error.textContent = '';
    }, 2000);
  } finally {
    gateUnlockInFlight = false;
    setGateSubmitting(false);
  }
}

var profile = defaultProfile();
var profileAvatarDraft = null;
var readings = [];
var tapReadings = [];
var confirmModalAction = null;
var editingTankId = null;
var editingTapId = null;
var tapFeatureEnabled = true;
var isDataLoading = false;
var no3Chart = null;
var metricCharts = {};

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function nowLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}
document.getElementById('t-date').value = nowLocal();

function setTapFeatureEnabled(enabled, persist = true) {
  tapFeatureEnabled = enabled;
  if (!profile.settings) profile.settings = {};
  profile.settings.trackTapWater = enabled;
  const tapHeader = document.getElementById('tapSectionHeader');
  const panel = document.getElementById('tapEntryPanel');
  const legend = document.getElementById('tapLegendItem');
  const tapStatusCards = document.getElementById('tapStatusBar');
  const tapLogWrap = document.getElementById('tapLogWrap');
  const toggle = document.getElementById('tap-feature-toggle');
  [tapHeader, panel, legend, tapStatusCards, tapLogWrap].forEach((el) => {
    if (el) el.classList.toggle('tap-feature-hidden', !enabled);
  });
  if (toggle && toggle.checked !== enabled) toggle.checked = enabled;
  if (persist) saveProfileToApi(true);
  renderCharts();
}

function initTapFeatureToggle() {
  setTapFeatureEnabled(profile.settings?.trackTapWater !== false, false);
}

// ── Status helpers ──
function khStatus(v) {
  if (v == null) return ['—', 'c-muted', ''];
  const { min, max } = profile.safeZones.kh;
  const warnLow = Math.max(0, min - 1);
  const warnHigh = max + 2;
  const display = Number(v).toFixed(1);
  if (v >= min && v <= max) return [display, 'c-safe', 'GOOD'];
  if (v >= warnLow && v <= warnHigh) return [display, 'c-warn', 'WATCH'];
  return [display, 'c-danger', 'ACT'];
}
function phStatus(v) {
  if (v === null) return ['—', 'c-muted', ''];
  if (v >= 6.5 && v <= 7.2) return [v.toFixed(1), 'c-safe', 'GOOD'];
  if (v >= 6.2 && v <= 7.5) return [v.toFixed(1), 'c-warn', 'WATCH'];
  return [v.toFixed(1), 'c-danger', 'ACT'];
}
function nh3Status(v) {
  if (v === null) return ['—', 'c-muted', ''];
  if (v === 0) return ['0', 'c-safe', 'CLEAR'];
  if (v <= 0.5) return [v, 'c-warn', 'CYCLING'];
  return [v, 'c-danger', 'HIGH'];
}
function no2Status(v) {
  if (v === null) return ['—', 'c-muted', ''];
  if (v === 0) return ['0', 'c-safe', 'CLEAR'];
  if (v <= 1) return [v, 'c-warn', 'CYCLING'];
  return [v, 'c-danger', 'HIGH'];
}
function no3Status(v) {
  if (v === null) return ['—', 'c-muted', ''];
  if (v <= 20) return [v, 'c-safe', 'GOOD'];
  if (v <= 40) return [v, 'c-warn', 'CHANGE'];
  return [v, 'c-danger', 'HIGH'];
}
function tapStatus(v) {
  if (v === null) return ['—', 'c-muted', ''];
  if (v <= 20) return [v, 'c-safe', 'LOW'];
  if (v <= 40) return [v, 'c-warn', 'MED'];
  return [v, 'c-danger', 'HIGH'];
}
function statusClass(v, type) {
  if (v === null || v === undefined) return 'c-muted';
  if (type === 'kh') return khStatus(v)[1];
  if (type === 'ph') return phStatus(v)[1];
  if (type === 'nh3') return nh3Status(v)[1];
  if (type === 'no2') return no2Status(v)[1];
  if (type === 'no3') return no3Status(v)[1];
  if (type === 'tap') return tapStatus(v)[1];
  return 'c-muted';
}

// ── Status pills ──
function updateStatus() {
  if (readings.length > 0) {
    const last = readings[readings.length - 1];
    const pills = document.querySelectorAll('#statusBar .stat-pill');
    [
      [last.ph, phStatus, 'pH', last.ph != null ? last.ph.toFixed(1) : '—'],
      [last.nh3, nh3Status, 'NH₃', last.nh3 !== null ? last.nh3 + ' ppm' : '—'],
      [last.no2, no2Status, 'NO₂', last.no2 !== null ? last.no2 + ' ppm' : '—'],
      [last.no3, no3Status, 'NO₃', last.no3 !== null ? last.no3 + ' ppm' : '—'],
      [last.kh, khStatus, 'KH', last.kh != null ? last.kh.toFixed(1) + ' dKH' : '—'],
    ].forEach(([val, fn, label, display], i) => {
      const [, cls, status] = fn(val);
      pills[i].innerHTML =
        `<div class="stat-label">${label}</div><div class="stat-value ${cls}">${display}</div><div class="stat-status ${cls}">${status}</div>`;
    });
  }
  const tapPills = document.querySelectorAll('#tapStatusBar .stat-pill');
  if (tapReadings.length > 0) {
    const last = tapReadings[tapReadings.length - 1];
    const [, cls, status] = tapStatus(last.no3);
    tapPills[0].innerHTML = `<div class="stat-label">Latest Filtered Tap NO₃</div><div class="stat-value ${cls}">${last.no3} ppm</div><div class="stat-status ${cls}">${status}</div>`;
    const d = new Date(last.date);
    tapPills[1].innerHTML = `<div class="stat-label">Last Tested</div><div class="stat-value c-muted stat-value-compact">${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>`;
  }
}

// ── Evenly-spaced chart ──
function drawChart(
  canvasId,
  ndId,
  pts,
  color,
  yMin,
  yMax,
  safeMin,
  safeMax,
  secondary,
  secColor,
  warnMin,
  warnMax
) {
  const canvas = document.getElementById(canvasId);
  if (isDataLoading) {
    setChartHasData(canvasId, false);
    return;
  }
  // pts = [{t, v}] sorted by t
  const valid = pts.filter((p) => p.v !== null && p.v !== undefined);
  if (valid.length === 0) {
    setChartHasData(canvasId, false);
    return;
  }
  setChartHasData(canvasId, true);

  const dpr = window.devicePixelRatio || 1;
  const w = canvas.offsetWidth || 400;
  const h = 110;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const pad = { t: 10, b: 22, l: 38, r: 10 };
  const pw = w - pad.l - pad.r;
  const ph = h - pad.t - pad.b;

  // Build x-axis slots from chronological timestamps, but space slots evenly.
  const allSeries = secondary && secondary.length > 0 ? [...valid, ...secondary] : valid;
  const allT = Array.from(new Set(allSeries.map((p) => p.t))).sort((a, b) => a - b);
  const tIndex = new Map(allT.map((t, idx) => [t, idx]));
  let allV = [...valid.map((p) => p.v)];
  if (secondary && secondary.length > 0) {
    allV = [...allV, ...secondary.map((p) => p.v)];
  }

  // Value range
  const dMin = Math.min(...allV);
  const dMax = Math.max(...allV);
  const rMin = Math.min(yMin, dMin);
  const rMax = Math.max(yMax, dMax) || 1;

  const xPos = (t) => {
    const idx = tIndex.get(t);
    if (allT.length <= 1 || idx === undefined) return pad.l + pw / 2;
    return pad.l + (idx / (allT.length - 1)) * pw;
  };
  const yPos = (v) => pad.t + ph - ((v - rMin) / (rMax - rMin || 1)) * ph;

  // Warning zone
  if (warnMin !== undefined && warnMax !== undefined) {
    const y1 = yPos(Math.min(warnMax, rMax));
    const y2 = yPos(Math.max(warnMin, rMin));
    ctx.fillStyle = 'rgba(245,158,11,0.16)';
    ctx.fillRect(pad.l, y1, pw, y2 - y1);
  }

  // Safe zone
  if (safeMin !== undefined) {
    const y1 = yPos(Math.min(safeMax, rMax));
    const y2 = yPos(Math.max(safeMin, rMin));
    ctx.fillStyle = 'rgba(16,185,129,0.18)';
    ctx.fillRect(pad.l, y1, pw, y2 - y1);
  }

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (i / 4) * ph;
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(w - pad.r, y);
    ctx.stroke();
  }

  function drawSeries(series, col) {
    if (!series || series.length === 0) return;
    const grad = ctx.createLinearGradient(0, pad.t, 0, h - pad.b);
    grad.addColorStop(0, col + '44');
    grad.addColorStop(1, col + '00');
    // Fill
    ctx.beginPath();
    ctx.moveTo(xPos(series[0].t), yPos(series[0].v));
    series.forEach((p, i) => {
      if (i > 0) ctx.lineTo(xPos(p.t), yPos(p.v));
    });
    ctx.lineTo(xPos(series[series.length - 1].t), h - pad.b);
    ctx.lineTo(xPos(series[0].t), h - pad.b);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    // Line
    ctx.beginPath();
    ctx.moveTo(xPos(series[0].t), yPos(series[0].v));
    series.forEach((p, i) => {
      if (i > 0) ctx.lineTo(xPos(p.t), yPos(p.v));
    });
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    // Dots — one per point
    series.forEach((p) => {
      ctx.beginPath();
      ctx.arc(xPos(p.t), yPos(p.v), 4, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(xPos(p.t), yPos(p.v), 2, 0, Math.PI * 2);
      ctx.fillStyle = '#0c0f14';
      ctx.fill();
    });
    // Value labels above each dot
    ctx.fillStyle = col;
    ctx.font = `bold 10px var(--mono,'Courier New')`;
    ctx.textAlign = 'center';
    series.forEach((p) => {
      const label = Number.isInteger(p.v) ? p.v : p.v.toFixed(1);
      ctx.fillText(label, xPos(p.t), yPos(p.v) - 7);
    });
  }

  drawSeries(valid, color);
  if (secondary && secondary.length > 0) drawSeries(secondary, secColor);

  // Y axis labels
  ctx.fillStyle = '#9aabc4';
  ctx.font = `10px var(--mono,'Courier New')`;
  ctx.textAlign = 'right';
  const ySteps = [rMin, rMax];
  ySteps.forEach((v) =>
    ctx.fillText(Number.isInteger(v) ? v : v.toFixed(1), pad.l - 4, yPos(v) + 3)
  );

  // X axis date labels — sampled from evenly spaced x slots
  ctx.textAlign = 'center';
  ctx.fillStyle = '#9aabc4';
  ctx.font = `10px var(--mono,'Courier New')`;
  const maxLabels = 6;
  const step = Math.max(1, Math.ceil(allT.length / maxLabels));
  let lastLabel = '';
  allT.forEach((t, i) => {
    if (i !== allT.length - 1 && i % step !== 0) return;
    const d = new Date(t);
    const key = `${d.getDate()}/${d.getMonth() + 1}`;
    if (i !== allT.length - 1 && key === lastLabel) return;
    lastLabel = key;
    ctx.fillText(key, xPos(t), h - 5);
  });
}

function renderMetricChart(
  chartKey,
  canvasId,
  ndId,
  pts,
  color,
  yMin,
  yMax,
  safeMin,
  safeMax,
  warnMin,
  warnMax
) {
  if (typeof Chart === 'undefined') {
    drawChart(canvasId, ndId, pts, color, yMin, yMax, safeMin, safeMax);
    return;
  }

  const canvas = document.getElementById(canvasId);
  if (isDataLoading) {
    setChartHasData(canvasId, false);
    return;
  }

  if (pts.length === 0) {
    if (metricCharts[chartKey]) {
      metricCharts[chartKey].destroy();
      metricCharts[chartKey] = null;
    }
    setChartHasData(canvasId, false);
    return;
  }

  setChartHasData(canvasId, true);

  const labels = pts.map((p) => String(p.t));
  const data = pts.map((p) => p.v);
  const rangeMin = Math.min(yMin, Math.min(...data));
  const rangeMax = Math.max(yMax, Math.max(...data)) || 1;

  const safeBandPlugin = {
    id: `${chartKey}-safe-band`,
    beforeDatasetsDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      if (!chartArea || !scales?.y) return;
      const yScale = scales.y;
      const drawBand = (min, max, fillColor) => {
        const bandTop = Math.min(max, yScale.max);
        const bandBottom = Math.max(min, yScale.min);
        if (bandBottom > bandTop) return;
        const yTop = yScale.getPixelForValue(bandTop);
        const yBottom = yScale.getPixelForValue(bandBottom);
        ctx.save();
        ctx.fillStyle = fillColor;
        ctx.fillRect(chartArea.left, yTop, chartArea.right - chartArea.left, yBottom - yTop);
        ctx.restore();
      };
      if (warnMin !== undefined && warnMax !== undefined) {
        drawBand(warnMin, warnMax, 'rgba(245,158,11,0.16)');
      }
      if (safeMin !== undefined && safeMax !== undefined) {
        drawBand(safeMin, safeMax, 'rgba(16,185,129,0.18)');
      }
    },
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title(items) {
            const ts = Number(items[0].label);
            if (!Number.isFinite(ts)) return '';
            return new Date(ts).toLocaleString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
          },
        },
      },
    },
    scales: {
      x: {
        type: 'category',
        grid: { display: false },
        ticks: {
          color: '#9aabc4',
          autoSkip: true,
          maxTicksLimit: 6,
          callback(value) {
            const ts = Number(this.getLabelForValue(value));
            if (!Number.isFinite(ts)) return '';
            const d = new Date(ts);
            return `${d.getDate()}/${d.getMonth() + 1}`;
          },
        },
      },
      y: {
        min: rangeMin,
        max: rangeMax,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#9aabc4' },
      },
    },
  };

  const dataset = {
    label: chartKey.toUpperCase(),
    data,
    borderColor: color,
    backgroundColor: color + '33',
    pointBackgroundColor: color,
    pointBorderColor: '#0c0f14',
    pointBorderWidth: 2,
    pointRadius: 4,
    tension: 0.25,
    fill: false,
  };

  if (!metricCharts[chartKey]) {
    metricCharts[chartKey] = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: { labels, datasets: [dataset] },
      options: chartOptions,
      plugins: [safeBandPlugin],
    });
    return;
  }

  metricCharts[chartKey].data.labels = labels;
  metricCharts[chartKey].data.datasets = [dataset];
  metricCharts[chartKey].options.scales.y.min = rangeMin;
  metricCharts[chartKey].options.scales.y.max = rangeMax;
  metricCharts[chartKey].update('none');
}

function renderNo3Chart(tankPts, tapPts, safeZone, warningZone) {
  if (typeof Chart === 'undefined') {
    const chartMax = Math.max(100, warningZone.max);
    drawChart(
      'chart-no3',
      'nd-no3',
      tankPts,
      '#facc15',
      0,
      chartMax,
      safeZone.min,
      safeZone.max,
      tapPts,
      '#22d3ee',
      warningZone.min,
      warningZone.max
    );
    return;
  }

  const canvas = document.getElementById('chart-no3');
  if (isDataLoading) {
    setChartHasData('chart-no3', false);
    return;
  }

  const allSeries = tapPts.length > 0 ? [...tankPts, ...tapPts] : [...tankPts];
  if (allSeries.length === 0) {
    if (no3Chart) {
      no3Chart.destroy();
      no3Chart = null;
    }
    setChartHasData('chart-no3', false);
    return;
  }

  setChartHasData('chart-no3', true);

  const allT = Array.from(new Set(allSeries.map((p) => p.t))).sort((a, b) => a - b);
  const tankByTime = new Map(tankPts.map((p) => [p.t, p.v]));
  const tapByTime = new Map(tapPts.map((p) => [p.t, p.v]));
  const labels = allT.map((t) => String(t));
  const tankData = allT.map((t) => (tankByTime.has(t) ? tankByTime.get(t) : null));
  const tapData = allT.map((t) => (tapByTime.has(t) ? tapByTime.get(t) : null));
  const allValues = allSeries.map((p) => p.v);
  const yMin = Math.min(0, Math.min(...allValues));
  const yMax = Math.max(100, Math.max(...allValues)) || 1;

  const datasets = [
    {
      label: 'Tank',
      data: tankData,
      borderColor: '#facc15',
      backgroundColor: 'rgba(250,204,21,0.20)',
      pointBackgroundColor: '#facc15',
      pointBorderColor: '#0c0f14',
      pointBorderWidth: 2,
      pointRadius: 4,
      tension: 0.25,
      spanGaps: true,
      fill: false,
    },
  ];
  if (tapPts.length > 0) {
    datasets.push({
      label: 'Filtered Tap',
      data: tapData,
      borderColor: '#22d3ee',
      backgroundColor: 'rgba(34,211,238,0.14)',
      pointBackgroundColor: '#22d3ee',
      pointBorderColor: '#0c0f14',
      pointBorderWidth: 2,
      pointRadius: 4,
      tension: 0.25,
      spanGaps: true,
      fill: false,
    });
  }

  const no3BandsPlugin = {
    id: 'no3Bands',
    beforeDatasetsDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      if (!chartArea || !scales?.y) return;
      const yScale = scales.y;
      const width = chartArea.right - chartArea.left;
      const drawBand = (min, max, color) => {
        const yTop = yScale.getPixelForValue(max);
        const yBottom = yScale.getPixelForValue(min);
        ctx.save();
        ctx.fillStyle = color;
        ctx.fillRect(chartArea.left, yTop, width, yBottom - yTop);
        ctx.restore();
      };
      drawBand(warningZone.min, warningZone.max, 'rgba(245,158,11,0.16)');
      drawBand(safeZone.min, safeZone.max, 'rgba(16,185,129,0.18)');
    },
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title(items) {
            const ts = Number(items[0].label);
            if (!Number.isFinite(ts)) return '';
            return new Date(ts).toLocaleString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
          },
          label(ctx) {
            if (ctx.parsed.y === null || ctx.parsed.y === undefined) return '';
            return `${ctx.dataset.label}: ${ctx.parsed.y} ppm`;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'category',
        grid: { display: false },
        ticks: {
          color: '#9aabc4',
          autoSkip: true,
          maxTicksLimit: 6,
          callback(value) {
            const ts = Number(this.getLabelForValue(value));
            if (!Number.isFinite(ts)) return '';
            const d = new Date(ts);
            return `${d.getDate()}/${d.getMonth() + 1}`;
          },
        },
      },
      y: {
        min: yMin,
        max: yMax,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#9aabc4' },
      },
    },
  };

  if (!no3Chart) {
    no3Chart = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: { labels, datasets },
      options: chartOptions,
      plugins: [no3BandsPlugin],
    });
    return;
  }

  no3Chart.data.labels = labels;
  no3Chart.data.datasets = datasets;
  no3Chart.options.scales.y.min = yMin;
  no3Chart.options.scales.y.max = yMax;
  no3Chart.update('none');
}

// ── Build chart data ──
function renderCharts() {
  const toPts = (arr, key) =>
    arr
      .filter((r) => r[key] !== null && r[key] !== undefined)
      .map((r) => ({ t: new Date(r.date).getTime(), v: r[key] }));
  const khSafe = profile.safeZones.kh;
  const phSafe = profile.safeZones.ph;
  const nh3Safe = profile.safeZones.nh3;
  const no2Safe = profile.safeZones.no2;
  const no3Safe = profile.safeZones.no3;
  const khWarning = getKhWarningRange(khSafe);
  const phWarning = getPhWarningRange(phSafe);
  const no3Warning = getNo3WarningRange(no3Safe);

  const khPts = toPts(readings, 'kh');
  const phPts = toPts(readings, 'ph');
  const nh3Pts = toPts(readings, 'nh3');
  const no2Pts = toPts(readings, 'no2');
  const no3Pts = toPts(readings, 'no3');
  const tapNo3Pts = tapFeatureEnabled ? toPts(tapReadings, 'no3') : [];

  renderMetricChart(
    'ph',
    'chart-ph',
    'nd-ph',
    phPts,
    '#a78bfa',
    6.0,
    7.5,
    phSafe.min,
    phSafe.max,
    phWarning.min,
    phWarning.max
  );
  renderMetricChart(
    'nh3',
    'chart-nh3',
    'nd-nh3',
    nh3Pts,
    '#f87171',
    0,
    1,
    nh3Safe.min,
    nh3Safe.max
  );
  renderMetricChart(
    'no2',
    'chart-no2',
    'nd-no2',
    no2Pts,
    '#fb923c',
    0,
    1,
    no2Safe.min,
    no2Safe.max
  );
  renderNo3Chart(no3Pts, tapNo3Pts, no3Safe, no3Warning);
  renderMetricChart(
    'kh',
    'chart-kh',
    'nd-kh',
    khPts,
    '#2dd4bf',
    0,
    12,
    khSafe.min,
    khSafe.max,
    khWarning.min,
    khWarning.max
  );
}

// ── Render tank log ──
function renderLog() {
  const body = document.getElementById('logBody');
  const count = document.getElementById('logCount');
  count.textContent = `${readings.length} reading${readings.length !== 1 ? 's' : ''}`;
  if (readings.length === 0) {
    body.innerHTML = '<div class="log-empty">No readings logged yet</div>';
    return;
  }
  const rows = [...readings]
    .reverse()
    .map((r) => {
      const d = new Date(r.date);
      const ds = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      const ts = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const fmt = (v, type) =>
        v !== null && v !== undefined
          ? `<span class="${statusClass(v, type)}">${type === 'ph' || type === 'kh' ? Number(v).toFixed(1) : v}</span>`
          : '<span class="c-muted">—</span>';
      return `<tr>
      <td class="log-cell-muted">${ds}<br>${ts}</td>
      <td>${fmt(r.ph, 'ph')}</td><td>${fmt(r.nh3, 'nh3')}</td>
      <td>${fmt(r.no2, 'no2')}</td><td>${fmt(r.no3, 'no3')}</td><td>${fmt(r.kh, 'kh')}</td>
      <td class="log-actions">
        <button type="button" class="icon-btn edit-btn" data-action="edit-tank" data-id="${escapeHtml(r.id)}" aria-label="Edit reading">✎</button>
        <button type="button" class="icon-btn del-btn" data-action="delete-tank" data-id="${escapeHtml(r.id)}" aria-label="Delete reading">×</button>
      </td>
    </tr>`;
    })
    .join('');
  body.innerHTML = `<table class="log-table"><thead><tr>
    <th>Date</th><th class="ph-label">pH</th><th class="nh3-label">NH₃</th>
    <th class="no2-label">NO₂</th><th class="no3-label">NO₃</th><th class="kh-label">KH</th><th></th>
  </tr></thead><tbody>${rows}</tbody></table>`;
}

// ── Render tap log ──
function renderTapLog() {
  const body = document.getElementById('tapLogBody');
  const count = document.getElementById('tapLogCount');
  count.textContent = `${tapReadings.length} reading${tapReadings.length !== 1 ? 's' : ''}`;
  if (tapReadings.length === 0) {
    body.innerHTML = '<div class="log-empty">No tap tests logged yet</div>';
    return;
  }
  const rows = [...tapReadings]
    .reverse()
    .map((r) => {
      const d = new Date(r.date);
      const ds = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const [, cls] = tapStatus(r.no3);
      return `<tr>
      <td class="log-cell-muted">${ds}</td>
      <td><span class="${cls}">${r.no3} ppm</span></td>
      <td class="log-cell-muted">${escapeHtml(r.note || '')}</td>
      <td class="log-actions">
        <button type="button" class="icon-btn edit-btn" data-action="edit-tap" data-id="${escapeHtml(r.id)}" aria-label="Edit tap test">✎</button>
        <button type="button" class="icon-btn del-btn" data-action="delete-tap" data-id="${escapeHtml(r.id)}" aria-label="Delete tap test">×</button>
      </td>
    </tr>`;
    })
    .join('');
  body.innerHTML = `<table class="log-table"><thead><tr>
    <th>Date</th><th class="tap-label">Filtered Tap NO₃</th><th>Notes</th><th></th>
  </tr></thead><tbody>${rows}</tbody></table>`;
}

// ── Add readings ──
async function addReading() {
  const get = (fid) => {
    const v = document.getElementById(fid).value;
    return v === '' ? null : parseFloat(v);
  };
  const date = nowLocal();
  const newId = crypto.randomUUID();
  const r = {
    id: newId,
    date,
    kh: get('f-kh'),
    ph: get('f-ph'),
    nh3: get('f-nh3'),
    no2: get('f-no2'),
    no3: get('f-no3'),
  };
  if ([r.kh, r.ph, r.nh3, r.no2, r.no3].every((v) => v === null)) return;
  readings.push(r);
  readings.sort((a, b) => new Date(a.date) - new Date(b.date));
  render();
  ['f-ph', 'f-nh3', 'f-no2', 'f-no3', 'f-kh'].forEach(
    (fid) => (document.getElementById(fid).value = '')
  );
  const res = await apiFetch('/readings', { method: 'POST', body: JSON.stringify(r) });
  if (!res.ok) {
    readings = readings.filter((x) => x.id !== newId);
    render();
    showToast(res.status === 401 ? 'Session expired' : 'Could not save reading');
    return;
  }
  showToast('Reading added ✓');
}
async function addTapReading() {
  const v = document.getElementById('t-no3').value;
  if (v === '') return;
  const date = document.getElementById('t-date').value || nowLocal();
  const note = document.getElementById('t-note').value.trim();
  const newId = crypto.randomUUID();
  const row = { id: newId, date, no3: parseFloat(v), note };
  tapReadings.push(row);
  tapReadings.sort((a, b) => new Date(a.date) - new Date(b.date));
  render();
  document.getElementById('t-no3').value = '';
  document.getElementById('t-note').value = '';
  document.getElementById('t-date').value = nowLocal();
  const res = await apiFetch('/tap', { method: 'POST', body: JSON.stringify(row) });
  if (!res.ok) {
    tapReadings = tapReadings.filter((x) => x.id !== newId);
    render();
    showToast(res.status === 401 ? 'Session expired' : 'Could not save tap test');
    return;
  }
  showToast('Tap test added ✓');
}
function formatReadingDateLabel(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'this reading';
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function openConfirmModal({ title, message, confirmLabel, onConfirm }) {
  document.getElementById('confirmModalTitle').textContent = title;
  document.getElementById('confirmModalMessage').textContent = message;
  document.getElementById('confirmModalConfirmBtn').textContent = confirmLabel || 'Delete';
  confirmModalAction = onConfirm;
  document.getElementById('confirmModal').classList.add('show');
  document.body.classList.add('modal-open');
}

function closeConfirmModal() {
  document.getElementById('confirmModal').classList.remove('show');
  if (
    !document.getElementById('editTankModal').classList.contains('show') &&
    !document.getElementById('editTapModal').classList.contains('show')
  ) {
    document.body.classList.remove('modal-open');
  }
  confirmModalAction = null;
}

async function runConfirmModalAction() {
  const action = confirmModalAction;
  closeConfirmModal();
  if (typeof action === 'function') await action();
}

function promptDeleteTankReading(readingId) {
  const item = readings.find((x) => x.id === readingId);
  if (!item) return;
  openConfirmModal({
    title: 'Delete tank reading?',
    message: `Remove the reading from ${formatReadingDateLabel(item.date)}? This cannot be undone.`,
    confirmLabel: 'Delete',
    onConfirm: () => deleteTankReading(readingId),
  });
}

function promptDeleteTapReading(readingId) {
  const item = tapReadings.find((x) => x.id === readingId);
  if (!item) return;
  openConfirmModal({
    title: 'Delete tap test?',
    message: `Remove the tap test from ${formatReadingDateLabel(item.date)}? This cannot be undone.`,
    confirmLabel: 'Delete',
    onConfirm: () => deleteTapReading(readingId),
  });
}

async function deleteTankReading(readingId) {
  const item = readings.find((x) => x.id === readingId);
  const idx = readings.findIndex((x) => x.id === readingId);
  if (idx === -1) return;
  readings.splice(idx, 1);
  render();
  const res = await apiFetch('/readings/' + encodeURIComponent(readingId), { method: 'DELETE' });
  if (!res.ok) {
    if (item) readings.splice(idx, 0, item);
    readings.sort((a, b) => new Date(a.date) - new Date(b.date));
    render();
    showToast(res.status === 401 ? 'Session expired' : 'Could not delete reading');
    return;
  }
  showToast('Reading deleted ✓');
}

async function deleteTapReading(readingId) {
  const item = tapReadings.find((x) => x.id === readingId);
  const idx = tapReadings.findIndex((x) => x.id === readingId);
  if (idx === -1) return;
  tapReadings.splice(idx, 1);
  render();
  const res = await apiFetch('/tap/' + encodeURIComponent(readingId), { method: 'DELETE' });
  if (!res.ok) {
    if (item) tapReadings.splice(idx, 0, item);
    tapReadings.sort((a, b) => new Date(a.date) - new Date(b.date));
    render();
    showToast(res.status === 401 ? 'Session expired' : 'Could not delete tap test');
    return;
  }
  showToast('Tap test deleted ✓');
}

function setEditInputValue(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.value = value === null || value === undefined ? '' : value;
}

function openEditTankModal(readingId) {
  const r = readings.find((x) => x.id === readingId);
  if (!r) return;
  editingTankId = readingId;
  setEditInputValue('edit-ph', r.ph);
  setEditInputValue('edit-nh3', r.nh3);
  setEditInputValue('edit-no2', r.no2);
  setEditInputValue('edit-no3', r.no3);
  setEditInputValue('edit-kh', r.kh);
  document.getElementById('edit-tank-date').value = toDatetimeLocalValue(r.date);
  document.getElementById('editTankModal').classList.add('show');
  document.body.classList.add('modal-open');
}

function closeEditTankModal() {
  document.getElementById('editTankModal').classList.remove('show');
  editingTankId = null;
  if (
    !document.getElementById('confirmModal').classList.contains('show') &&
    !document.getElementById('editTapModal').classList.contains('show')
  ) {
    document.body.classList.remove('modal-open');
  }
}

function openEditTapModal(readingId) {
  const r = tapReadings.find((x) => x.id === readingId);
  if (!r) return;
  editingTapId = readingId;
  setEditInputValue('edit-tap-no3', r.no3);
  document.getElementById('edit-tap-date').value = toDatetimeLocalValue(r.date);
  document.getElementById('edit-tap-note').value = r.note || '';
  document.getElementById('editTapModal').classList.add('show');
  document.body.classList.add('modal-open');
}

function closeEditTapModal() {
  document.getElementById('editTapModal').classList.remove('show');
  editingTapId = null;
  if (
    !document.getElementById('confirmModal').classList.contains('show') &&
    !document.getElementById('editTankModal').classList.contains('show')
  ) {
    document.body.classList.remove('modal-open');
  }
}

function toDatetimeLocalValue(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return nowLocal();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

async function saveEditTankReading() {
  const id = editingTankId;
  const prev = readings.find((x) => x.id === id);
  if (!prev) return;
  const get = (fid) => {
    const v = document.getElementById(fid).value;
    return v === '' ? null : parseFloat(v);
  };
  const date = document.getElementById('edit-tank-date').value || prev.date;
  const updated = {
    ...prev,
    date,
    ph: get('edit-ph'),
    nh3: get('edit-nh3'),
    no2: get('edit-no2'),
    no3: get('edit-no3'),
    kh: get('edit-kh'),
  };
  if ([updated.ph, updated.nh3, updated.no2, updated.no3, updated.kh].every((v) => v === null)) {
    showToast('Enter at least one value');
    return;
  }
  const idx = readings.findIndex((x) => x.id === id);
  readings[idx] = updated;
  readings.sort((a, b) => new Date(a.date) - new Date(b.date));
  closeEditTankModal();
  render();
  const res = await apiFetch('/readings/' + encodeURIComponent(id), {
    method: 'PUT',
    body: JSON.stringify(updated),
  });
  if (!res.ok) {
    readings[idx] = prev;
    readings.sort((a, b) => new Date(a.date) - new Date(b.date));
    render();
    showToast(res.status === 401 ? 'Session expired' : 'Could not save changes');
    return;
  }
  showToast('Reading updated ✓');
}

async function saveEditTapReading() {
  const id = editingTapId;
  const prev = tapReadings.find((x) => x.id === id);
  if (!prev) return;
  const no3Val = document.getElementById('edit-tap-no3').value;
  if (no3Val === '') {
    showToast('Nitrate is required');
    return;
  }
  const updated = {
    ...prev,
    date: document.getElementById('edit-tap-date').value || prev.date,
    no3: parseFloat(no3Val),
    note: document.getElementById('edit-tap-note').value.trim(),
  };
  const idx = tapReadings.findIndex((x) => x.id === id);
  tapReadings[idx] = updated;
  tapReadings.sort((a, b) => new Date(a.date) - new Date(b.date));
  closeEditTapModal();
  render();
  const res = await apiFetch('/tap/' + encodeURIComponent(id), {
    method: 'PUT',
    body: JSON.stringify(updated),
  });
  if (!res.ok) {
    tapReadings[idx] = prev;
    tapReadings.sort((a, b) => new Date(a.date) - new Date(b.date));
    render();
    showToast(res.status === 401 ? 'Session expired' : 'Could not save changes');
    return;
  }
  showToast('Tap test updated ✓');
}

function onLogTableClick(event) {
  const btn = event.target.closest('[data-action]');
  if (!btn) return;
  const id = btn.getAttribute('data-id');
  const action = btn.getAttribute('data-action');
  if (!id) return;
  if (action === 'delete-tank') promptDeleteTankReading(id);
  else if (action === 'edit-tank') openEditTankModal(id);
  else if (action === 'delete-tap') promptDeleteTapReading(id);
  else if (action === 'edit-tap') openEditTapModal(id);
}

function initLogTableActions() {
  const logBody = document.getElementById('logBody');
  const tapLogBody = document.getElementById('tapLogBody');
  if (logBody) logBody.addEventListener('click', onLogTableClick);
  if (tapLogBody) tapLogBody.addEventListener('click', onLogTableClick);
  const confirmModal = document.getElementById('confirmModal');
  if (confirmModal) {
    confirmModal.addEventListener('click', (e) => {
      if (e.target.id === 'confirmModal') closeConfirmModal();
    });
  }
  const editTankModal = document.getElementById('editTankModal');
  if (editTankModal) {
    editTankModal.addEventListener('click', (e) => {
      if (e.target.id === 'editTankModal') closeEditTankModal();
    });
  }
  const editTapModal = document.getElementById('editTapModal');
  if (editTapModal) {
    editTapModal.addEventListener('click', (e) => {
      if (e.target.id === 'editTapModal') closeEditTapModal();
    });
  }
}

// ── Full render ──
function render() {
  try {
    updateStatus();
    renderCharts();
    renderLog();
    renderTapLog();
  } catch (err) {
    console.error('Render failed', err);
    showToast('Could not refresh charts');
  }
}

async function initApp() {
  wireAppEventListeners();
  document.getElementById('currentYear').textContent = new Date().getFullYear();
  applyProfileToUI();
  await loadAuthConfig();
  initGateForm();
  await handleCognitoRedirect();
  if (getValidToken() && API_BASE_URL.trim()) {
    showApp();
    loadData();
  }
  initTapFeatureToggle();
  initLogTableActions();
  window.addEventListener('resize', renderCharts);
}

initApp();
