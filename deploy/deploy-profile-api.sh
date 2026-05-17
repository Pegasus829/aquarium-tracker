#!/usr/bin/env bash
set -euo pipefail

# Idempotently deploys the Lambda bundle and API Gateway /profile routes.
# Required credentials: AWS CLI identity with Lambda update and API Gateway write access.

REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-eu-west-1}}"
API_ID="${API_ID:-gnewkvhgwd}"
STAGE="${STAGE:-prod}"
ORIGIN="${ORIGIN:-https://aquarium.vibeai.software}"
SKIP_LAMBDA="${SKIP_LAMBDA:-0}"
AWS_CLI="${AWS_CLI:-aws}"
AUTHORIZATION_TYPE="${AUTHORIZATION_TYPE:-NONE}"
AUTHORIZER_ID="${AUTHORIZER_ID:-}"
REQUIRE_API_KEY="${REQUIRE_API_KEY:-0}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ZIP_PATH="$REPO_ROOT/deploy/aquarium-api.zip"

require_tool() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required tool: $1" >&2
    exit 1
  fi
}

aws_cmd() {
  "$AWS_CLI" --region "$REGION" "$@"
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

put_lambda_proxy_method() {
  local resource_id="$1"
  local method="$2"
  local integration_uri="$3"
  local api_key_required="$4"
  local api_key_flag="--no-api-key-required"
  local auth_args=(--authorization-type "$AUTHORIZATION_TYPE")

  if [[ "$api_key_required" == "true" || "$api_key_required" == "True" ]]; then
    api_key_flag="--api-key-required"
  fi
  if [[ "$AUTHORIZATION_TYPE" == "COGNITO_USER_POOLS" ]]; then
    if [[ -z "$AUTHORIZER_ID" ]]; then
      echo "AUTHORIZER_ID is required when AUTHORIZATION_TYPE=COGNITO_USER_POOLS" >&2
      exit 1
    fi
    auth_args+=(--authorizer-id "$AUTHORIZER_ID")
  fi

  delete_method_if_exists "$resource_id" "$method"
  aws_cmd apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$resource_id" \
    --http-method "$method" \
    "${auth_args[@]}" \
    "$api_key_flag" >/dev/null

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
  local allow_methods="${2:-GET,PUT,OPTIONS}"

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
    --response-parameters "{\"method.response.header.Access-Control-Allow-Headers\":\"'Content-Type,Authorization'\",\"method.response.header.Access-Control-Allow-Methods\":\"'${allow_methods}'\",\"method.response.header.Access-Control-Allow-Origin\":\"'${ORIGIN}'\"}" >/dev/null
}

require_tool "$AWS_CLI"
require_tool npm
require_tool zip

ACCOUNT_ID="$(aws_cmd sts get-caller-identity --query Account --output text)"
ROOT_ID="$(get_resource_id /)"
READINGS_ID="$(get_resource_id /readings)"

if [[ -z "$ROOT_ID" || "$ROOT_ID" == "None" ]]; then
  echo "Could not find API Gateway root resource for API $API_ID" >&2
  exit 1
fi
if [[ -z "$READINGS_ID" || "$READINGS_ID" == "None" ]]; then
  echo "Could not find /readings resource to copy Lambda integration from" >&2
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
FUNCTION_NAME="${LAMBDA_FUNCTION_NAME:-${FUNCTION_ARN##*:function:}}"
FUNCTION_NAME="${FUNCTION_NAME%%:*}"
PARTITION="$(cut -d: -f2 <<<"$FUNCTION_ARN")"

API_KEY_REQUIRED=false
if [[ "$REQUIRE_API_KEY" == "1" || "$REQUIRE_API_KEY" == "true" || "$REQUIRE_API_KEY" == "True" ]]; then
  API_KEY_REQUIRED=true
fi

if [[ "$SKIP_LAMBDA" != "1" ]]; then
  echo "Building and updating Lambda function: $FUNCTION_NAME"
  (cd "$REPO_ROOT/lambda" && npm ci && npm run bundle)
  rm -f "$ZIP_PATH"
  (cd "$REPO_ROOT/lambda" && zip -q "$ZIP_PATH" bundle.js)
  aws_cmd lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file "fileb://$ZIP_PATH" >/dev/null
  aws_cmd lambda wait function-updated --function-name "$FUNCTION_NAME"
  aws_cmd lambda update-function-configuration \
    --function-name "$FUNCTION_NAME" \
    --handler bundle.handler >/dev/null
  aws_cmd lambda wait function-updated --function-name "$FUNCTION_NAME"
else
  echo "Skipping Lambda code update because SKIP_LAMBDA=1"
fi

PROFILE_ID="$(get_resource_id /profile)"
if [[ -z "$PROFILE_ID" || "$PROFILE_ID" == "None" ]]; then
  echo "Creating /profile resource"
  PROFILE_ID="$(aws_cmd apigateway create-resource \
    --rest-api-id "$API_ID" \
    --parent-id "$ROOT_ID" \
    --path-part profile \
    --query id \
    --output text)"
else
  echo "Using existing /profile resource: $PROFILE_ID"
fi

echo "Configuring GET/PUT /profile Lambda proxy methods"
put_lambda_proxy_method "$PROFILE_ID" GET "$INTEGRATION_URI" "$API_KEY_REQUIRED"
put_lambda_proxy_method "$PROFILE_ID" PUT "$INTEGRATION_URI" "$API_KEY_REQUIRED"

echo "Configuring OPTIONS /profile CORS method"
put_options_method "$PROFILE_ID"

echo "Ensuring API Gateway may invoke Lambda for /profile"
SOURCE_ARN="arn:$PARTITION:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/*/profile"
if ! aws_cmd lambda add-permission \
  --function-name "$FUNCTION_ARN" \
  --statement-id "apigateway-profile-$API_ID" \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "$SOURCE_ARN" >/dev/null 2>&1; then
  echo "Lambda permission may already exist; continuing"
fi

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

TAP_ID="$(get_resource_id /tap)"
READINGS_ID_RESOURCE="$(get_resource_id /readings/{id})"
if [[ -z "$READINGS_ID_RESOURCE" || "$READINGS_ID_RESOURCE" == "None" ]]; then
  echo "Creating /readings/{id} resource"
  READINGS_ID_RESOURCE="$(ensure_child_resource "$READINGS_ID" '{id}' '/readings/{id}')"
else
  echo "Using existing /readings/{id} resource: $READINGS_ID_RESOURCE"
fi

echo "Configuring PUT/DELETE /readings/{id} Lambda proxy methods"
put_lambda_proxy_method "$READINGS_ID_RESOURCE" PUT "$INTEGRATION_URI" "$API_KEY_REQUIRED"
put_lambda_proxy_method "$READINGS_ID_RESOURCE" DELETE "$INTEGRATION_URI" "$API_KEY_REQUIRED"
put_options_method "$READINGS_ID_RESOURCE" "GET,PUT,DELETE,OPTIONS"

if [[ -n "$TAP_ID" && "$TAP_ID" != "None" ]]; then
  TAP_ID_RESOURCE="$(get_resource_id /tap/{id})"
  if [[ -z "$TAP_ID_RESOURCE" || "$TAP_ID_RESOURCE" == "None" ]]; then
    echo "Creating /tap/{id} resource"
    TAP_ID_RESOURCE="$(ensure_child_resource "$TAP_ID" '{id}' '/tap/{id}')"
  else
    echo "Using existing /tap/{id} resource: $TAP_ID_RESOURCE"
  fi
  echo "Configuring PUT/DELETE /tap/{id} Lambda proxy methods"
  put_lambda_proxy_method "$TAP_ID_RESOURCE" PUT "$INTEGRATION_URI" "$API_KEY_REQUIRED"
  put_lambda_proxy_method "$TAP_ID_RESOURCE" DELETE "$INTEGRATION_URI" "$API_KEY_REQUIRED"
  put_options_method "$TAP_ID_RESOURCE" "GET,PUT,DELETE,OPTIONS"
else
  echo "Skipping /tap/{id} routes because /tap resource was not found"
fi

echo "Adding CORS headers to API Gateway error responses"
API_ID="$API_ID" ORIGIN="$ORIGIN" REGION="$REGION" AWS_CLI="$AWS_CLI" \
  "$REPO_ROOT/deploy/configure-gateway-cors-responses.sh"

echo "Deploying API Gateway stage: $STAGE"
DEPLOYMENT_ID="$(aws_cmd apigateway create-deployment \
  --rest-api-id "$API_ID" \
  --stage-name "$STAGE" \
  --description "Deploy profile API routes" \
  --query id \
  --output text)"

echo "Deployment complete: $DEPLOYMENT_ID"
echo "Verify: curl -i -X OPTIONS https://$API_ID.execute-api.$REGION.amazonaws.com/$STAGE/profile"
