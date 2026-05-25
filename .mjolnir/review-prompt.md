# TASK

Review the code changes on branch `{{BRANCH}}` and improve code clarity, consistency, and maintainability while preserving exact functionality.

# CONTEXT

## Branch diff

<!--
  Diff against the host branch this issue branched from, not the issue branch
  against itself. In a per-issue sandbox SOURCE_BRANCH == BRANCH, so a
  SOURCE_BRANCH...BRANCH diff would be empty. HEAD is the tip of {{BRANCH}}.
-->

!`git diff {{TARGET_BRANCH}}...HEAD`

## Commits on this branch

!`git log {{TARGET_BRANCH}}..HEAD --oneline`

# REVIEW PROCESS

1. **Understand the change**: read the diff and commits above to understand the intent.

2. **Analyze for improvements**: look for opportunities to:
   - Reduce unnecessary complexity and nesting
   - Eliminate redundant code and abstractions
   - Improve readability through clear variable and function names
   - Consolidate related logic
   - Remove comments that merely restate the code
   - Prefer explicit control flow over overly compact constructs

3. **Check correctness**:
   - Does the implementation match the intent? Are edge cases handled?
   - Are new/changed behaviours covered by tests?
   - Are there unsafe casts or unchecked assumptions?
   - Does the change introduce injection vulnerabilities, credential leaks, or other security issues?

4. **Maintain balance**: avoid over-simplification that reduces clarity, creates overly clever solutions, combines too many concerns, or removes helpful abstractions.

5. **Apply project standards**: follow the coding standards in @.mjolnir/CODING_STANDARDS.md

6. **Preserve functionality**: never change what the code does — only how it does it. All original features, outputs, and behaviours must remain intact.

# EXECUTION

If you find improvements to make:

1. Make the changes directly on this branch
2. Run the project's build and tests to ensure nothing is broken
3. Commit describing the refinements

If the code is already clean and well-structured, do nothing.

Once complete, output <promise>COMPLETE</promise>.
