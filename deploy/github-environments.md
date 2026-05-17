# GitHub deployment protection (AT-036)

AWS deploy workflows target the GitHub **`production`** environment. All Lambda
and API Gateway changes run only after that environment’s protection rules are
satisfied.

| Workflow | Purpose | Triggers |
|----------|---------|----------|
| [deploy-aws.yml](../.github/workflows/deploy-aws.yml) | Publish Lambda code (`update-function-code`) | `push` to `main` when `lambda/**` changes; `workflow_dispatch` |
| [deploy-aws-infra.yml](../.github/workflows/deploy-aws-infra.yml) | Cognito setup, API key policy, API Gateway stage | `workflow_dispatch` only (AT-050) |

Changes under `deploy/**` no longer start a workflow on push; run the infra
workflow manually when scripts or gateway/Cognito config change.

## One-time repository setup

In GitHub: **Settings → Environments → New environment** (or open **`production`**
if it was auto-created on the first workflow run).

Configure **`production`**:

1. **Required reviewers** — Add at least one trusted maintainer (SA-005). Every
   matching `push` to `main` and every `workflow_dispatch` run pauses here until
   a reviewer approves.
2. **Deployment branches** (recommended) — Restrict deployments to **`main`** only
   (complements AT-048 OIDC branch restrictions).
3. **Environment secrets** (optional) — Move `MARC_CURRENT_PASSWORD` here instead of
   repository secrets if only production deploys should read it.

Do **not** disable required reviewers on `production` unless you accept
unattended deploys to the live API again.

## What still auto-runs

- **Lint** (`.github/workflows/lint.yml`) and **E2E** (`.github/workflows/e2e.yml`)
  are unchanged; they do not use the `production` environment.
- **Static frontend** deploys via GitHub Pages on `main` without this gate (Pages
  is separate from the AWS workflows).

## Infra workflow (AT-050)

Use **Deploy AWS infrastructure** when you need:

- Cognito / authorizer / Lambda auth env (`enable_cognito_setup = true`; requires
  `MARC_CURRENT_PASSWORD`)
- API Gateway JWT routes and prod stage redeploy (`update_api_gateway = true`, default)

Cognito setup bundles and publishes Lambda in the same run before
`deploy/setup-cognito-auth.sh`. For code-only backend changes, rely on the Lambda
workflow (or run infra with Cognito disabled and gateway update off).
