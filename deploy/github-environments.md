# GitHub deployment protection (AT-036)

The AWS deploy workflow (`.github/workflows/deploy-aws.yml`) targets the GitHub
**`production`** environment. All Lambda and API Gateway changes run only after
that environment’s protection rules are satisfied.

## One-time repository setup

In GitHub: **Settings → Environments → New environment** (or open **`production`**
if it was auto-created on the first workflow run).

Configure **`production`**:

1. **Required reviewers** — Add at least one trusted maintainer (SA-005). Every
   `push` to `main` that matches the workflow paths and every `workflow_dispatch`
   run pauses here until a reviewer approves.
2. **Deployment branches** (recommended) — Restrict deployments to **`main`** only
   (complements AT-048 OIDC branch restrictions in `deploy/github-oidc-trust-policy.json`).
3. **OIDC trust policy (AT-048)** — From an AWS-enabled machine, run
   `deploy/apply-github-oidc-trust-policy.sh` so `aquarium-github-deploy-role` only accepts
   tokens for `environment:production` on `refs/heads/main`, plus optional release tags.
4. **Environment secrets** (optional) — Move `MARC_CURRENT_PASSWORD` here instead of
   repository secrets if only production deploys should read it.

Do **not** disable required reviewers on `production` unless you accept
unattended deploys to the live API again.

## What still auto-runs

- **Lint** (`.github/workflows/lint.yml`) and **E2E** (`.github/workflows/e2e.yml`)
  are unchanged; they do not use the `production` environment.
- **Static frontend** deploys via GitHub Pages on `main` without this gate (Pages
  is separate from the AWS workflow).

## Optional follow-up (AT-050)

To stop *starting* deploy workflows on every `lambda/` / `deploy/` push, remove or
narrow the `push` trigger in `deploy-aws.yml` and rely on `workflow_dispatch` only.
Environment reviewers already block AWS changes without approval; AT-050 is about
reducing noisy workflow runs and separating infra scripts from routine Lambda deploys.
