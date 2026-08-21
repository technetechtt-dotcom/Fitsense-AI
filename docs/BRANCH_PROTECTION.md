# Branch policy for `main`

## Operating policy (binding): direct push to `main`

- Land all engineering work by **pushing directly to `main`**.
- **Do not open pull requests** for routine development unless the operator
  explicitly asks for a PR again.
- Branch protection is **disabled** so direct pushes succeed.
- Prefer a single linear history on `main`; delete finished feature branches
  after their commits are on `main`.

Recommended before shipping a Render promote:

- CI jobs green on the tip of `main`: `web-and-sdk`, `backend`,
  `render-api-build`, `android-build` (and `staging-smoke` when staging is set)
- No unsigned FSP1 millimetres treated as sizing truth
- Accuracy / merchant metrics reviewed if the release touches measurement or pilot

Production deploys stay **manual** (`autoDeployTrigger: off` in `render.yaml`)
until those gates are green on the commit you intend to ship.

## Re-enable PR protection (only if requested)

```bash
gh api repos/technetechtt-dotcom/Fitsense-AI/branches/main/protection \
  --method PUT \
  --input docs/branch-protection-payload.json
```

Payload: [branch-protection-payload.json](./branch-protection-payload.json)
(1 approving review, CODEOWNERS, conversation resolution, no force-push).
