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

  if [[ "$api_key_required" == "true" || "$api_key_required" == "True" ]]; then
    api_key_flag="--api-key-required"
  fi

  delete_method_if_exists "$resource_id" "$method"
  aws_cmd apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$resource_id" \
    --http-method "$method" \
    --authorization-type NONE \
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
  local allow_methods="'GET,PUT,OPTIONS'"
  local allow_headers="'Content-Type,Authorization,x-api-key'"
  local allow_origin="'$ORIGIN'"

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
    --response-parameters "{\"method.response.header.Access-Control-Allow-Headers\":$allow_headers,\"method.response.header.Access-Control-Allow-Methods\":$allow_methods,\"method.response.header.Access-Control-Allow-Origin\":$allow_origin}" >/dev/null
}

put_cors_gateway_response() {
  local response_type="$1"
  local status_code="$2"
  aws_cmd apigateway put-gateway-response \
    --rest-api-id "$API_ID" \
    --response-type "$response_type" \
    --status-code "$status_code" \
    --response-parameters "gatewayresponse.header.Access-Control-Allow-Origin='$ORIGIN',gatewayresponse.header.Access-Control-Allow-Headers='Content-Type,Authorization,x-api-key',gatewayresponse.header.Access-Control-Allow-Methods='GET,POST,PUT,DELETE,OPTIONS'" >/dev/null
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

API_KEY_REQUIRED="$(aws_cmd apigateway get-method \
  --rest-api-id "$API_ID" \
  --resource-id "$READINGS_ID" \
  --http-method GET \
  --query apiKeyRequired \
  --output text)"

if [[ "$SKIP_LAMBDA" != "1" ]]; then
  echo "Building and updating Lambda function: $FUNCTION_NAME"
  (cd "$REPO_ROOT/lambda" && npm ci && npm run bundle)
  rm -f "$ZIP_PATH"
  (cd "$REPO_ROOT/lambda" && zip -q "$ZIP_PATH" bundle.js)
  aws_cmd lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file "fileb://$ZIP_PATH" >/dev/null
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

echo "Adding CORS headers to default API Gateway error responses"
put_cors_gateway_response DEFAULT_4XX 400
put_cors_gateway_response DEFAULT_5XX 500

echo "Deploying API Gateway stage: $STAGE"
DEPLOYMENT_ID="$(aws_cmd apigateway create-deployment \
  --rest-api-id "$API_ID" \
  --stage-name "$STAGE" \
  --description "Deploy profile API routes" \
  --query id \
  --output text)"

echo "Deployment complete: $DEPLOYMENT_ID"
echo "Verify: curl -i -X OPTIONS https://$API_ID.execute-api.$REGION.amazonaws.com/$STAGE/profile"
