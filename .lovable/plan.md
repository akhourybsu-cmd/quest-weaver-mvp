

# Comprehensive App Review - Quest Weaver

## Summary

After auditing the codebase, database, security policies, and architecture, here are the issues organized by severity.

---

## Critical: Security

### 1. Overly Permissive RLS Policies (5 tables)
Five tables have `WITH CHECK (true)` on INSERT, meaning **any authenticated user** can insert rows:
- `srd_class_features` - "Authenticated users can insert class features"
- `srd_subancestries` - "Admins can insert subancestries" (says admin, but policy is `true`)
- `srd_subclass_features` - "Authenticated users can insert subclass features"
- `srd_subclasses` - "Authenticated users can insert subclasses"
- `srd_tools` - "Admins can insert tools"

**Fix**: Restrict these INSERT policies to admin-only using `public.is_current_user_admin()`.

### 2. Leaked Password Protection Disabled
The authentication system has leaked password protection turned off. This should be enabled to prevent users from using known-compromised passwords.

**Fix**: Enable via Cloud auth configuration.

---

## High: Performance

### 3. Excessive `supabase.auth.getUser()` Calls (250+ occurrences across 40 files)
Every component independently calls `getUser()`, which is a network request to the auth server. This creates redundant API calls on every page load and interaction. Some components call it multiple times.

**Fix**: Create a `useAuth` hook or context that caches the session/user from `onAuthStateChange` and provides it app-wide. Replace all 250+ individual `getUser()` calls with the context value.

### 4. No React Query Usage for Data Fetching
Despite `@tanstack/react-query` being installed, **zero queries use it**. All data fetching is done via raw `useEffect` + `useState` patterns with no caching, deduplication, or stale-while-revalidate. This means:
- Navigating between tabs re-fetches everything
- No background refresh or cache invalidation
- No loading/error state management

**Fix**: Migrate core data fetching (campaigns, characters, SRD data) to `useQuery`/`useMutation` hooks. Start with the most-accessed: campaigns list, character data, SRD lookups.

### 5. CampaignHub.tsx is 1,167 Lines
This single file manages all campaign state, 18 lazy-loaded tabs, session management, and real-time subscriptions. It's the app's heaviest component.

**Fix**: Extract campaign state management into a custom hook (`useCampaignManager`), move session control logic into `useSessionControl`, and keep the component focused on layout/rendering.

---

## Medium: Architecture

### 6. Duplicate Rate Limiter Implementations
Two separate rate limiter files exist:
- `src/lib/rateLimiter.ts` (client-side)
- `supabase/functions/_shared/rateLimiter.ts` (edge functions)

Neither is used by the other; the client-side one appears unused entirely.

**Fix**: Remove `src/lib/rateLimiter.ts` if unused, or consolidate.

### 7. TenantContext Provides Stale/Empty Data
`TenantContext` reads `useParams()` but is rendered **above** all routes in `App.tsx`, so `params` will always be empty. The context provides `campaignId: null`, `sessionId: null` permanently.

**Fix**: Either move `TenantProvider` inside routes where params exist, or remove it and use route params directly in child components (which most already do).

### 8. App.tsx Eagerly Imports All 25 Page Components
Zero code-splitting at the route level. Every page component is imported eagerly in `App.tsx`, inflating the initial bundle. Only campaign tabs use `lazy()`.

**Fix**: Convert page imports to `React.lazy()` with `Suspense` boundaries.

---

## Low: Code Quality

### 9. 86 Console.log Statements in Production Code
Debug logging scattered across 10 component files (NPCDetailDrawer, MonsterActionDialog, PresenceBar, StepSpells, etc.) that runs in production.

**Fix**: Remove non-DEV-guarded `console.log` calls, or wrap them in `import.meta.env.DEV` checks.

### 10. `useAppVersion` Fetches index.html Every 60 Seconds
This auto-refresh hook downloads the entire HTML page every minute to detect deploys. This is noisy and wasteful.

**Fix**: Use a lightweight version endpoint or ETag header check instead of downloading full HTML.

### 11. Telemetry Silently Fails Without analytics_events Table Validation
`trackEvent` in `telemetry.ts` calls `getUser()` on every event (another redundant auth call) and inserts into `analytics_events` without checking if the user is authenticated.

**Fix**: Use cached user from auth context; skip tracking for unauthenticated users.

---

## Recommended Implementation Order

1. **Security fixes** (RLS policies + leaked password protection) -- immediate
2. **Create `useAuth` context** to eliminate 250+ redundant `getUser()` calls -- high impact
3. **Lazy-load route pages** in App.tsx -- quick performance win
4. **Migrate top-level data fetching to React Query** -- campaigns, characters
5. **Extract CampaignHub logic** into hooks -- maintainability
6. **Clean up console.logs and dead code** -- hygiene
7. **Fix TenantContext** -- correctness

---

## Database Health

The database is in good shape overall:
- All tables have RLS enabled
- Indexes exist on all major foreign keys and query patterns
- SRD data is properly populated (319 spells, 330 monsters, 336 feats, 237 magic items)
- Total DB size is under 10MB -- no concerns

