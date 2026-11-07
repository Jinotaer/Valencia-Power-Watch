# Reference system review — valencia-powerwatch.onrender.com

Reviewed Nov 7, 2026 against this repo's React + Supabase client. The deployed site is a
**different, older implementation**: vanilla-JS portals served by an Express API. It is the
reference, not the same codebase.

## 1. What the reference actually is

- **Three vanilla-JS portals** under one Express app, each a separate PHP-page-style shell:
  `/community`, `/admin`, `/staff` (`/client/js/{community,admin,staff,shared}/*.js`,
  cache-busted with `?v=N` query strings, bump-per-change).
- **Server-side everything**: cookie sessions (`/api/auth/login`, `/api/auth/me`, demo logins),
  one REST API (~40 endpoints — see §3). No Supabase in the served site.
- **Persistence**: "neon+sqlite" — an SQLite file snapshotted every 5 s and restored on boot
  (`/api/health` reports `lastSnapshotAt`, `lastError`). Fragile pattern; don't copy it.
- **PWA for each portal**: per-portal manifests (`/manifest.json` scoped to `/community`,
  `/staff-manifest.json`), inline install-instructions dialog, and an in-app
  "update available → apply now" notice (`pwa-update.js`).
- **Theme**: dark navy (`#0b1220`, `#073c68`) with blue accents; local app is light brand-papery.

## 2. Feature inventory (from its own JS/HTML)

Community: report submission w/ attachments, my-reports + feedback w/ rating after restore,
announcements, notifications w/ unread badge + read-all, scheduled-outages list (`/api/scheduled/upcoming`),
map, chatbot launcher (draggable, Bisaya-aware, server-grounded `/api/chatbot`).

Admin: user management, barangay management, scheduled outages, announcements composer,
repair teams, analytics dashboard, audit logs, settings (system info, notification, map, staff-account limit),
SMS test/logs, report duplicate + reject flows, incident composer (attach reports to incidents).

Staff: field assignments, teams, map, update notice.

## 3. API surface (grep of its client bundles)

`auth/*` (login, register, forgot/reset, demo, me, logout), `reports` (+`/mine`, `/:id/status`,
`/duplicate`), `incidents` (+link reports), `repair-teams`, `repair/assign`,
`repair/dispatch-eligibility`, `staff/assignments`, `staff/teams`, `scheduled` (+`/upcoming`),
`announcements`, `notifications` (+`/read-all`, `/unread-count`), `barangays` (+`/locations`),
`admin/users`, `admin/barangays`, `admin/audit-logs`, `admin/settings`, `admin/staff-memberships`,
`analytics/dashboard`, `history`, `feedback`, `sms/test|logs`, `settings`, `chatbot`.

## 4. Lifecycle difference that matters most

Reference status flow: **Pending → Verified → Dispatched → Ongoing → Restored/Resolved**, plus
**Rejected** (with remarks) and report **DPC (duplicate) marking**, and reports can be bundled into
**incidents**. Local app has only pending/verified/resolved. If you want the reference behavior,
the local roadmap is:

1. Extend `public.reports.status` + add an `incidents` table (reports `belong to` an incident).
2. Notifications table + unread badge in portal navs.
3. Announcements table (admin writes, community reads).
4. Audit log (admin actions appended from RLS-safe trigger or service calls).
5. Feedback/rating after a verified report is resolved.

## 5. What the local app already does better

- **Real database with RLS** (Supabase) instead of an in-memory SQLite + 5 s snapshot race.
- Evidence includes **video**, private signed-URL bucket; review modal with staff assignment.
- Schedules now persistence-backed (`public.schedules`) with resident-visible published notices.
- Single build toolchain (Vite + ESLint) vs six hand-versioned JS/CSS files with manual `?v=` bumps.

## 6. Ideas worth porting (small, high value)

- Cache-busted PWA update prompt: vite-plugin-pwa gives this via `workbox` — surface the
  "update ready" bar instead of silent SW updates.
- Chatbot: port as a server function (Supabase Edge Function) answering from live tables
  (nearest outage, how-to-report), Bisaya keyword matching included.
- "Dispatched/Ongoing/Restored" staff-side states when jobs exist (ties into assigning staff).
- Analytics: the local admin is all tables; one real "reports per barangay last 7 days" chart
  answers a question — skip the four-KPI-card layout the reference also avoids now.

## 7. Repo hygiene note

`AGENTS.md` references `WHAT_IS_VALENCIA_POWERWATCH.md`, `SYSTEM_OVERVIEW.md`,
`DATABASE_ARCHITECTURE.md` — none exist in this checkout. Replace that pointer with this file.
