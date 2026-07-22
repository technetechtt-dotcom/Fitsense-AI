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

After protection is confirmed, set Render Blueprint `autoDeployTrigger: commit`
(or enable auto-deploy in the dashboard) for `fitsense-api` and `fitsense-web`.
