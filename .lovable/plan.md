## Goal

Unblock the SRD seed buttons (root cause: RLS "Admins can insert" lockdown on `srd_class_features`, `srd_subclasses`, `srd_subclass_features`, `srd_subancestries`, `srd_tools`) and make any future seed failure self-diagnosing.

## Step 1 — Grant admin (you, manual, no code)

Run in the Lovable Cloud SQL editor (bypasses RLS):

```sql
select id, email from auth.users order by created_at desc;

insert into public.user_roles (user_id, role)
values ('<your-user-id>', 'admin')
on conflict do nothing;
```

Sign out / back in so `is_current_user_admin()` returns true for the session. This alone makes the existing seed buttons work — no code change required.

## Step 2 — Belt-and-suspenders: stamp provenance on every seeder insert

In `src/pages/dev/AdminTools.tsx` (and any sibling seeder that touches the locked-down tables), add `source_key: 'srd-5.1'`, `ruleset: 'dnd-5e'`, `license: 'OGL-1.0a'` to every insert payload for:

- `srd_class_features`
- `srd_subclasses`
- `srd_subclass_features`
- `srd_subancestries` (also explicitly send `ability_bonuses: []`, `options: {}` — defaults exist but explicit is safer)
- `srd_tools`

Schema defaults already cover these, so this is purely making provenance explicit and future-proof against any drift.

## Step 3 — Surface full Postgres error in seed toasts

Every seeder `catch` block currently shows only `error.message`. Update them to show `code`, `message`, `details`, and `hint` from the Supabase error object so the next failure is unambiguous (RLS vs not-null vs missing column vs FK).

Pattern:

```ts
const desc = [error.code && `[${error.code}]`, error.message, error.details, error.hint]
  .filter(Boolean).join(' — ');
toast({ title: "Seed failed", description: desc, variant: "destructive" });
```

Also log the full error object to `console.error` for copy/paste.

Apply to seeders in:
- `src/pages/dev/AdminTools.tsx`
- `src/components/admin/SRDDataSeeder.tsx`
- `src/components/admin/SRDImportButton.tsx`
- `src/components/admin/SpellScalingSeedButton.tsx`
- `src/components/dev/RulesEngineSeeder.tsx`

## Step 4 — Verify

After Step 1, on `/admin` re-run each previously-silent seeder (class features, subclasses, subclass features, subancestries, tools). Confirm row counts move via `supabase--read_query`. If anything still fails, the new toast tells us exactly which constraint/policy fired.

## Out of scope

- No RLS migration changes (the admin-only policies are intentional).
- No edge function changes (service role already bypasses RLS; spells/conditions sync confirmed working).
- No changes to `import-srd-core` / `sync-rules-source`.
