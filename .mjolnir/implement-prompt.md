# TASK

Fix issue {{TASK_ID}}: {{ISSUE_TITLE}}

Pull in the issue using `gh issue view <ID>`. If it has a parent PRD or tracking issue, pull that in too.

Only work on the issue specified.

Work on branch `{{BRANCH}}`. Make commits and run the project's tests.

# CONTEXT

Here are the last 10 commits:

<recent-commits>

!`git log -n 10 --format="%H%n%ad%n%B---" --date=short`

</recent-commits>

# EXPLORATION

Explore the repo and fill your context window with relevant information that will allow you to complete the task.

Pay extra attention to test files that touch the relevant parts of the code.

# EXECUTION

If applicable, use red-green-refactor to complete the task:

1. RED: write one failing test
2. GREEN: write the implementation to pass that test
3. REPEAT until done
4. REFACTOR the code

# FEEDBACK LOOPS

Before committing, run the project's build and test commands and ensure they pass.

# COMMIT

Make a git commit. The commit message must:

1. Summarize the task completed (and reference the PRD if there is one)
2. Note key decisions made
3. List files changed
4. Note any blockers or follow-ups

Keep it concise.

# THE ISSUE

If the task is not complete, leave a comment on the issue describing what was done.

Do not close the issue — it is closed by a human when the pull request is merged.

Once complete, output <promise>COMPLETE</promise>.

# FINAL RULES

ONLY WORK ON A SINGLE TASK.
