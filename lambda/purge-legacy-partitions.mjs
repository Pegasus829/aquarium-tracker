import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

const TABLE_NAME = process.env.TABLE_NAME || 'aquarium-readings';
const PURGE_MODE = (process.env.PURGE_MODE || 'dry-run').toLowerCase();
const CONFIRM_PURGE = process.env.CONFIRM_PURGE || '';
const COGNITO_USER_SUB = process.env.COGNITO_USER_SUB || '';
const SKIP_VERIFY = process.env.SKIP_VERIFY === '1';
const ARCHIVE_TAG =
  process.env.ARCHIVE_TAG || new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

const LEGACY_TYPES = ['tank', 'tap', 'profile'];
const VALID_MODES = new Set(['dry-run', 'delete', 'isolate']);

if (!VALID_MODES.has(PURGE_MODE)) {
  console.error(`PURGE_MODE must be one of: ${[...VALID_MODES].join(', ')}`);
  process.exit(1);
}

if (PURGE_MODE !== 'dry-run' && CONFIRM_PURGE !== 'yes') {
  console.error('Set CONFIRM_PURGE=yes to run delete or isolate.');
  process.exit(1);
}

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

async function queryByType(type) {
  const items = [];
  let ExclusiveStartKey;
  do {
    const out = await ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: '#t = :type',
        ExpressionAttributeNames: { '#t': 'type' },
        ExpressionAttributeValues: { ':type': type },
        ExclusiveStartKey,
      })
    );
    items.push(...(out.Items || []));
    ExclusiveStartKey = out.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
}

async function verifyUserCopiesExist(sub) {
  for (const kind of LEGACY_TYPES) {
    const legacyItems = await queryByType(kind);
    if (!legacyItems.length) continue;
    const userItems = await queryByType(`USER#${sub}#${kind}`);
    if (userItems.length < legacyItems.length) {
      throw new Error(
        `Refusing purge: legacy ${kind} has ${legacyItems.length} item(s) but USER#${sub}#${kind} has ${userItems.length}. ` +
          'Re-run migration or set SKIP_VERIFY=1 only after manual verification.'
      );
    }
  }
}

async function purgeType(kind) {
  const items = await queryByType(kind);
  if (!items.length) {
    console.log(`${kind}: no legacy items`);
    return { kind, count: 0 };
  }

  const sampleIds = items.slice(0, 5).map((item) => item.id);
  console.log(`${kind}: ${items.length} legacy item(s)${sampleIds.length ? ` (e.g. ${sampleIds.join(', ')})` : ''}`);

  if (PURGE_MODE === 'dry-run') {
    return { kind, count: items.length };
  }

  for (const item of items) {
    if (PURGE_MODE === 'isolate') {
      const archived = {
        ...item,
        type: `ARCHIVED#${ARCHIVE_TAG}#${kind}`,
        archivedFromType: item.type,
        archivedAt: new Date().toISOString(),
      };
      await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: archived }));
    }
    await ddb.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { type: item.type, id: item.id },
      })
    );
  }

  return { kind, count: items.length };
}

if (COGNITO_USER_SUB && !SKIP_VERIFY) {
  await verifyUserCopiesExist(COGNITO_USER_SUB);
} else if (PURGE_MODE !== 'dry-run' && !SKIP_VERIFY) {
  console.warn(
    'COGNITO_USER_SUB not set; skipping verify that user-scoped copies exist. Set SKIP_VERIFY=1 to silence.'
  );
}

const results = [];
for (const kind of LEGACY_TYPES) {
  results.push(await purgeType(kind));
}

const total = results.reduce((sum, row) => sum + row.count, 0);
if (PURGE_MODE === 'dry-run') {
  console.log(`Dry run complete. ${total} legacy item(s) found in shared partitions.`);
  console.log('Re-run with PURGE_MODE=delete|isolate and CONFIRM_PURGE=yes to apply.');
} else if (PURGE_MODE === 'isolate') {
  console.log(`Isolated ${total} legacy item(s) under ARCHIVED#${ARCHIVE_TAG}#* and removed shared partitions.`);
} else {
  console.log(`Deleted ${total} legacy item(s) from shared tank/tap/profile partitions.`);
}
