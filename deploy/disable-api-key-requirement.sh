#!/usr/bin/env bash
set -euo pipefail

# Removes API Gateway "API key required" from browser app routes.
# The app uses JWT/Cognito authorization; API keys in static browser code are
# not secrets and should not be required for end-user requests.

REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-eu-west-1}}"
API_ID="${API_ID:-${API_GATEWAY_REST_API_ID:-gnewkvhgwd}}"
STAGE="${STAGE:-${API_GATEWAY_STAGE:-prod}}"
DEPLOY_STAGE="${DEPLOY_STAGE:-0}"
ORIGIN="${ORIGIN:-https://aquarium.vibeai.software}"
AWS_CLI="${AWS_CLI:-aws}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

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

clear_method_api_key_requirement() {
  local path="$1"
  local method="$2"
  local resource_id
  resource_id="$(get_resource_id "$path")"

  if [[ -z "$resource_id" || "$resource_id" == "None" ]]; then
    echo "Skipping $method $path because the API resource does not exist"
    return
  fi

  if ! aws_cmd apigateway get-method \
    --rest-api-id "$API_ID" \
    --resource-id "$resource_id" \
    --http-method "$method" >/dev/null 2>&1; then
    echo "Skipping $method $path because the method does not exist"
    return
  fi

  echo "Removing API key requirement from $method $path"
  aws_cmd apigateway update-method \
    --rest-api-id "$API_ID" \
    --resource-id "$resource_id" \
    --http-method "$method" \
    --patch-operations op=replace,path=/apiKeyRequired,value=false >/dev/null
}

require_tool "$AWS_CLI"

ROUTES=(
  "/auth/config GET"
  "/auth/login POST"
  "/readings GET"
  "/readings POST"
  "/readings/{id} PUT"
  "/readings/{id} DELETE"
  "/tap GET"
  "/tap POST"
  "/tap/{id} PUT"
  "/tap/{id} DELETE"
  "/profile GET"
  "/profile PUT"
)

for route in "${ROUTES[@]}"; do
  clear_method_api_key_requirement "${route% *}" "${route##* }"
done

echo "Adding CORS headers to API Gateway error responses"
API_ID="$API_ID" ORIGIN="$ORIGIN" REGION="$REGION" AWS_CLI="$AWS_CLI" \
  "$REPO_ROOT/deploy/configure-gateway-cors-responses.sh"

if [[ "$DEPLOY_STAGE" == "1" || "$DEPLOY_STAGE" == "true" || "$DEPLOY_STAGE" == "True" ]]; then
  echo "Deploying API Gateway stage: $STAGE"
  aws_cmd apigateway create-deployment \
    --rest-api-id "$API_ID" \
    --stage-name "$STAGE" \
    --description "Disable browser API key requirement" >/dev/null
fi
