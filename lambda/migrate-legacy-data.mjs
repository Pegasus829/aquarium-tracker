import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';

const TABLE_NAME = process.env.TABLE_NAME || 'aquarium-readings';
const COGNITO_USER_SUB = process.env.COGNITO_USER_SUB;
const COGNITO_USER_EMAIL = process.env.COGNITO_USER_EMAIL || '';
const LEGACY_TYPES = ['tank', 'tap', 'profile'];

if (!COGNITO_USER_SUB) {
  console.error('Set COGNITO_USER_SUB to the target Cognito user sub before running migration.');
  process.exit(1);
}

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

async function queryLegacyItems(type) {
  const items = [];
  let ExclusiveStartKey;
  do {
    const out = await ddb.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: '#t = :type',
      ExpressionAttributeNames: { '#t': 'type' },
      ExpressionAttributeValues: { ':type': type },
      ExclusiveStartKey,
    }));
    items.push(...(out.Items || []));
    ExclusiveStartKey = out.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
}

async function migrateType(type) {
  const items = await queryLegacyItems(type);
  for (const item of items) {
    const next = {
      ...item,
      type: `USER#${COGNITO_USER_SUB}#${type}`,
      ownerSub: COGNITO_USER_SUB,
      ...(COGNITO_USER_EMAIL ? { ownerEmail: COGNITO_USER_EMAIL } : {}),
      migratedFromType: item.type,
      migratedAt: new Date().toISOString(),
    };
    await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: next }));
  }
  console.log(`Migrated ${items.length} ${type} item(s).`);
}

for (const type of LEGACY_TYPES) {
  await migrateType(type);
}

console.log(`Migration complete for USER#${COGNITO_USER_SUB}. Legacy records were copied, not deleted.`);
