# Branch protection for `main`

CODEOWNERS alone does not enforce reviews. Configure GitHub branch protection
so critical security and measurement changes cannot land without CI and review.

## Required settings (Settings → Branches → Branch protection rule → `main`)

1. **Require a pull request before merging**
2. **Require approvals**: at least 1
3. **Require review from Code Owners** (uses [`.github/CODEOWNERS`](../.github/CODEOWNERS))
4. **Require status checks to pass before merging**
   - `web-and-sdk`
   - `backend`
   - `android-build`
5. **Require conversation resolution before merging**
6. **Do not allow bypassing the above settings** (except emergency admins)

## Apply with GitHub CLI (repo admin)

```bash
gh api repos/{owner}/{repo}/branches/main/protection \
  --method PUT \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["web-and-sdk", "backend", "android-build"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "require_code_owner_reviews": true
  },
  "restrictions": null,
  "required_conversation_resolution": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

Replace `{owner}/{repo}` with `technetechtt-dotcom/Fitsense-AI` (or your fork).
