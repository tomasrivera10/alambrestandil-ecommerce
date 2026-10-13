---
name: focused-code-review
description: Review a code change for actionable defects when the user requests a review or audit; avoid broad repository surveys for routine edits.
---

# Focused code review

Start from the requested diff or changed files and read only the nearby code needed to establish behavior. Identify affected contracts, callers, and tests before expanding scope. Apply relevant `AGENTS.md` review rules.

Report a finding only when it has a concrete failure path or a well-supported regression risk. Give the file and line, triggering condition, impact, and a practical correction. Distinguish observed behavior from inference. Do not turn formatting preferences or speculative risks into findings.

Use targeted checks for disputed behavior. Once the changed paths and material risks are covered, deliver the findings and any verification limits. Reopen the search only when new evidence or user direction changes the scope.
