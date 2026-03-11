

## Update Changelog & Add Admin Management System

### Part 1: Update Static Changelog with Recent Changes

Add two new versions to `changelogData.ts`:

**v2.0.0** (March 11, 2026) — "Interactive Showcase & Authentication"
- Feature: Interactive Feature Showcase on homepage with animated mock browser frames
- Feature: Google Sign-In via OAuth integration
- Improvement: Redesigned sign-in/sign-up pages with Zod validation, password visibility toggle, and branded UI
- Improvement: DM/Player toggle now controls both showcase slides and feature tiles

**v1.9.0** — "Telemetry & Timeline Logging"
- Feature: Analytics telemetry system for combat action tracking with latency measurement
- Feature: Timeline auto-logging for sessions, encounters, quests, NPCs, items, and locations
- Improvement: App version checking with auto-refresh on new deployments

### Part 2: Database-Backed Changelog with Admin UI

Move changelog management into the database so entries can be added without code deploys.

**Database migration:**
- Create `changelog_entries` table (id, version, date, title, sort_order, created_at)
- Create `changelog_changes` table (id, entry_id FK, type enum, description, sort_order)
- RLS: public read for all, write restricted to admin role users
- Seed with all existing static data

**New components:**
- Update `src/pages/Changelog.tsx` to fetch from database instead of static file, with fallback to static data if fetch fails
- Create `src/components/changelog/ChangelogAdmin.tsx` — a simple admin panel (accessible from AdminTools or a protected route) with forms to add/edit changelog entries and individual changes

**Admin access:**
- Gate the admin UI behind `has_role(auth.uid(), 'admin')` check
- Add a link from the existing AdminTools page

### Files

| File | Action |
|------|--------|
| `src/data/changelogData.ts` | Edit — add v2.0.0 and v1.9.0 entries |
| Migration SQL | Create `changelog_entries` + `changelog_changes` tables with RLS + seed data |
| `src/pages/Changelog.tsx` | Edit — fetch from DB, fallback to static |
| `src/components/changelog/ChangelogAdmin.tsx` | Create — admin form for managing entries |
| `src/pages/dev/AdminTools.tsx` | Edit — add link to changelog admin |

