@/Users/ron/.codex/RTK.md

# Project instructions

- Do not run, start, preview, or otherwise launch the application or its dev server unless the user explicitly asks for it in the current request.
- This includes commands such as `pnpm dev`, `npm run dev`, `next dev`, `convex dev`, or any equivalent app-running command.
- It is still acceptable to run non-launching checks, tests, formatters, linters, or one-off scripts when they are needed for the requested work.

# Scalable code patterns

Use these patterns for every new feature, bugfix, and refactor in this repo.

## Architecture boundaries

- Put deterministic client-side rules in `src/domain/*`. These files must not
  import React, DOM APIs, router APIs, Convex, or network clients.
- Put deterministic server-side state transitions in `convex/*State.ts`.
  Examples: step ordering, queue selection, status transitions, validation
  ranges, and permission predicates.
- Put deterministic server-side lifecycle decisions in `convex/*Lifecycle.ts`.
  Examples: who receives history records, reward patches, queue cleanup, and
  scheduled follow-up decisions.
- Keep Convex queries/mutations thin and readable in this order: authenticate or
  identify the current user, read required documents, call pure state/lifecycle
  helpers, write validated patches, schedule follow-ups.
- Any Convex query over data that can grow with users must use an index plus a
  bounded page size or Convex cursor pagination. Avoid `.filter()` over a whole
  table and avoid `.collect()` for user-facing lists unless the table is known
  to be tiny and the reason is documented.
- Search fields must be normalized and persisted separately from display fields.
  For user search, write `nicknameSearch` with `normalizeNicknameSearch()` on
  create/update and backfill old rows before relying on indexed search.
- Matchmaking must be stale-work safe. Scheduled jobs need an attempt marker or
  persisted timestamp check and must re-read users immediately before creating a
  game. Never create a match for a user with `activeGame`, `game_found`, or
  `in_game`.
- Bot matches must snapshot display identity on the `game`/`gameHistory`
  document. Do not mutate a shared bot user row to represent a specific match.
- Keep React components mostly presentational. Move orchestration into small
  feature hooks and shared browser lifecycle into `src/hooks`.
- Shared UI primitives should expose lifecycle callbacks instead of forcing
  consumers to poll refs. For modals/drawers, prefer `onCloseComplete` or
  `onOpenChange`; do not use `setInterval` to detect close state.
- Keep generic visual primitives in `src/components/ui`. Do not put game,
  auth, route, or Convex-specific logic there.
- Name component folders by component/domain, not by file extension. Prefer
  `src/components/Drawer/Drawer.tsx` over `src/components/Drawer.tsx/Drawer.tsx`.
- Avoid growing feature files past roughly 250 lines. If a file is larger, look
  for a natural split: query hook, controller hook, pure helper, view component,
  empty/loading state, or table/list row.

## Feature workflow

1. Inspect the exact route, component, hook, Convex function, or domain helper
   involved before proposing broad architecture.
2. Write down the core invariant: what must always be true after this change?
3. Extract or update the pure rule first when a behavior can be expressed
   without React or Convex.
4. Add focused tests for the rule before wiring UI, mutations, or persistence.
5. Wire the rule into hooks/components/mutations with the smallest surface area.
6. Run targeted tests first, then broader non-launching gates.
7. Leave the codebase with less duplication or a clearer boundary than before.

## Testing standards

- Pure domain and state helpers need unit tests covering happy path, invalid
  state, duplicate/repeated events, ordering, boundaries, and empty inputs.
- Convex persistence, auth, indexes, rewards, history, and permission boundaries
  need `convex-test` integration tests.
- Indexed searches and paginated queries need volume-oriented tests: normalized
  matching, result limits, stable ordering, no duplicates across pages/cursors,
  and public-safe DTOs.
- Matchmaking tests should cover stale scheduled work, users leaving queue,
  already-matched users, repeated cron/mutation runs, odd queue sizes, and bot
  snapshot isolation.
- Shared hooks need React Testing Library tests when they manage reusable
  lifecycle such as timers, focus, shortcuts, or completion callbacks.
- Component tests should focus on reusable UI contracts or feature-critical user
  behavior. Avoid broad snapshots of animated layout.
- Every extracted abstraction should have at least one test that proves why it
  exists.
- Prefer targeted test commands while developing, then run the full relevant
  gate before finishing.

## Verification commands

Do not start the app or dev server unless the current user request explicitly
asks for it. Use non-launching checks:

```bash
pnpm typecheck
pnpm test
pnpm lint
```

If full lint has legacy warnings, still run lint on touched files when
possible, report the global lint debt separately, and avoid adding new warnings.

## Tracking health

When reviewing scalability, measure:

- Whether new rules are pure and tested.
- Whether Convex functions are thin and server-authoritative.
- Whether large files are shrinking or at least not gaining unrelated
  responsibilities.
- Whether hooks warnings are fixed instead of silenced.
- Whether async user flows handle failures intentionally.
- Whether the test count and coverage of invariants grows with the feature.

## Animation architecture

- Use Motion for React through the local wrapper in `src/motion`; new animation
  code should import from `@/motion`, not directly from `framer-motion` or
  `motion/react`.
- The app-level Motion provider must keep `LazyMotion` and
  `MotionConfig reducedMotion="user"` enabled so bundle size and accessibility
  stay centralized.
- Put shared durations, easings, transitions, and variants in
  `src/motion/presets.ts`; avoid scattering one-off timings across feature
  components.
- Prefer transform and opacity animations. Avoid layout-heavy properties,
  broad `layout` animations, large list choreography, and infinite loops unless
  the surface is intentionally tiny and the reason is documented.
- Use CSS/Tailwind transitions for simple hover, focus, color, and spinner
  states. Reserve Motion for coordinated enter/exit, gestures, layout
  transitions, scroll-linked values, or reusable animation choreography.

## Local skill

The repo includes `.codex/skills/typer-scalable-feature/SKILL.md`. Use it when
adding or refactoring Typer features so future agents follow the same
domain/state/lifecycle/testing patterns.

The repo also includes `.codex/skills/typer-motion-animation/SKILL.md`. Use it
whenever creating, modifying, reviewing, or refactoring animation behavior so
Motion usage stays centralized, accessible, performant, and scalable.

The repo also includes `.codex/skills/typer-dicebear-avatar/SKILL.md`. Use it
whenever creating, fixing, reviewing, or refactoring avatars, profile imagery,
header profile pills, welcome avatar selection, profile edit, friends/social
avatars, bot identity snapshots, or avatar fields in Convex. Typer avatars must
remain DiceBear-based; do not replace them with custom SVG, initials-only, or
another avatar implementation.
