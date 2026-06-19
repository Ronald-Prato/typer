---
name: typer-scalable-feature
description: Use when adding or refactoring Typer features so the agent keeps domain logic pure, Convex mutations thin, UI components small, and tests aligned with scalable architecture.
---

# Typer Scalable Feature

Use this skill for feature work, refactors, or bugfixes in this repo when the
change touches gameplay, typing flows, matchmaking, history, profile/friends, or
Convex persistence.

## Workflow

1. Inspect the exact route/component/mutation/hook involved before planning.
2. Identify the rule, lifecycle, and rendering parts of the change.
3. Put pure rules in `src/domain/*` or `convex/*State.ts` / `convex/*Lifecycle.ts`.
4. Keep Convex functions thin: auth/current user, document reads, pure rule call,
   validated writes, scheduler calls.
5. Keep React components mostly presentational. Put orchestration in small hooks
   near the feature, and shared browser lifecycle in reusable hooks under
   `src/hooks`.
6. Write or update tests next to the extracted rule/hook before broad edits.
7. Run targeted tests first, then `pnpm typecheck`, `pnpm test`, and lint on the
   touched files or full `pnpm lint` when practical.

## Placement Rules

- `src/domain`: deterministic client/domain rules with no React, DOM, Convex, or
  network dependencies.
- `convex/*State.ts`: deterministic server-side state transitions.
- `convex/*Lifecycle.ts`: deterministic decisions about side effects, such as
  who gets history, rewards, queue transitions, or scheduled follow-ups.
- `src/hooks`: reusable browser/React lifecycle such as timers, focus, shortcuts,
  input sessions, and current-user wrappers.
- `src/components/domains/<feature>`: feature composition hooks and presentational
  components. Avoid files over roughly 250 lines unless splitting would make the
  flow harder to read.
- `src/components/ui`: generic visual primitives only. No game, auth, or Convex
  business rules.

## Testing Pattern

- Pure rules: table-style unit tests covering happy path, invalid state,
  duplicate/repeated events, ordering, boundaries, and empty inputs.
- Convex functions: integration tests with `convex-test` for auth, persistence,
  indexes, rewards, history, and permission boundaries.
- Hooks: test shared hooks directly with React Testing Library when lifecycle is
  reused by more than one feature.
- Components: test only reusable UI contracts or feature-critical user behavior.
  Do not snapshot broad animated layout.
- Every extracted abstraction should have at least one test proving why it exists.

## Feature Checklist

- Can the core rule run without React or Convex?
- Is the server still authoritative for order, ownership, status, rewards, and
  persisted metrics?
- Are route components thin enough to scan quickly?
- Are new arrays/objects memoized by stable inputs instead of joined strings?
- Do callbacks handle async failures intentionally instead of fire-and-forget
  when user state depends on the result?
- Did the change reduce duplication or establish a reusable boundary?
- Did tests fail before the fix or cover a new invariant that could regress?

## Verification

Run non-launching checks only unless the user explicitly asks to start the app:

```bash
pnpm typecheck
pnpm test
pnpm lint
```

When full lint has known legacy warnings, still run lint on touched files and
report the remaining global debt separately.
