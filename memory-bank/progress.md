# Progress — JobPulse

## Status Legend
- [x] Done
- [~] In progress / partial
- [ ] Not started
- [!] Blocked / needs decision

---

## Infrastructure

- [x] Project documentation written (`JobPulse-MVP-Master-Prompt.md`, `JobPulse-Project-Walkthrough.md`, `design-system.md`)
- [x] Frontend scaffolded (React 19 + Vite 8)
- [x] Frontend dependencies installed (tailwind, firebase, router, pwa, icons, react-query, framer-motion)
- [x] Tailwind v4 theme configured (Inter font, sky-blue brand, 8pt spacing tokens, light/dark, 480px app-shell)
- [x] Vite config (Tailwind plugin, `@` alias, PWA manifest with vite-plugin-pwa)
- [x] Firebase project created (`jobpulse-5ed2d`)
- [x] `firebase.json` configured (Firestore rules, Hosting — no Functions)
- [x] `firestore.rules` written and deployed (per-user scoped + saved_keywords)
- [x] Firestore database created (Enterprise edition, ID: `"default"`)
- [x] Firebase Cloud Messaging API V1 enabled
- [x] VAPID key generated and added to `.env`
- [x] GitHub Actions workflow for scheduler (in separate repo — `scraper/run.js`)
- [x] PWA installability: vite-plugin-pwa + PNG icons (192x192, 512x512, maskable)
- [ ] Deploy frontend to Vercel

---

## Component Primitive Library (Design System)

- [x] `AppShell` — 480px max-width container, safe-area inset support, full height layout
- [x] `PageHeader` — Standardized title, subtitle, and action rhythm
- [x] `JobCard` — Redesigned vertical scanning stack (Company -> Role -> Metadata -> Tags -> Actions)
- [x] `StatCard` — Lightweight summary metric tile
- [x] `FilterChip` — Interactive pill tags with active/inactive states
- [x] `SearchBar` — 48px search input with icon & clear button
- [x] `InfoRow` — Metadata row primitive (Location, Salary, Time Posted, Source)
- [x] `SkeletonJobCard` — Zero-layout-shift shimmer loading card
- [x] `Section` — 24px vertical section wrapper
- [x] `Button` — 44-48px height, 12px radius, 20px padding, press-scale micro-animation
- [x] `IconButton` — Square/pill touch-friendly icon actions
- [x] `Badge` — 12px caption pill tags
- [x] `Card` — 16px padding, 16px radius, soft shadow
- [x] `Input` — 48px height, 12px radius, inline error message
- [x] `EmptyState` — Centered icon, title, description, CTA
- [x] `Modal` — Dialog with backdrop blur and smooth scale-in

---

## Frontend — Pages

- [x] `App.jsx` — route table with `/`, `/alerts`, protected routes, foreground message toasts
- [x] `main.jsx` — entry point, renders App with StrictMode
- [x] `index.css` — Tailwind v4 theme with Inter font, 8pt grid, 480px app-shell-container, animations
- [x] `pages/Home.jsx` — live job list with search, filter chips, time groups, skeleton loaders, clear all modal
- [x] `pages/Alerts.jsx` — view/add/delete search alerts with StatCards and saved keyword chips
- [x] `pages/Login.jsx` — mobile auth card, 48px inputs, 12px radii, friendly error mapping
- [x] `pages/Register.jsx` — mobile auth card, password confirmation, 48px inputs, 12px radii

---

## Verification

- [x] `npm run lint` — PASSED (0 errors)
- [x] `npm run build` — PASSED (Vite production bundle compiled cleanly)
