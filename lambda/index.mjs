import crypto from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

const TABLE_NAME = process.env.TABLE_NAME || 'aquarium-readings';
const PASSWORD_HASH = process.env.PASSWORD_HASH;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY_SEC = Number.parseInt(process.env.JWT_EXPIRY_SEC || '86400', 10);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://aquarium.vibeai.software',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,x-api-key',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};
const DEFAULT_AVATAR_EMOJI = '👤';
const AVATAR_EMOJIS = [DEFAULT_AVATAR_EMOJI, '🐠', '🐟', '🐡', '🐙', '🦐'];
const AVATAR_IMAGE_MAX_CHARS = 220000;

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

function json(status, body) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  };
}

function base64urlEncode(buf) {
  return Buffer.from(buf).toString('base64url');
}

function hashPassword(pwd) {
  return crypto.createHash('sha256').update(pwd, 'utf8').digest('hex');
}

function timingSafeCompareHex(a, b) {
  try {
    const ba = Buffer.from(a, 'hex');
    const bb = Buffer.from(b, 'hex');
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

function signJwt() {
  const now = Math.floor(Date.now() / 1000);
  const payload = { sub: 'aquarium', iat: now, exp: now + JWT_EXPIRY_SEC };
  const header = base64urlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadPart = base64urlEncode(JSON.stringify(payload));
  const data = `${header}.${payloadPart}`;
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyJwt(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('invalid');
  const [h, p, s] = parts;
  const data = `${h}.${p}`;
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
  if (s.length !== expected.length) throw new Error('sig');
  if (!crypto.timingSafeEqual(Buffer.from(s, 'utf8'), Buffer.from(expected, 'utf8'))) {
    throw new Error('sig');
  }
  const payload = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'));
  if (payload.exp && Date.now() / 1000 > payload.exp) throw new Error('exp');
  return payload;
}

function getBearer(event) {
  const raw =
    event.headers?.Authorization ??
    event.headers?.authorization ??
    event.multiValueHeaders?.Authorization?.[0] ??
    event.multiValueHeaders?.authorization?.[0];
  if (!raw || !raw.startsWith('Bearer ')) return null;
  return raw.slice(7).trim();
}

function requireAuth(event) {
  const bearer = getBearer(event);
  if (!bearer) return { error: json(401, { error: 'Unauthorized' }) };
  try {
    verifyJwt(bearer);
    return {};
  } catch {
    return { error: json(401, { error: 'Unauthorized' }) };
  }
}

function parseBody(event) {
  try {
    return JSON.parse(event.body || '{}');
  } catch {
    return null;
  }
}

function validateTankItem(o) {
  if (!o || typeof o !== 'object') return null;
  const id = o.id;
  const date = o.date;
  if (typeof id !== 'string' || !id || typeof date !== 'string') return null;
  return {
    type: 'tank',
    id,
    date,
    ph: o.ph ?? null,
    nh3: o.nh3 ?? null,
    no2: o.no2 ?? null,
    no3: o.no3 ?? null,
  };
}

function validateTapItem(o) {
  if (!o || typeof o !== 'object') return null;
  const id = o.id;
  const date = o.date;
  if (typeof id !== 'string' || !id || typeof date !== 'string') return null;
  const note = o.note != null ? String(o.note) : '';
  if (note.length > 2000) return null;
  const no3 = typeof o.no3 === 'number' ? o.no3 : Number.parseFloat(o.no3);
  if (Number.isNaN(no3)) return null;
  return { type: 'tap', id, date, no3, note };
}

const DEFAULT_PROFILE = {
  userName: 'Aquarist',
  aquariumName: 'Fluval Flex 2.0',
  aquariumSize: 57,
  aquariumUnits: 'litres',
  avatar: { type: 'emoji', emoji: DEFAULT_AVATAR_EMOJI, imageDataUrl: '' },
  settings: { trackTapWater: true },
  safeZones: {
    ph: { min: 6.5, max: 7.0 },
    nh3: { min: 0, max: 0.25 },
    no2: { min: 0, max: 0.25 },
    no3: { min: 0, max: 20 },
  },
};

function sanitizeRange(raw, fallback, minCap, maxCap) {
  let min = Number.isFinite(Number(raw?.min)) ? Number(raw.min) : fallback.min;
  let max = Number.isFinite(Number(raw?.max)) ? Number(raw.max) : fallback.max;
  min = Math.max(minCap, Math.min(maxCap, min));
  max = Math.max(minCap, Math.min(maxCap, max));
  if (min > max) [min, max] = [max, min];
  return { min, max };
}

function isSafeAvatarImageDataUrl(value) {
  return typeof value === 'string'
    && value.length <= AVATAR_IMAGE_MAX_CHARS
    && /^data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/.test(value);
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
  return {
    userName: typeof raw.userName === 'string' && raw.userName.trim() ? raw.userName.trim() : DEFAULT_PROFILE.userName,
    aquariumName: typeof raw.aquariumName === 'string' && raw.aquariumName.trim() ? raw.aquariumName.trim() : DEFAULT_PROFILE.aquariumName,
    aquariumSize: Number.isFinite(Number(raw.aquariumSize)) ? Number(raw.aquariumSize) : DEFAULT_PROFILE.aquariumSize,
    aquariumUnits: raw.aquariumUnits === 'gallons' ? 'gallons' : 'litres',
    avatar: normalizeAvatar(raw.avatar),
    settings: {
      trackTapWater: typeof raw.settings?.trackTapWater === 'boolean' ? raw.settings.trackTapWater : DEFAULT_PROFILE.settings.trackTapWater,
    },
    safeZones: {
      ph: sanitizeRange(raw.safeZones?.ph, DEFAULT_PROFILE.safeZones.ph, 0, 14),
      nh3: sanitizeRange(raw.safeZones?.nh3, DEFAULT_PROFILE.safeZones.nh3, 0, 500),
      no2: sanitizeRange(raw.safeZones?.no2, DEFAULT_PROFILE.safeZones.no2, 0, 500),
      no3: sanitizeRange(raw.safeZones?.no3, DEFAULT_PROFILE.safeZones.no3, 0, 500),
    },
  };
}

function profileToItem(profile) {
  return {
    type: 'profile',
    id: 'default',
    ...normalizeProfile(profile),
    updatedAt: new Date().toISOString(),
  };
}

function itemToProfile(item) {
  if (!item || typeof item !== 'object') return normalizeProfile();
  return normalizeProfile(item);
}

export async function handler(event) {
  const method = event.httpMethod;
  const resource = event.resource || '';

  if (!PASSWORD_HASH || !JWT_SECRET) {
    return json(500, { error: 'Server misconfiguration' });
  }

  if (method === 'OPTIONS') {
    return json(200, '');
  }

  if (resource === '/auth/login' && method === 'POST') {
    const body = parseBody(event);
    if (!body) return json(400, { error: 'Invalid JSON' });
    const pwd = body.password;
    if (typeof pwd !== 'string' || !pwd) return json(400, { error: 'Password required' });
    const got = hashPassword(pwd);
    if (!timingSafeCompareHex(got, PASSWORD_HASH)) {
      return json(401, { error: 'Invalid credentials' });
    }
    const token = signJwt();
    return json(200, { token, expiresIn: JWT_EXPIRY_SEC });
  }

  const auth = requireAuth(event);
  if (auth.error) return auth.error;

  try {
    if (resource === '/readings' && method === 'GET') {
      const out = await ddb.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: '#t = :tank',
          ExpressionAttributeNames: { '#t': 'type' },
          ExpressionAttributeValues: { ':tank': 'tank' },
        }),
      );
      return json(200, out.Items || []);
    }

    if (resource === '/readings' && method === 'POST') {
      const body = parseBody(event);
      if (!body) return json(400, { error: 'Invalid JSON' });
      const item = validateTankItem(body);
      if (!item) return json(400, { error: 'Invalid tank reading' });
      await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
      return json(201, item);
    }

    if (resource === '/readings/{id}' && method === 'DELETE') {
      const id = event.pathParameters?.id;
      if (!id) return json(400, { error: 'Missing id' });
      await ddb.send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: { type: 'tank', id },
        }),
      );
      return json(204, '');
    }

    if (resource === '/tap' && method === 'GET') {
      const out = await ddb.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: '#t = :tap',
          ExpressionAttributeNames: { '#t': 'type' },
          ExpressionAttributeValues: { ':tap': 'tap' },
        }),
      );
      return json(200, out.Items || []);
    }

    if (resource === '/tap' && method === 'POST') {
      const body = parseBody(event);
      if (!body) return json(400, { error: 'Invalid JSON' });
      const item = validateTapItem(body);
      if (!item) return json(400, { error: 'Invalid tap reading' });
      await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
      return json(201, item);
    }

    if (resource === '/tap/{id}' && method === 'DELETE') {
      const id = event.pathParameters?.id;
      if (!id) return json(400, { error: 'Missing id' });
      await ddb.send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: { type: 'tap', id },
        }),
      );
      return json(204, '');
    }

    if (resource === '/profile' && method === 'GET') {
      const out = await ddb.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: '#t = :profileType',
          ExpressionAttributeNames: { '#t': 'type' },
          ExpressionAttributeValues: { ':profileType': 'profile' },
        }),
      );
      const found = (out.Items || []).find((x) => x.id === 'default') || (out.Items || [])[0];
      return json(200, itemToProfile(found));
    }

    if (resource === '/profile' && method === 'PUT') {
      const body = parseBody(event);
      if (!body) return json(400, { error: 'Invalid JSON' });
      const item = profileToItem(body);
      await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
      return json(200, itemToProfile(item));
    }

    return json(404, { error: 'Not found' });
  } catch (e) {
    console.error(e);
    return json(500, { error: 'Server error' });
  }
}
