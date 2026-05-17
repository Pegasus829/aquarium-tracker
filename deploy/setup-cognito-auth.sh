#!/usr/bin/env bash
set -euo pipefail

# Creates/updates Cognito hosted login, protects existing API Gateway methods
# with a Cognito user-pool authorizer, and prepares Marc's user for migration.

REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-eu-west-1}}"
STACK_NAME="${STACK_NAME:-aquarium-cognito-auth}"
APP_NAME="${APP_NAME:-aquarium-tracker}"
API_ID="${API_ID:-${API_GATEWAY_REST_API_ID:-gnewkvhgwd}}"
STAGE="${STAGE:-${API_GATEWAY_STAGE:-prod}}"
LAMBDA_FUNCTION_NAME="${LAMBDA_FUNCTION_NAME:-aquarium-api}"
TABLE_NAME="${TABLE_NAME:-aquarium-readings}"
APP_URL="${APP_URL:-https://aquarium.vibeai.software/}"
AUTH_DOMAIN_PREFIX="${AUTH_DOMAIN_PREFIX:-}"
COGNITO_SCOPES="${COGNITO_SCOPES:-openid email profile}"
MARC_EMAIL="${MARC_EMAIL:-marc@amphletts.uk}"
MARC_CURRENT_PASSWORD="${MARC_CURRENT_PASSWORD:-}"
RUN_LEGACY_MIGRATION="${RUN_LEGACY_MIGRATION:-0}"
AWS_CLI="${AWS_CLI:-aws}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE_FILE="$REPO_ROOT/deploy/cognito-auth-template.yaml"

require_tool() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required tool: $1" >&2
    exit 1
  fi
}

aws_cmd() {
  "$AWS_CLI" --region "$REGION" "$@"
}

stack_output() {
  local key="$1"
  aws_cmd cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='$key'].OutputValue | [0]" \
    --output text
}

print_stack_events() {
  echo "Recent CloudFormation events for $STACK_NAME:" >&2
  aws_cmd cloudformation describe-stack-events \
    --stack-name "$STACK_NAME" \
    --query "StackEvents[0:20].[Timestamp,LogicalResourceId,ResourceStatus,ResourceStatusReason]" \
    --output table >&2 || true
}

get_resource_id() {
  local path="$1"
  aws_cmd apigateway get-resources \
    --rest-api-id "$API_ID" \
    --query "items[?path=='$path'].id | [0]" \
    --output text
}

delete_method_if_exists() {
  local resource_id="$1"
  local method="$2"
  if aws_cmd apigateway get-method \
    --rest-api-id "$API_ID" \
    --resource-id "$resource_id" \
    --http-method "$method" >/dev/null 2>&1; then
    aws_cmd apigateway delete-method \
      --rest-api-id "$API_ID" \
      --resource-id "$resource_id" \
      --http-method "$method" >/dev/null
  fi
}

ensure_child_resource() {
  local parent_id="$1"
  local path_part="$2"
  local full_path="$3"
  local existing
  existing="$(get_resource_id "$full_path")"
  if [[ -n "$existing" && "$existing" != "None" ]]; then
    echo "$existing"
    return
  fi
  aws_cmd apigateway create-resource \
    --rest-api-id "$API_ID" \
    --parent-id "$parent_id" \
    --path-part "$path_part" \
    --query id \
    --output text
}

put_public_lambda_proxy_method() {
  local resource_id="$1"
  local method="$2"
  local integration_uri="$3"

  delete_method_if_exists "$resource_id" "$method"
  aws_cmd apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$resource_id" \
    --http-method "$method" \
    --authorization-type NONE \
    --no-api-key-required >/dev/null

  aws_cmd apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$resource_id" \
    --http-method "$method" \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "$integration_uri" >/dev/null
}

put_options_method() {
  local resource_id="$1"
  local allow_methods="${2:-GET,OPTIONS}"

  delete_method_if_exists "$resource_id" OPTIONS
  aws_cmd apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$resource_id" \
    --http-method OPTIONS \
    --authorization-type NONE \
    --no-api-key-required >/dev/null

  aws_cmd apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$resource_id" \
    --http-method OPTIONS \
    --type MOCK \
    --request-templates '{"application/json":"{\"statusCode\":200}"}' >/dev/null

  aws_cmd apigateway put-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$resource_id" \
    --http-method OPTIONS \
    --status-code 200 \
    --response-models '{"application/json":"Empty"}' \
    --response-parameters '{"method.response.header.Access-Control-Allow-Headers":true,"method.response.header.Access-Control-Allow-Methods":true,"method.response.header.Access-Control-Allow-Origin":true}' >/dev/null

  aws_cmd apigateway put-integration-response \
    --rest-api-id "$API_ID" \
    --resource-id "$resource_id" \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters "{\"method.response.header.Access-Control-Allow-Headers\":\"'Content-Type,Authorization,x-api-key'\",\"method.response.header.Access-Control-Allow-Methods\":\"'${allow_methods}'\",\"method.response.header.Access-Control-Allow-Origin\":\"'${APP_URL%/}'\"}" >/dev/null
}

put_method_auth() {
  local resource_id="$1"
  local method="$2"
  aws_cmd apigateway update-method \
    --rest-api-id "$API_ID" \
    --resource-id "$resource_id" \
    --http-method "$method" \
    --patch-operations \
      op=replace,path=/authorizationType,value=COGNITO_USER_POOLS \
      op=replace,path=/authorizerId,value="$AUTHORIZER_ID" >/dev/null
}

protect_path_methods() {
  local path="$1"
  shift
  local resource_id
  resource_id="$(get_resource_id "$path")"
  if [[ -z "$resource_id" || "$resource_id" == "None" ]]; then
    echo "Skipping $path because the API resource does not exist"
    return
  fi
  for method in "$@"; do
    echo "Protecting $method $path"
    put_method_auth "$resource_id" "$method"
  done
}

require_tool "$AWS_CLI"
require_tool node

ACCOUNT_ID="$(aws_cmd sts get-caller-identity --query Account --output text)"
if [[ -z "$AUTH_DOMAIN_PREFIX" ]]; then
  AUTH_DOMAIN_PREFIX="${APP_NAME}-${ACCOUNT_ID}-prod"
fi

echo "Deploying Cognito stack: $STACK_NAME"
echo "Using Cognito hosted domain prefix: $AUTH_DOMAIN_PREFIX"
if ! aws_cmd cloudformation deploy \
    --stack-name "$STACK_NAME" \
    --template-file "$TEMPLATE_FILE" \
    --parameter-overrides \
      AppName="$APP_NAME" \
      HostedAuthDomainPrefix="$AUTH_DOMAIN_PREFIX" \
      CallbackUrl="$APP_URL" \
      LogoutUrl="$APP_URL"; then
  print_stack_events
  exit 1
fi

USER_POOL_ID="$(stack_output UserPoolId)"
USER_POOL_ARN="$(stack_output UserPoolArn)"
USER_POOL_CLIENT_ID="$(stack_output UserPoolClientId)"
HOSTED_AUTH_DOMAIN="$(stack_output HostedAuthDomain)"
ROOT_ID="$(get_resource_id /)"
READINGS_ID="$(get_resource_id /readings)"
if [[ -z "$ROOT_ID" || "$ROOT_ID" == "None" || -z "$READINGS_ID" || "$READINGS_ID" == "None" ]]; then
  echo "Could not find existing API Gateway root or /readings resource" >&2
  exit 1
fi
INTEGRATION_URI="$(aws_cmd apigateway get-integration \
  --rest-api-id "$API_ID" \
  --resource-id "$READINGS_ID" \
  --http-method GET \
  --query uri \
  --output text)"
FUNCTION_ARN="$(sed -E 's#.*functions/(arn:[^/]+)/invocations.*#\1#' <<<"$INTEGRATION_URI")"
if [[ "$FUNCTION_ARN" == "$INTEGRATION_URI" ]]; then
  echo "Could not parse Lambda ARN from /readings integration URI: $INTEGRATION_URI" >&2
  exit 1
fi
PARTITION="$(cut -d: -f2 <<<"$FUNCTION_ARN")"

echo "Ensuring Marc's Cognito user exists: $MARC_EMAIL"
if ! aws_cmd cognito-idp admin-get-user \
  --user-pool-id "$USER_POOL_ID" \
  --username "$MARC_EMAIL" >/dev/null 2>&1; then
  aws_cmd cognito-idp admin-create-user \
    --user-pool-id "$USER_POOL_ID" \
    --username "$MARC_EMAIL" \
    --user-attributes Name=email,Value="$MARC_EMAIL" Name=email_verified,Value=true \
    --message-action SUPPRESS >/dev/null
fi

if [[ -n "$MARC_CURRENT_PASSWORD" ]]; then
  aws_cmd cognito-idp admin-set-user-password \
    --user-pool-id "$USER_POOL_ID" \
    --username "$MARC_EMAIL" \
    --password "$MARC_CURRENT_PASSWORD" \
    --permanent >/dev/null
else
  echo "MARC_CURRENT_PASSWORD was not set; user exists but password was not changed."
fi

MARC_SUB="$(aws_cmd cognito-idp admin-get-user \
  --user-pool-id "$USER_POOL_ID" \
  --username "$MARC_EMAIL" \
  --query "UserAttributes[?Name=='sub'].Value | [0]" \
  --output text)"

AUTHORIZER_ID="$(aws_cmd apigateway get-authorizers \
  --rest-api-id "$API_ID" \
  --query "items[?name=='${APP_NAME}-cognito'].id | [0]" \
  --output text)"

if [[ -z "$AUTHORIZER_ID" || "$AUTHORIZER_ID" == "None" ]]; then
  echo "Creating API Gateway Cognito authorizer"
  AUTHORIZER_ID="$(aws_cmd apigateway create-authorizer \
    --rest-api-id "$API_ID" \
    --name "${APP_NAME}-cognito" \
    --type COGNITO_USER_POOLS \
    --provider-arns "$USER_POOL_ARN" \
    --identity-source method.request.header.Authorization \
    --query id \
    --output text)"
else
  echo "Using existing authorizer: $AUTHORIZER_ID"
fi

protect_path_methods /readings GET POST
protect_path_methods '/readings/{id}' PUT DELETE
protect_path_methods /tap GET POST
protect_path_methods '/tap/{id}' PUT DELETE
protect_path_methods /profile GET PUT

AUTH_ID="$(ensure_child_resource "$ROOT_ID" auth /auth)"
AUTH_CONFIG_ID="$(ensure_child_resource "$AUTH_ID" config /auth/config)"
echo "Configuring public GET /auth/config"
put_public_lambda_proxy_method "$AUTH_CONFIG_ID" GET "$INTEGRATION_URI"
put_options_method "$AUTH_CONFIG_ID"
AUTH_CONFIG_SOURCE_ARN="arn:$PARTITION:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/*/auth/config"
if ! aws_cmd lambda add-permission \
  --function-name "$FUNCTION_ARN" \
  --statement-id "apigateway-auth-config-$API_ID" \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "$AUTH_CONFIG_SOURCE_ARN" >/dev/null 2>&1; then
  echo "Lambda permission for /auth/config may already exist; continuing"
fi

echo "Switching Lambda auth mode to Cognito"
ENV_JSON="$(aws_cmd lambda get-function-configuration \
  --function-name "$LAMBDA_FUNCTION_NAME" \
  --query 'Environment.Variables' \
  --output json)"
UPDATED_ENV="$(node -e 'const env=JSON.parse(process.argv[1]||"{}")||{}; env.AUTH_MODE="cognito"; env.LEGACY_USER_SUB=process.argv[2]; env.COGNITO_DOMAIN=process.argv[3]; env.COGNITO_CLIENT_ID=process.argv[4]; env.COGNITO_SCOPES=process.argv[5]; console.log(JSON.stringify({Variables:env}));' "$ENV_JSON" "$MARC_SUB" "$HOSTED_AUTH_DOMAIN" "$USER_POOL_CLIENT_ID" "$COGNITO_SCOPES")"
aws_cmd lambda update-function-configuration \
  --function-name "$LAMBDA_FUNCTION_NAME" \
  --environment "$UPDATED_ENV" >/dev/null
aws_cmd lambda wait function-updated --function-name "$LAMBDA_FUNCTION_NAME"

if [[ "$RUN_LEGACY_MIGRATION" == "1" ]]; then
  echo "Copying legacy readings/profile to Marc's Cognito user namespace"
  (cd "$REPO_ROOT/lambda" && npm ci)
  (
    cd "$REPO_ROOT/lambda"
    TABLE_NAME="$TABLE_NAME" \
    COGNITO_USER_SUB="$MARC_SUB" \
    COGNITO_USER_EMAIL="$MARC_EMAIL" \
    npm run migrate:legacy-user
  )
else
  echo "Skipping legacy data migration. Re-run with RUN_LEGACY_MIGRATION=1 after verifying Marc's user."
fi

echo "Deploying API Gateway stage: $STAGE"
aws_cmd apigateway create-deployment \
  --rest-api-id "$API_ID" \
  --stage-name "$STAGE" \
  --description "Enable Cognito authorizer for $APP_NAME" >/dev/null

cat <<EOF

Cognito setup complete.

The frontend discovers Cognito settings from:
  GET /auth/config

Marc migration values:
  COGNITO_USER_SUB=$MARC_SUB
  COGNITO_USER_EMAIL=$MARC_EMAIL

Reusable auth stack outputs:
  UserPoolId=$USER_POOL_ID
  UserPoolArn=$USER_POOL_ARN
  UserPoolClientId=$USER_POOL_CLIENT_ID
  HostedAuthDomain=$HOSTED_AUTH_DOMAIN
EOF
