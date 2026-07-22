# Active Context — JobPulse

## Current Focus

**Mobile-First UI/UX Redesign Complete.** The JobPulse PWA frontend has been completely refactored from the ground up according to `design-system.md` and senior product designer specifications.

- Primitive component library established (`AppShell`, `PageHeader`, `JobCard`, `StatCard`, `FilterChip`, `SearchBar`, `InfoRow`, `SkeletonJobCard`, `Button`, `IconButton`, `Badge`, `Card`, `Input`, `EmptyState`, `Modal`).
- Strict 8pt spacing grid enforced (`4, 8, 12, 16, 20, 24, 32, 40, 48, 64px`).
- Inter typography scale standard enforced (`400, 500, 600, 700` weights; 12px caption to 28px H1).
- Mobile-first layout boundary capped at `480px` max width, beautifully centered across mobile viewports (360px - 430px).
- JobCard rebuilt as a vertical scanning stack: Company -> Role -> Metadata -> Tags -> Actions.
- Fast, non-distracting 150-200ms Framer Motion and CSS ease-out micro-animations (`active:scale-[0.98]`).
- Lint clean (0 errors), production build passes cleanly.

## Session State (where we are right now)

1. **Frontend Redesign DONE.** Full component library + pages refactored, lint clean, build passes.
2. **Backend DONE.** Scraper updated with description fetching (`jobpulse-watcher` separate repo).
3. **Firebase project DONE.** `jobpulse-5ed2d` created, config in `.env`.
4. **PWA DONE.** Manifest with PNG icons, Workbox SW, `firebase-messaging-sw.js` coexisting.
5. **Push notifications FIXED.** Correct VAPID key + explicit Firebase SW registration.
6. **Next**: Deploy frontend to Vercel, test end-to-end, deploy updated scraper.

## Recently Completed This Session

- **Design System CSS Tokens (`index.css`)**: Defined 8pt spacing system, Inter font weights/sizes, border radii (8px sm, 12px md, 16px lg, 999px pill), soft shadows, and `.app-shell-container` / `480px` max width constraints.
- **Component Primitives Library**:
  - `AppShell.jsx`: 480px mobile-first wrapper with safe-area padding.
  - `PageHeader.jsx`: Standardized title, subtitle, and top action rhythm.
  - `Button.jsx` & `IconButton.jsx`: 44-48px height, 12px radius, 20px horizontal padding, zero shadow, press-scale micro-animation.
  - `InfoRow.jsx`: Standardized metadata row (Location, Salary, Time Posted, Source).
  - `FilterChip.jsx`: Interactive pill tags (12px caption, 999px radius, active/inactive states).
  - `SearchBar.jsx`: 48px height search bar with Lucide search icon.
  - `StatCard.jsx`: Metric tiles for quick overview.
  - `SkeletonJobCard.jsx`: Zero-layout-shift shimmer loading card.
  - `Section.jsx`: 24px vertical section wrapper.
  - `Badge.jsx`, `Card.jsx`, `Input.jsx`, `EmptyState.jsx`, `Modal.jsx`: Updated to match design tokens.
- **JobCard Redesign (`JobCard.jsx`)**: Rebuilt as vertical scanning stack with 16px padding, 16px radius, soft shadow, elegant non-dominating buttons.
- **Pages Redesign**:
  - `Home.jsx`: Integrated `PageHeader`, `SearchBar`, filter chips ("All", "Unseen", "LinkedIn", "RemoteOK"), skeleton loaders, and time-grouped feed.
  - `Alerts.jsx`: Integrated `PageHeader`, `StatCard` metric row, quick saved keyword chips, `AlertCard` list, and `AlertForm` modal.
  - `Login.jsx` & `Register.jsx`: Rebuilt mobile auth forms with 48px inputs, 12px radius, inline validation.
  - `BottomNav.jsx` & `MainLayout.jsx`: Centered `480px` fixed bottom navigation bar with 20px icons and 12px labels.

## Active Decisions

- **Inter Font**: Primary typeface with weights 400, 500, 600, 700.
- **480px Max Width**: Mobile-first container centered on larger screens.
- **8pt Spacing Grid**: All layout margins, paddings, and gaps.
- **Primitive Component Library**: All UI built from primitives in `src/components/shared/` and `src/components/layout/`.

## Files Modified This Session

- `src/index.css` — Design tokens, 8pt spacing, 480px container rules
- `src/components/layout/AppShell.jsx` — NEW
- `src/components/layout/PageHeader.jsx` — NEW
- `src/components/layout/MainLayout.jsx` — Updated for 480px centering
- `src/components/layout/BottomNav.jsx` — Refactored for 480px fixed bottom bar
- `src/components/shared/Button.jsx` — Refactored to 44-48px height, 12px radius, 20px px
- `src/components/shared/IconButton.jsx` — NEW
- `src/components/shared/InfoRow.jsx` — NEW
- `src/components/shared/FilterChip.jsx` — NEW
- `src/components/shared/SearchBar.jsx` — NEW
- `src/components/shared/StatCard.jsx` — NEW
- `src/components/shared/SkeletonJobCard.jsx` — NEW
- `src/components/shared/Section.jsx` — NEW
- `src/components/shared/Badge.jsx` — Updated
- `src/components/shared/Card.jsx` — Updated to 16px padding & radius
- `src/components/shared/Input.jsx` — Updated to 48px height & 12px radius
- `src/components/shared/EmptyState.jsx` — Updated
- `src/components/shared/Modal.jsx` — Updated for backdrop blur & smooth scale-in
- `src/components/jobs/JobCard.jsx` — Completely redesigned vertical scanning stack
- `src/components/jobs/JobDetailModal.jsx` — Redesigned with primitives
- `src/components/alerts/AlertCard.jsx` — Redesigned with primitives
- `src/components/alerts/AlertForm.jsx` — Redesigned with 48px inputs & Modal
- `src/pages/Home.jsx` — Redesigned with SearchBar, FilterChips, Skeleton loaders
- `src/pages/Alerts.jsx` — Redesigned with StatCard metrics and clean layout
- `src/pages/Login.jsx` & `Register.jsx` — Redesigned mobile auth cards
