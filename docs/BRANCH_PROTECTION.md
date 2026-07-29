# Branch protection for `main`

## Current operating policy (direct to main)

Engineering lands on `main` by **direct push**. Pull-request reviews are
optional; branch protection is currently **disabled**.

Recommended before shipping a Render promote:

- CI jobs green on the tip of `main`: `web-and-sdk`, `backend`,
  `render-api-build`, `android-build` (and `staging-smoke` when staging is set)
- No unsigned FSP1 millimetres treated as sizing truth
- Accuracy / merchant metrics reviewed if the release touches measurement or pilot

Production deploys stay **manual** (`autoDeployTrigger: off` in `render.yaml`)
until those gates are green on the commit you intend to ship.

## Re-enable protection (optional)

```bash
gh api repos/technetechtt-dotcom/Fitsense-AI/branches/main/protection \
  --method PUT \
  --input docs/branch-protection-payload.json
```

Payload: [branch-protection-payload.json](./branch-protection-payload.json)
(1 approving review, CODEOWNERS, conversation resolution, no force-push).
