# Hosting Project - Task Tracking

## Goal
Make the BBIPL CMS deployable as a single production server (Option C) and document the full hosting process.

## Tasks

- [x] Analyzed project structure (frontend static files + Node.js backend)
- [x] Identified hardcoded `localhost:3001` references in `js/email.js` and `js/settings.js`
- [x] Modify `server/server.js` to:
  - [x] Read `PORT` from `process.env.PORT` (fallback 3001)
  - [x] Serve static files from the project root
  - [x] Add SPA-style fallback for `.html` pages
  - [x] Keep all `/api/*` routes intact
- [x] Modify `js/email.js` to use same-origin / configurable API URL
- [x] Modify `js/settings.js` to replace hardcoded `localhost:3001`
- [x] Create `HOSTING-GUIDE.md` with Render / Railway / VPS deployment steps
- [x] Create `README.md` with project overview, setup, and deploy instructions
- [x] Verify edited JS files pass syntax check (`node --check`)
- [x] Test locally by starting server and visiting `http://localhost:3001`
  - [x] `index.html` served (200)
  - [x] `settings.html` direct navigation (200)
  - [x] `/api/status` returns SMTP config (200)

## Summary

The BBIPL CMS is now a **single-server production-ready** application:

- **`server/server.js`** serves the static frontend AND all `/api/*` routes on one port, reads `PORT` from env, and supports direct navigation to `.html` pages.
- **`js/email.js`** and **`js/settings.js`** no longer hardcode `localhost:3001` — they use the same origin (overridable via `window.CMS_API_URL` or `localStorage.cmsApiUrl`).
- **`HOSTING-GUIDE.md`** documents deployment to Render, Railway, and a VPS.
- **`README.md`** provides the full project overview, setup, and deploy instructions.
</content>
