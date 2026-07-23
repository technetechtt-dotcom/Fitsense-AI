# Branch protection for `main`

## Current operating policy (protected PRs)

Engineering lands on `main` **only via pull requests**. Direct pushes and
force-pushes to `main` are blocked. Required status checks must pass before
merge:

- `web-and-sdk`
- `backend`
- `render-api-build`
- `android-build`

Optional: `staging-smoke` when repo variable `STAGING_API_BASE_URL` is set
(does not block merge unless added to the required contexts).

Production deploys stay **manual** (`autoDeployTrigger: off` in `render.yaml`)
until those gates are green on the commit you intend to ship.

## Enable / refresh protection

```bash
gh api repos/technetechtt-dotcom/Fitsense-AI/branches/main/protection \
  --method PUT \
  --input docs/branch-protection-payload.json
```

Payload: [branch-protection-payload.json](./branch-protection-payload.json)
(1 approving review, CODEOWNERS, conversation resolution, no force-push).

## Release checklist before Render promote

1. All four required CI jobs green on the merge commit.
2. Staging smoke record attached when staging is available.
3. No unsigned FSP1 millimetres treated as sizing truth.
4. Accuracy / merchant metrics reviewed if the release touches measurement or pilot.
