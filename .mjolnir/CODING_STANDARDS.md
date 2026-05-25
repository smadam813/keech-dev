# Coding Standards

These standards guide the review phase. Adapt them to your project's language
and conventions — edit this file freely.

## Clarity over cleverness

- Prefer explicit, readable code to compact or clever constructs.
- Name things for what they are. Avoid abbreviations that aren't domain terms.
- Keep functions focused on one responsibility. Split when a function grows
  hard to hold in your head at once.

## Structure

- Reduce nesting: prefer early returns over deeply nested conditionals.
- Avoid nested ternaries — use if/else or a switch.
- Remove dead code and redundant abstractions rather than leaving them.

## Correctness

- New or changed behaviour must be covered by tests.
- No unchecked casts or silent assumptions on external input.
- Never introduce injection vulnerabilities or credential leaks.

## Comments

- Comment *why*, not *what*. Delete comments that merely restate the code.

## Non-negotiable

- Never change observable behaviour during a review pass. Refactors must
  preserve all original features, outputs, and behaviours.
