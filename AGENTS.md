# AGENTS.md

## Scope

- Single app: React 19 + Vite 8 SPA in `client/`. Run all npm commands from `client/`; there is no root `package.json`.
- Entry: `client/src/main.jsx` → `client/src/App.jsx`.
- This checkout has no backend. `WHAT_IS_VALENCIA_POWERWATCH.md` describes the deployed Express/SQLite/Neon system and links to docs (`SYSTEM_OVERVIEW.md`, `DATABASE_ARCHITECTURE.md`, etc.) that are not present here. Don't go looking for server code.
- `client/README.md` covers setup, PWA install testing, and production placeholder values.

## Commands (from `client/`)

- `npm run dev` — Vite dev server
- `npm run lint` — ESLint (`dist/` ignored)
- `npm run build` — production build; the >500 kB chunk warning is expected
- `npm run preview` — serve `dist`
- Use `npm install --legacy-peer-deps` when adding dependencies: `vite-plugin-pwa@1.1.0` peers cap at Vite 7 while this app uses Vite 8.
- No test runner or TypeScript/typecheck is configured. Lint + build are the only checks.

## Routing (read before adding pages)

- No React Router usage. `src/routes/App.jsx` renders `src/routes/Guard.jsx` around `resolvePage()`; `src/routes/routes.jsx` holds the `pageRoutes` Map (URL → screen, aliases listed per path) plus one detail-page regex. Pages are imported eagerly (no lazy/Suspense), so the build ships one large chunk and the >500 kB warning is expected. Navigation uses plain `<a href>`. Add a new page as an import + a row in `pageRoutes` and link with an anchor; don't introduce `react-router-dom` (installed but unused) or `useNavigate`.
- `/admin/*` falls through to `AdminDashboard`; `/admin/users`, `/admin/residents`, `/admin/schedules`, `/admin/announcements`, `/admin/barangay`, `/admin/map`, `/admin/reports`, `/admin/profile`, `/admin/analytics`, `/admin/audit-logs`, `/admin/notifications`, and `/admin/settings` have their own pages. Announcements are linked from the sidebar; profile and settings are in the admin navbar dropdowns. `/community` renders `ResidentHome` and `/staff` renders `StaffHome`.
- Section guard in `src/routes/Guard.jsx`: signed-in users landing in another role's section are redirected to their own portal (`/admin`, `/staff`, or `/community`), and signed-out users to `/login` (admins to `/admin/login`). The account's role is resolved from an own-row `public.users` select (signup metadata as fallback, no email heuristics) — SQL role promotions are honored immediately. `/login` is the canonical resident + staff login (`src/pages/auth/resident-staff/login.jsx`), routing each user by their resolved role after sign-in; `/community/login` and `/staff/login` redirect to it, and signed-in users opening any login are redirected to their portal (escape hatch: reset-password pages keep their session).
- `src/pages/auth/admin/register.jsx` is a 0-byte unimported placeholder.

## Data and auth

- Admin `map` is read-only: it plots every Supabase report from `loadAllReports`, using captured coordinates or the barangay center when a report has no pin. `barangay` reads and writes `public.barangays` through `src/lib/barangays.js`; `schedules` reads and writes `public.schedules` through `src/lib/schedules.js`; `users` shows staff + admin rows and creates staff via auth signup through `src/lib/supabase.js`, while `residents` shows resident rows only (role writes come from the `handle_new_user()` trigger — admins promote users with SQL, not from these pages).
- The only real backend integration is Supabase (`src/lib/supabase.js`). Create `client/.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; without both, `supabase` is `null` and auth pages return "not configured" errors. `.env.local` is gitignored.
- Resident reports persist in Supabase: `src/lib/reports.js` writes to `public.reports` and uploads photo/video evidence to the private `report-evidence` Storage bucket. Admin barangays persist in `public.barangays`. Admin schedules persist in `public.schedules` (see `supabase/schedule.sql`). `staff/home`, `staff/map`, and `staff/jobs` read reports assigned to the signed-in staff (`loadAssignedReports` on `assigned_staff_id`) and can only progress their `status` plus append an optional resolution photo/video to `photos` (staff policies in `report.sql`); `rejected` is a terminal admin status that never reaches staff lists. The staff map offers in-app route guidance through `src/lib/routing.js` (public OSRM, no API key) and keeps a Google Maps deep link as a fallback; reports without a pin route to their barangay center. Resident community features (see `supabase/resident_features.sql`): the public `public_outage_map` view plots every report for the resident GIS map, `announcements` are readable by all and are managed from `/admin/announcements` through `src/lib/announcements.js`, `reports` status changes trigger `notifications` rows for the owner, residents submit `feedback`, and `users.notification_preferences` persists the profile toggles. Admin management (see `supabase/admin_management.sql`): staff lifecycle (activate/deactivate/reset link), barangay edit/delete and assigned staff coverage, report duplicate flags, admin notification delivery/history, system settings/role permissions/report categories, and audit logs. Run `supabase/user.sql`, then `supabase/report.sql`, then `supabase/barangay.sql`, then `supabase/schedule.sql`, then `supabase/resident_features.sql`, then `supabase/admin_management.sql` in the Supabase SQL Editor once to create the tables, RLS policies, and bucket.
- Password-reset emails redirect to `/{community|staff|admin}/reset-password`, but no reset-password route or page exists yet.

## Styling and UI

- Tailwind v4 via `@tailwindcss/vite`; there is no `tailwind.config.*`. Theme tokens live in `src/index.css` under `@theme` (`brand-blue`, `brand-navy`, `brand-yellow`, `brand-paper`, ...). Prefer those utilities; many existing pages also use arbitrary hex values.
- shadcn config: `components.json` uses the `base-nova` style, JSX (not TSX), lucide icons, and `@base-ui/react` primitives. UI components are vendored in `src/components/ui/`; ESLint disables the react-refresh rule for that folder. `@` aliases `src/`.
- PWA: `vite-plugin-pwa` generates the service worker (registered in `src/main.jsx`) and precaches the built shell. One shared manifest: `src/routes/App.jsx` injects `public/community-manifest.webmanifest` for both resident and staff portals (`id: /login`, `start_url: /login`, `scope: /`; `staff-manifest.webmanifest` and the role-picker page were removed). Test install/offline with `npm run build && npm run preview` on localhost — dev mode does not register the service worker. Icons live in `public/icons/`.

## Build and content

- `dist/` is generated and gitignored; rebuild instead of editing it.
- `[SITE_URL]` and `[CONTACT_EMAIL]` in `index.html`, `public/robots.txt`, `public/sitemap.xml`, and the landing JSON-LD are intentional production placeholders (see README).
