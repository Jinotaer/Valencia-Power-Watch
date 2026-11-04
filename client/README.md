# React + Vite

## Valencia PowerWatch landing page

Replace `[SITE_URL]` and `[CONTACT_EMAIL]` in `index.html`, `public/robots.txt`,
`public/sitemap.xml`, and the landing page JSON-LD with production values before
deployment. The public page links into the Resident and Staff portals with
`?install=1`; each portal should link its matching manifest from its own entry
HTML (`/community-manifest.webmanifest` or `/staff-manifest.webmanifest`).

To test installation, serve the production build over HTTPS (or localhost),
open the relevant portal, and use the browser's install prompt. On iOS Safari,
use Share, then Add to Home Screen. For a Lighthouse audit, run `npm run build`,
serve `dist` with a static server, and run Lighthouse against `/`.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
