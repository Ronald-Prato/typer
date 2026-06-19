---
name: typer-motion-animation
description: Use whenever creating, modifying, reviewing, or refactoring animations in Typer so Motion usage stays centralized, accessible, performant, and scalable.
---

# Typer Motion Animation

Use this skill for any Typer task that creates or changes animation behavior,
including page transitions, overlays, drawers, cards, typing feedback, game
feedback, list transitions, gestures, and animated layout.

## Required Workflow

1. Inspect the exact animated surface first: route, component, hook, or UI
   primitive.
2. Decide whether the animation needs JavaScript. Use CSS/Tailwind for simple
   hover, color, focus, spinner, and one-off transition states. Use Motion for
   coordinated enter/exit, gestures, variants, layout transitions, scroll-linked
   values, or reusable choreography.
3. Import Motion APIs from `@/motion`, not directly from `motion/react` or
   `framer-motion`, for new work.
4. Prefer the shared `m` component and named presets from `src/motion`.
5. Add or update a named preset before duplicating timing, easing, or variants
   across multiple files.
6. Keep animation orchestration in small hooks or presentational components.
   Business rules still belong in `src/domain/*`, `convex/*State.ts`, or
   `convex/*Lifecycle.ts`.
7. Run focused tests for any new preset/helper, then non-launching checks.

## Project Motion Layer

- `src/motion/MotionProvider.tsx` wraps the app with `LazyMotion` and
  `MotionConfig reducedMotion="user"`.
- `src/motion/index.ts` exports the approved Motion API surface.
- `src/motion/presets.ts` stores shared durations, easings, transitions, and
  variants.
- Existing legacy imports from `framer-motion` may be migrated gradually when
  touching those files. New animation code should use `@/motion`.

## Performance Rules

- Animate `transform` and `opacity` by default: `x`, `y`, `scale`, `rotate`,
  and `opacity`.
- Avoid animating layout-heavy properties such as `width`, `height`, `top`,
  `left`, `right`, `bottom`, `margin`, `padding`, `borderWidth`, `boxShadow`,
  `filter`, and `backdrop-filter` unless the surface is tiny and the reason is
  documented.
- Keep durations short for UI feedback: usually `0.16s` to `0.36s`.
- Use `layout` intentionally. Avoid adding it to large lists, frequently
  updating typing surfaces, or broad page shells without profiling or a focused
  reason.
- Avoid animating every row in large or paginated lists. Animate the container or
  a small visible subset.
- Do not create new transition objects inline on hot render paths when a shared
  preset would work.
- Do not use infinite animation loops in core typing/gameplay surfaces unless
  they are paused/hidden when irrelevant and respect reduced motion.
- Prefer `AnimatePresence` around the smallest conditional subtree that needs
  exit animation.
- Use `will-change` sparingly and only on actively animated transform/opacity
  elements; remove it from static surfaces.

## Accessibility Rules

- The app-level `MotionConfig reducedMotion="user"` must remain in place.
- For custom motion that could cause discomfort, call `useReducedMotion()` from
  `@/motion` and replace movement/parallax with opacity or no animation.
- Never make animation the only way to understand state. Pair game feedback with
  text, color, iconography, or layout state as appropriate.
- Avoid large camera-like movement, parallax, or rapid repeated shake effects in
  default flows.

## Anti-Patterns

- Importing directly from `framer-motion` in new code.
- Scattering anonymous `transition={{ duration: ... }}` values across features.
- Using Motion to replace simple CSS hover/focus transitions.
- Putting animation rules in Convex functions or domain helpers.
- Adding `layout` to fix visual jumpiness without understanding what re-renders
  and how many elements participate.
- Animating typing text on every keystroke with React state-driven variants
  when CSS classes or transform-only indicators would be cheaper.
- Snapshot-testing broad animated layouts.

## Testing And Verification

- Pure presets/helpers need unit tests beside the helper.
- Shared hooks that manage reduced motion, timers, presence callbacks, or
  reusable lifecycle need React Testing Library tests.
- Component tests should cover user-visible contracts, not animation frames.
- Use non-launching checks unless the user explicitly asks to start the app:

```bash
pnpm typecheck
pnpm test
pnpm lint
```

## Reference Sources

- Motion React docs: `https://motion.dev/docs/react`
- LazyMotion and bundle-size guidance: `https://motion.dev/docs/react-lazy-motion`
- Bundle-size guide: `https://motion.dev/docs/react-reduce-bundle-size`
- Reduced motion hook: `https://motion.dev/docs/react-use-reduced-motion`
- Accessibility guide: `https://motion.dev/docs/react-accessibility`
- Performance guide: `https://motion.dev/docs/performance`
- MDN `prefers-reduced-motion`: `https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion`

