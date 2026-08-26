# Emergency bypass of branch protection

Use only when:

- Production is down or a security hotfix cannot wait for a second reviewer, **and**
- No independent reviewer is available within the SLA.

## Procedure

1. Record incident ID / reason in `#ops` and open a GitHub issue `emergency-bypass-YYYY-MM-DD`.
2. Temporarily delete branch protection:
   `gh api repos/technetechtt-dotcom/Fitsense-AI/branches/main/protection -X DELETE`
3. Merge the PR (prefer `--merge`, never force-push).
4. Immediately restore protection:
   `gh api repos/technetechtt-dotcom/Fitsense-AI/branches/main/protection --method PUT --input docs/branch-protection-payload.json`
5. Request retrospective review within 24h; attach the bypass issue.

Routine sole-maintainer merges still require this path while there is only one
CODEOWNER with write access — self-approval is blocked by `enforce_admins`.
