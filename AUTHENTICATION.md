# Cognito authentication migration

This repo now supports a Cognito-first authenticated-user architecture while retaining the legacy password gate as a fallback until Cognito is configured.

## Target architecture

- Cognito User Pool on the Essentials tier.
- Cognito Hosted UI / Managed Login with authorization-code + PKCE.
- Email/password sign-in enabled.
- Passkeys enabled with `WEB_AUTHN` as an allowed first factor.
- API Gateway REST API methods protected by a Cognito user-pool authorizer.
- Lambda reads the authenticated user from API Gateway claims.
- DynamoDB records are copied into user-scoped partitions:

```text
type = USER#<cognito-sub>#tank
type = USER#<cognito-sub>#tap
type = USER#<cognito-sub>#profile
id   = existing reading id, or default for profile
```

The existing shared records are copied, not deleted, so rollback remains possible.

## Deploy Cognito for this app

The local cloud image does not include the AWS CLI, so the repo includes scripts/templates that can be run from an AWS-enabled machine or the GitHub Actions OIDC deploy role.

```bash
export MARC_CURRENT_PASSWORD='the current app password'
export RUN_LEGACY_MIGRATION=1
deploy/setup-cognito-auth.sh
```

The script:

1. Deploys `deploy/cognito-auth-template.yaml`.
2. Creates or reuses Marc's Cognito user: `marc@amphletts.uk`.
3. Sets Marc's permanent password when `MARC_CURRENT_PASSWORD` is provided.
4. Creates/reuses an API Gateway Cognito authorizer.
5. Protects the existing `/readings`, `/tap`, and `/profile` methods.
6. Creates public `GET /auth/config` so the static frontend can discover Cognito settings at runtime.
7. Optionally copies legacy records into Marc's user namespace.
8. Sets Lambda `AUTH_MODE=cognito`, `COGNITO_DOMAIN`, `COGNITO_CLIENT_ID`, and `COGNITO_SCOPES`.

By default, the Cognito hosted domain prefix is account-specific:

```text
aquarium-tracker-<aws-account-id>-prod
```

Override it with `AUTH_DOMAIN_PREFIX` only if you need a custom Cognito prefix.

The static frontend first checks the constants in `index.html`, then falls back to `GET /auth/config`. This avoids committing generated Cognito client IDs to the static site.

## GitHub Actions setup

`.github/workflows/deploy-aws.yml` can run the Cognito setup after deploying Lambda. Use `workflow_dispatch` with:

- `enable_cognito_setup = true`
- `run_legacy_migration = true` only after setting the repository secret `MARC_CURRENT_PASSWORD`

The deploy role must have the permissions in `deploy/github-deploy-policy.json`. The separate `deploy/cognito-deploy-policy.json` is kept as a smaller standalone reference for applying only the Cognito migration permissions.

## Passkey enrollment

The first practical path is:

1. Marc signs in with email and the current password.
2. Cognito prompts/allows passkey creation through managed login.
3. Future sign-ins can use passkey where the browser/device supports it.

Keep email/password available as an accessibility and recovery fallback. Passkeys are excellent for phishing resistance, but some users will be on shared devices, older browsers, assistive technology setups, or device-change paths where password/email recovery is still important.

## Reusing this as a template

For future projects, copy:

- `deploy/cognito-auth-template.yaml`
- the PKCE helper block from `index.html`
- the Lambda `requireAuth`/`dataTypeFor` pattern from `lambda/index.mjs`

Project-specific values to change:

- `AppName`
- `HostedAuthDomainPrefix`
- callback/logout URL
- API Gateway REST API ID
- protected route list
- table key strategy

For a new project, prefer a table designed around user ownership from the start:

```text
pk = USER#<cognito-sub>
sk = RESOURCE#<id>
```

This app keeps the existing `type`/`id` table shape to avoid a DynamoDB table replacement.

## Cost expectation

With fewer than 10,000 monthly active users and Cognito Essentials, this should remain inside Cognito's free MAU tier for direct/social users. SMS or high-volume machine-to-machine token usage would be billed separately; this design does not require SMS.
