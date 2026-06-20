# CLAUDE.md

## Project Working Rules

1. Never modify code directly on the main branch.
2. Before editing files, always explain the plan first.
3. Do not refactor unrelated code.
4. Do not modify unrelated files.
5. Do not commit API keys, .env files, tokens, or local cache files.
6. After each implementation, summarize:
   - changed files
   - reason for each change
   - test/build result
   - remaining risks
7. For bugs, first explain how to reproduce the issue.
8. For new features, first define acceptance criteria.
9. Keep changes small and task-focused.
10. If the task is unclear, ask before editing.
11. After type/syntax checks pass, automatically run verification tests (start dev server, call affected APIs, confirm expected behavior) before committing.

## Git Workflow

- main is the stable branch.
- Each bug fix must use a branch named bug/xxx.
- Each new feature must use a branch named feature/xxx.
- Prefer git worktree for larger or risky tasks.
- Commit only after tests or build pass.
- Never run `git push` automatically. Always wait for the user to explicitly request it or push manually.

## Recommended Commands

- Check status: git status
- Show diff: git diff
- Build: npm run build
- Test: npm test
- Lint: npm run lint
