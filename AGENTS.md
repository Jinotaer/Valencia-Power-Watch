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

- No React Router usage. `src/App.jsx` selects pages with exact `window.location.pathname` checks and navigation uses plain `<a href>`. Add a new page as a branch in `App.jsx` and link with an anchor; don't introduce `react-router-dom` (installed but unused) or `useNavigate`.
- `/admin/*` falls through to `AdminDashboard`, so sidebar entries for `/admin/response`, `/admin/analytics`, and `/admin/settings` render the dashboard. `/admin/map` and `/admin/reports` have their own pages. `/community` and `/staff` (outside `/login` and `/forgot-password`) render the marketing landing page.
- No auth guard: `/admin` renders without a session, and login performs no role check.
- 0-byte, unimported placeholders: `src/pages/resident/{home,map,profile,reports}.jsx`, `src/pages/auth/admin/register.jsx`, `src/pages/auth/resident-staff/register.jsx`.

## Data and auth

- Admin pages (`users`, `schedules`, `map`) use hardcoded arrays in `useState`; there is no API, fetch, or persistence. Reload discards edits. `barangay` is the exception: it reads and writes `public.barangays` through `src/lib/barangays.js`.
- The only real backend integration is Supabase (`src/lib/supabase.js`). Create `client/.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; without both, `supabase` is `null` and auth pages return "not configured" errors. `.env.local` is gitignored.
- Resident reports persist in Supabase: `src/lib/reports.js` writes to `public.reports` and uploads photo/video evidence to the private `report-evidence` Storage bucket. Admin barangays persist in `public.barangays`. Run `supabase/user.sql`, then `supabase/report.sql`, then `supabase/barangay.sql` in the Supabase SQL Editor once to create the tables, RLS policies, and bucket.
- Password-reset emails redirect to `/{community|staff|admin}/reset-password`, but no reset-password route or page exists yet.

## Styling and UI

- Tailwind v4 via `@tailwindcss/vite`; there is no `tailwind.config.*`. Theme tokens live in `src/index.css` under `@theme` (`brand-blue`, `brand-navy`, `brand-yellow`, `brand-paper`, ...). Prefer those utilities; many existing pages also use arbitrary hex values.
- shadcn config: `components.json` uses the `base-nova` style, JSX (not TSX), lucide icons, and `@base-ui/react` primitives. UI components are vendored in `src/components/ui/`; ESLint disables the react-refresh rule for that folder. `@` aliases `src/`.
- PWA: `vite-plugin-pwa` generates the service worker (registered in `src/main.jsx`) and precaches the built shell. `App.jsx` swaps `public/community-manifest.webmanifest` and `public/staff-manifest.webmanifest` by path; both start at their login route. Test install/offline with `npm run build && npm run preview` on localhost — dev mode does not register the service worker. Icons live in `public/icons/`.

## Build and content

- `dist/` is generated and gitignored; rebuild instead of editing it.
- `[SITE_URL]` and `[CONTACT_EMAIL]` in `index.html`, `public/robots.txt`, `public/sitemap.xml`, and the landing JSON-LD are intentional production placeholders (see README).
