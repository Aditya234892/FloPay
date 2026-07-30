# @flopay/ui

Deliberately empty right now.

The design system (14 components under `apps/gateway-web/src/components/ui`, the
theme provider, motion vocabulary, and Tailwind tokens) is not extracted here yet
because there is only one consumer of it. Moving it speculatively — before
`apps/consumer-app` exists to prove the boundaries are right — risks getting the
shared/app-specific split wrong with nothing to validate it against.

**When `apps/consumer-app` scaffolding begins:**

Move in, unchanged in behavior:
- `components/ui/*` — Button, Card, Badge, Input, Skeleton, EmptyState,
  AnimatedCounter, StatCard, Modal, toast, DataTable, Tabs, CopyField
- `components/brand/Logo.tsx` — FloMark + wordmark
- `theme/ThemeProvider.tsx`
- `lib/motion.ts`, `lib/utils.ts`, `lib/format.ts`
- The `@theme inline` token block from `index.css` (as `packages/ui/src/theme.css`,
  `@import`-ed by each app — Tailwind v4's CSS-first config makes this a plain
  file import, no build-tool plumbing)

Leave in `gateway-web`, not shared:
- `components/layout/*` (AppShell, Sidebar, PageHeader, ErrorBoundary,
  navigation.ts) — this is the merchant/admin dashboard shell specifically;
  consumer-app will want its own bottom-tab shell, not this sidebar
