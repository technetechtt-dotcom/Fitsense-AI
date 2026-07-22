# Branch protection for `main`

CODEOWNERS alone does not enforce reviews. **Do not re-enable Render
`autoDeployTrigger: commit` until this protection is active.**

## Required settings (Settings → Branches → Branch protection rule → `main`)

1. **Require a pull request before merging**
2. **Require approvals**: at least 1
3. **Require review from Code Owners** (uses [`.github/CODEOWNERS`](../.github/CODEOWNERS))
4. **Require status checks to pass before merging**
   - `web-and-sdk`
   - `backend`
   - `render-api-build`
   - `android-build`
5. **Require conversation resolution before merging**
6. **Do not allow bypassing the above settings** (except emergency admins)

## Apply with GitHub CLI (repo admin)

```bash
gh api repos/technetechtt-dotcom/Fitsense-AI/branches/main/protection \
  --method PUT \
  --input docs/branch-protection-payload.json
```

Payload file: [branch-protection-payload.json](./branch-protection-payload.json).

### Verify

```bash
gh api repos/technetechtt-dotcom/Fitsense-AI/branches/main/protection \
  --jq "{checks:.required_status_checks.contexts, pr_reviews:.required_pull_request_reviews.required_approving_review_count, code_owners:.required_pull_request_reviews.require_code_owner_reviews, enforce_admins:.enforce_admins.enabled, conversations:.required_conversation_resolution}"
```

Expect required checks `web-and-sdk`, `backend`, `render-api-build`,
`android-build`; PR reviews ≥ 1 with code owners; `enforce_admins: true`.

After protection is confirmed, set Render Blueprint `autoDeployTrigger: commit`
(or enable auto-deploy in the dashboard) for **production** `fitsense-api` and
`fitsense-web` only. Keep staging auto-deploy policy explicit and separate.
