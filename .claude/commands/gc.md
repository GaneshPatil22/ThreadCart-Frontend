Create a git commit with an auto-generated commit message. Argument: $ARGUMENTS

## Instructions

1. **Determine staging mode from arguments:**
   - If arguments contain `--staged`: ONLY look at already staged files (`git diff --cached`). Do NOT stage any additional files.
   - Otherwise (default): Stage ALL changed/untracked files using `git add -A`, then proceed.

2. **Gather context — run these in parallel:**
   - `git status` (never use `-uall` flag)
   - `git diff --cached --stat` to see what will be committed
   - `git diff --cached` to see the actual changes
   - `git log --oneline -5` to see recent commit style

3. **Generate the commit message** following this exact format:
   ```
   <type>: <short title under 60 chars>

   - <bullet point 1 describing a key change>
   - <bullet point 2 describing another change>
   - <optional bullet 3>
   - <optional bullet 4>
   - <optional bullet 5>
   ```

   Rules:
   - **Type** must be one of: `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `test`, `perf`, `ci`, `build`
   - **Title**: concise, imperative mood, under 60 characters
   - **Bullet points**: minimum 2, maximum 5. Each describes a meaningful change — not file names, but what was done and why
   - End the message with a blank line and: `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`

4. **Create the commit** using a HEREDOC for proper formatting:
   ```bash
   git commit -m "$(cat <<'EOF'
   <the generated message>

   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
   EOF
   )"
   ```

5. **After committing**, run `git status` to verify success and show the result.

## Important
- Do NOT push to remote — only commit locally
- Do NOT use `--no-verify` or skip any hooks
- If there are no changes to commit, say so and stop
- Do NOT commit files that likely contain secrets (`.env`, credentials, keys)
- If a pre-commit hook fails, fix the issue and create a NEW commit (never amend)
