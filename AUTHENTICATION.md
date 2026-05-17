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

The local cloud image does not include the AWS CLI, so the repo includes scripts/templates that can be run from an AWS-enabled machine or CI role.

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
6. Sets Lambda `AUTH_MODE=cognito`.
7. Optionally copies legacy records into Marc's user namespace.
8. Prints the frontend constants required in `index.html`.

After the script completes, copy its printed values into:

```js
const COGNITO_DOMAIN = 'https://...auth.eu-west-1.amazoncognito.com';
const COGNITO_CLIENT_ID = '...';
```

Then commit and deploy the static site.

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
