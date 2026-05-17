#!/usr/bin/env bash
set -euo pipefail

# AT-048 / SA-022: apply deploy/github-oidc-trust-policy.json to the GitHub OIDC deploy role.
# Requires IAM permission iam:UpdateAssumeRolePolicy on aquarium-github-deploy-role.

ROLE_NAME="${GITHUB_DEPLOY_ROLE_NAME:-aquarium-github-deploy-role}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
POLICY_FILE="${SCRIPT_DIR}/github-oidc-trust-policy.json"
AWS_CLI="${AWS_CLI:-aws}"

require_tool() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required tool: $1" >&2
    exit 1
  fi
}

require_tool "$AWS_CLI"

if [[ ! -f "$POLICY_FILE" ]]; then
  echo "Trust policy not found: $POLICY_FILE" >&2
  exit 1
fi

echo "Updating assume-role policy for ${ROLE_NAME} from ${POLICY_FILE}"
"$AWS_CLI" iam update-assume-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-document "file://${POLICY_FILE}"

echo "Done. OIDC trust is restricted to production environment on main and release tags."
