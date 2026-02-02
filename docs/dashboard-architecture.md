# Modern Dashboard Architecture for Cartpanda

This document describes how I would build a scalable admin dashboard for Cartpanda's funnels + checkout product, covering architecture, design system, data management, performance, developer experience, testing, and release strategy.

---

## 1. Architecture

### Route & Feature Module Structure

I use a **feature-based folder structure** where each domain owns its routes, components, hooks, and API calls:

```
src/
├── app/
│   ├── layout.tsx              # Root layout (sidebar, header)
│   ├── (auth)/                 # Auth-gated routes group
│   │   ├── dashboard/          # Overview page
│   │   ├── funnels/            # Funnels feature module
│   │   │   ├── page.tsx        # List view
│   │   │   ├── [id]/page.tsx   # Detail view
│   │   │   ├── components/     # Funnel-specific components
│   │   │   ├── hooks/          # useFunnels, useFunnelStats
│   │   │   └── api/            # Funnel API calls
│   │   ├── orders/             # Orders feature module
│   │   ├── customers/          # Customers feature module
│   │   ├── subscriptions/      # Subscriptions feature module
│   │   ├── analytics/          # Analytics feature module
│   │   ├── disputes/           # Disputes feature module
│   │   └── settings/           # Settings feature module
├── components/
│   ├── ui/                     # Design system primitives
│   └── shared/                 # Cross-feature components
├── lib/
│   ├── api/                    # API client setup
│   ├── utils/                  # Shared utilities
│   └── constants/              # App-wide constants
├── hooks/                      # Global hooks
└── types/                      # Shared TypeScript types
```

### Key Architecture Principles

1. **Feature isolation**: Each feature module is self-contained. Engineers can work on `/funnels` without touching `/orders`.

2. **Colocation**: Components, hooks, and API calls live next to where they're used. No hunting across folders.

3. **Shared UI stays primitive**: The `/components/ui` folder contains only design system primitives (Button, Input, Table). Business logic lives in feature modules.

4. **Explicit data flow**: No prop drilling. Each feature fetches its own data via hooks. Cross-feature communication goes through URL state or a minimal global store.

### Avoiding Spaghetti

- **Barrel exports** per feature (`funnels/index.ts`) to control what's public
- **Strict import boundaries**: Features cannot import from other features' internal folders
- **eslint-plugin-boundaries** to enforce module boundaries automatically
- **Co-located types**: Each feature has its own `types.ts` rather than one massive global types file

---

## 2. Design System

### Build vs Buy Decision

**Buy (extend)**: I would use **shadcn/ui** as the foundation:

- Copy-paste components we own (not a dependency)
- Built on Radix UI primitives (accessible by default)
- Tailwind-based (consistent with our styling approach)
- Easy to customize tokens and behavior

### Design Tokens

```typescript
// lib/tokens.ts
export const tokens = {
  colors: {
    primary: { 50: '...', 500: '...', 900: '...' },
    gray: { ... },
    success: { ... },
    warning: { ... },
    error: { ... },
  },
  spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px' },
  radius: { sm: '4px', md: '8px', lg: '12px', full: '9999px' },
  typography: {
    fontFamily: { sans: 'Inter, system-ui, sans-serif', mono: '...' },
    fontSize: { xs: '12px', sm: '14px', base: '16px', lg: '18px', xl: '20px' },
    fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
  },
}
```

These tokens feed into:
- `tailwind.config.js` for utility classes
- CSS variables for dynamic theming
- TypeScript types for type-safe usage

### Enforcing Consistency

1. **Storybook** for component documentation and visual testing
2. **ESLint rules** preventing raw HTML elements (`<button>` → `<Button>`)
3. **Component guidelines** in a living doc (`/docs/components.md`)
4. **Design review** as PR checklist item

### Accessibility Enforcement

- shadcn/ui + Radix = accessible by default (keyboard nav, ARIA, focus management)
- **axe-core** in CI for automated WCAG testing
- Visible focus indicators (no `outline: none` without replacement)
- Color contrast checked via Figma plugin + automated tests

---

## 3. Data Fetching + State

### Server State: TanStack Query

```typescript
// features/funnels/hooks/useFunnels.ts
export function useFunnels(filters: FunnelFilters) {
  return useQuery({
    queryKey: ['funnels', filters],
    queryFn: () => funnelApi.list(filters),
    staleTime: 30_000,        // Fresh for 30s
    gcTime: 5 * 60_000,       // Cache for 5min
  })
}
```

**Why TanStack Query:**
- Automatic caching and deduplication
- Background refetching
- Optimistic updates for mutations
- Built-in loading/error states
- DevTools for debugging

### Client State: URL + Zustand

- **URL state** for filters, pagination, sort (shareable, bookmarkable)
- **Zustand** only for truly global UI state (sidebar collapsed, theme)
- No Redux – too much boilerplate for dashboard needs

### Loading/Error/Empty States

Every data-fetching component follows this pattern:

```tsx
function OrdersTable() {
  const { data, isLoading, error } = useOrders()

  if (isLoading) return <TableSkeleton rows={10} />
  if (error) return <ErrorState onRetry={refetch} />
  if (data.length === 0) return <EmptyState action={<CreateOrderButton />} />

  return <Table data={data} />
}
```

- **Skeletons** match the actual UI shape
- **Error states** always offer retry action
- **Empty states** guide users to next action

### Table Filters/Sort/Pagination

```typescript
// URL-driven state
const [searchParams, setSearchParams] = useSearchParams()

const filters = {
  page: parseInt(searchParams.get('page') || '1'),
  sort: searchParams.get('sort') || 'created_at',
  order: searchParams.get('order') || 'desc',
  status: searchParams.get('status') || 'all',
}

// Debounced search
const [search, setSearch] = useState(searchParams.get('q') || '')
const debouncedSearch = useDebouncedValue(search, 300)
```

---

## 4. Performance

### Bundle Splitting

- **Route-based splitting**: Each feature is a separate chunk (Next.js App Router does this automatically)
- **Component lazy loading**: Heavy components (charts, editors) use `React.lazy()`
- **Package analysis**: Regular `@next/bundle-analyzer` audits

### Large Lists: Virtualization

For tables with 1000+ rows:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

// Only renders visible rows + small buffer
const rowVirtualizer = useVirtualizer({
  count: orders.length,
  getScrollElement: () => tableRef.current,
  estimateSize: () => 52,
  overscan: 5,
})
```

### Preventing Re-renders

- `React.memo()` for pure display components
- Zustand selectors to subscribe to specific state slices
- `useMemo`/`useCallback` for expensive computations and callbacks
- React Compiler (React 19) will help automate this

### Measuring "Dashboard Feels Slow"

1. **Core Web Vitals**: LCP, FID, CLS via Vercel Analytics
2. **Custom metrics**: Time to interactive for key pages
3. **Real User Monitoring**: Sentry Performance or Datadog RUM
4. **Synthetic monitoring**: Lighthouse CI in GitHub Actions

```typescript
// Custom performance mark
performance.mark('orders-table-loaded')
performance.measure('orders-load-time', 'navigation-start', 'orders-table-loaded')
```

---

## 5. DX (Developer Experience) & Scaling to a Team

### Onboarding Engineers

1. **README** with quick start (< 5 min to running app)
2. **Architecture Decision Records (ADRs)** explaining why, not just what
3. **Component playground** (Storybook) to explore UI patterns
4. **Pair programming** on first feature with existing team member
5. **CLAUDE.md** file with codebase context for AI-assisted development

### Enforced Conventions

```json
// .eslintrc
{
  "extends": ["next/core-web-vitals", "plugin:boundaries/recommended"],
  "rules": {
    "boundaries/element-types": "error",
    "no-restricted-imports": ["error", {
      "patterns": ["../../../*"]  // No deep relative imports
    }]
  }
}
```

- **Prettier** for formatting (no debates)
- **Husky + lint-staged** for pre-commit checks
- **PR template** with checklist (tests, accessibility, screenshots)
- **Conventional commits** for changelog generation

### Preventing One-off UI

1. **Design system as source of truth**: All new UI must use existing components
2. **Storybook coverage requirement**: New components need stories
3. **Code review focus**: Reviewers check for design system violations
4. **Weekly UI audit**: Quick scan for drift from patterns

---

## 6. Testing Strategy

### Testing Pyramid

```
        E2E (Playwright)
       /                \
      /   Integration    \
     /   (Testing Lib)    \
    /                      \
   /     Unit (Vitest)      \
  ---------------------------
```

### What Gets Tested Where

| Layer | What | Tools |
|-------|------|-------|
| Unit | Utilities, hooks, store logic | Vitest |
| Integration | Component behavior, API mocking | React Testing Library + MSW |
| E2E | Critical user journeys | Playwright |

### Minimum Testing to Move Fast

1. **Unit tests** for business logic (calculations, transformations, validators)
2. **Integration tests** for complex interactive components (forms, tables with filters)
3. **E2E tests** for critical paths only:
   - User can create a funnel
   - User can complete checkout settings
   - User can view analytics

### Test Philosophy

- Test behavior, not implementation
- Mock at the network boundary (MSW), not internal modules
- E2E tests run in CI on every PR against staging

---

## 7. Release & Quality

### Feature Flags

Using **LaunchDarkly** or **Vercel Edge Config**:

```typescript
const { isEnabled } = useFeatureFlag('new-analytics-dashboard')

return isEnabled ? <NewAnalytics /> : <LegacyAnalytics />
```

Benefits:
- Ship incomplete features behind flags
- Gradual rollout (1% → 10% → 100%)
- Instant kill switch if issues arise
- A/B testing built-in

### Staged Rollouts

1. **Dev** - Merge to main, auto-deploy to dev environment
2. **Staging** - Manual promote, runs E2E tests
3. **Production** - Manual promote, gradual rollout via feature flags

### Error Monitoring

**Sentry** for:
- Error tracking with source maps
- Performance monitoring
- Release tracking (which deploy introduced the bug)
- User context (which user experienced the issue)

```typescript
Sentry.init({
  dsn: '...',
  environment: process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 0.1,  // 10% of transactions
})
```

### Ship Fast but Safe

1. **Feature flags** for incomplete work
2. **Preview deployments** for every PR (Vercel)
3. **Required PR reviews** from at least one team member
4. **CI gates**: Tests, lint, type check, bundle size check
5. **Rollback plan**: Every deploy can be reverted in < 1 minute
6. **On-call rotation**: Someone is always watching production metrics

---

## Summary

| Concern | Solution |
|---------|----------|
| Architecture | Feature modules with clear boundaries |
| Design System | shadcn/ui + design tokens + Storybook |
| Data Fetching | TanStack Query + URL state |
| Performance | Route splitting, virtualization, RUM |
| DX | ESLint boundaries, PR templates, ADRs |
| Testing | Vitest + RTL + Playwright for critical paths |
| Release | Feature flags, staged rollouts, Sentry |

This architecture is designed to:
- **Stay fast** as the dashboard grows (lazy loading, virtualization, caching)
- **Support parallel work** without conflicts (feature modules, clear ownership)
- **Avoid big rewrites** (incremental improvements, feature flags for migrations)
- **Meet WCAG standards** (Radix primitives, automated accessibility testing)

---

*Written by Naveed for Cartpanda Lead Front-end Engineer application.*
