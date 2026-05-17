#!/usr/bin/env bash
set -euo pipefail

# Adds CORS headers to API Gateway gateway responses so browser clients see the
# real HTTP status when Lambda/integration fails (not a misleading CORS error).
# Idempotent; safe to run from CI and manual deploy scripts.

REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-eu-west-1}}"
API_ID="${API_ID:-${API_GATEWAY_REST_API_ID:-gnewkvhgwd}}"
ORIGIN="${ORIGIN:-https://aquarium.vibeai.software}"
AWS_CLI="${AWS_CLI:-aws}"

# DEFAULT_* catch broad classes; integration/authorizer types cover Lambda crashes,
# timeouts, and Cognito authorizer failures that otherwise omit CORS headers.
GATEWAY_RESPONSE_TYPES=(
  DEFAULT_4XX
  DEFAULT_5XX
  INTEGRATION_FAILURE
  INTEGRATION_TIMEOUT
  AUTHORIZER_FAILURE
  AUTHORIZER_CONFIGURATION_ERROR
)

require_tool() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required tool: $1" >&2
    exit 1
  fi
}

aws_cmd() {
  "$AWS_CLI" --region "$REGION" "$@"
}

put_cors_gateway_response() {
  local response_type="$1"
  local response_parameters
  response_parameters="$(ORIGIN="$ORIGIN" node <<'NODE'
const origin = process.env.ORIGIN;
console.log(
  JSON.stringify({
    'gatewayresponse.header.Access-Control-Allow-Origin': `'${origin}'`,
    'gatewayresponse.header.Access-Control-Allow-Headers': `'Content-Type,Authorization'`,
    'gatewayresponse.header.Access-Control-Allow-Methods': `'GET,POST,PUT,DELETE,OPTIONS'`,
  })
);
NODE
)"
  echo "Configuring gateway response CORS: $response_type"
  aws_cmd apigateway put-gateway-response \
    --rest-api-id "$API_ID" \
    --response-type "$response_type" \
    --response-parameters "$response_parameters" >/dev/null
}

require_tool "$AWS_CLI"

echo "API $API_ID ($REGION): CORS on gateway error responses (origin $ORIGIN)"
for response_type in "${GATEWAY_RESPONSE_TYPES[@]}"; do
  put_cors_gateway_response "$response_type"
done
echo "Gateway response CORS configuration complete"
