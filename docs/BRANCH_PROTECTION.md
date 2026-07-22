# Branch protection for `main`

## Current operating policy (direct push)

Production deploys stay **manual** (`autoDeployTrigger: off` in `render.yaml`)
until release gates are green. Day-to-day engineering **pushes directly to
`main`**; GitHub PR merge gates are **not** enforced.

CI still runs on every push to `main`. Treat these four jobs as **release
gates** before any production deploy:

- `web-and-sdk`
- `backend`
- `render-api-build`
- `android-build`

Optional: `staging-smoke` when repo variable `STAGING_API_BASE_URL` is set.
Artifacts: debug APK, Android unit-test reports, staging smoke JSON.

## Optional PR protection (when the team wants reviews again)

Use Settings → Branches → `main`, or:

```bash
gh api repos/technetechtt-dotcom/Fitsense-AI/branches/main/protection \
  --method PUT \
  --input docs/branch-protection-payload.json
```

Payload: [branch-protection-payload.json](./branch-protection-payload.json).

Required checks must include the four jobs above. **Do not** set Render
`autoDeployTrigger: commit` until those gates are green on the commit you
intend to ship.
