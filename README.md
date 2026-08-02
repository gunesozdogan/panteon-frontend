# Weekly Leaderboard — Frontend

React + TypeScript client for a weekly leaderboard used by an idle/clicker game
(~10M registered players, ~2M daily active). The screen loads **instantly**,
always shows the **top 100**, and — when the current player is outside it —
pins **their own rank plus a window of the players around them** so they never
lose track of where they stand. Past weeks are browsable from an archive, and a
reviewer can trigger the end-of-week payout by hand without waiting for the cron.

This is the **client** half of the project. It is a standalone repo and talks to
the backend only over HTTP (see [`src/types/domain.ts`](src/types/domain.ts) for
the API contract). The backend lives in a separate repo (`backend-leaderboard`).

---

## Highlights

- **Instant, always-visible self rank.** The player's own row is pinned in a
  sticky `SelfRankCard`; if they're outside the top 100 they also get a
  6-row window (3 above, self, 2 below), matching the server's window logic.
- **Virtualized top-100 list** (`react-window` v2) so scrolling stays smooth on
  mobile even with 100+ rows — this directly fixes the "freezes when I scroll"
  complaint.
- **Live-feeling board.** A poll loop refreshes the board every ~2.5s, kept in
  the same ballpark as the backend's top-100 read-cache TTL so most polls are
  cheap cache hits. An optional demo-traffic driver keeps the board moving.
- **Cold-start resilient.** Every GET retries with backoff on gateway wake-up
  statuses (502/503/504) and surfaces a friendly "server is waking up" message
  after 4s instead of just spinning.
- **Responsive, desktop + mobile.** Two-column layout on desktop; a tabbed
  single-column layout (Leaderboard / Profile) on mobile. Dark mode supported.
- **Reusable, composable components** exported from a single barrel
  ([`src/components/index.ts`](src/components/index.ts)) — `LeaderboardRow`,
  `RankBadge`, `SelfRankCard`, `PrizePoolBanner`, `WeeklyStatus`, `StatCard`, …
- **Money is always integer minor units.** Floats are used only for display
  formatting, never for the values themselves — mirroring the backend rule.

---

## Tech stack

| Concern        | Choice                                             |
| -------------- | -------------------------------------------------- |
| Framework      | React 19 + TypeScript (`strict: true`)             |
| Build / dev    | Vite 8                                              |
| Styling        | Tailwind CSS v4 (`@tailwindcss/vite`)              |
| List virtualization | `react-window` v2 (`List` + `rowComponent` API) |
| Testing        | Vitest + `@testing-library/react` (`jsdom`)        |
| Linting        | oxlint                                              |

No global state library or data-fetching framework: fetching lives in small,
focused hooks and a single typed API client.

---

## Getting started

Requires Node 20+ and the backend running (locally on `http://localhost:3000`
by default, or a deployed URL).

```bash
npm install

# Point the app at your backend
cp .env.example .env.local
# edit VITE_API_BASE_URL if your backend isn't on localhost:3000

npm run dev        # start the dev server (Vite prints the local URL)
```

Then open the printed URL. The board loads out of the box; the default demo
player (`p2500`) is deliberately outside the top 100 so the self-rank card is
visible immediately.

### Scripts

| Command              | What it does                                    |
| -------------------- | ----------------------------------------------- |
| `npm run dev`        | Start the Vite dev server                       |
| `npm run build`      | Type-check (`tsc -b`) then produce a prod build |
| `npm run preview`    | Serve the production build locally              |
| `npm test`           | Run the Vitest suite once                       |
| `npm run test:watch` | Run tests in watch mode                         |
| `npm run lint`       | Lint with oxlint                                |

### Environment

Config is via `.env.local` (see [`.env.example`](.env.example)):

| Variable                  | Default                 | Purpose                                              |
| ------------------------- | ----------------------- | ---------------------------------------------------- |
| `VITE_API_BASE_URL`       | `http://localhost:3000` | Backend API origin (no trailing slash).              |
| `VITE_DEFAULT_PLAYER_ID`  | `p2500`                 | Demo player when no `?playerId=` / stored id exists. |

The demo player can also be set at runtime via a `?playerId=…` URL param or the
in-app player picker; the choice is persisted to `localStorage`.

---

## Using the app

There is no login (auth is out of scope for the case), so the app gives you
reviewer-facing controls to stand in for "who am I" and to drive the weekly
lifecycle by hand. A typical walkthrough:

1. **Open the app.** You land in **live** mode on the current week. The top 100
   is on the left/main area; the default demo player (`p2500`) is outside the
   top 100, so their pinned **self-rank card** ("Around you" window) is visible
   right away.
2. **Pick who you're viewing as.** In the **"Viewing as (random sample)"**
   picker, each button is a real sampled player labelled `username / #rank`
   (a 🏆 means they're currently in the top 100). Click one to re-render the
   whole screen as that player — the leaderboard highlights their row, the
   self-rank card follows them, and the earnings/profile panel shows their
   wallet. Hit **re-roll** to draw a fresh random set of candidates. Your choice
   is remembered across reloads (`localStorage`).
3. **Read your standing.** The **earnings panel** (Profile tab on mobile) shows
   the selected player's **total winnings** (durable wallet balance from
   Postgres) and their **prize history** per closed week, plus their current
   rank/score.
4. **Watch it move (optional).** Toggle **live** on to start client-driven demo
   traffic — the board keeps updating as simulated players earn. Toggle it off to
   freeze it. (The traffic is browser-driven on purpose so the backend stays
   stateless.)
5. **Close the week.** Use **Close week** to distribute the prize pool now,
   archive the standings, and reset the board — instead of waiting for the Monday
   cron. After a close, the winners' new payouts show up in their earnings panel.
6. **Browse past weeks.** Switch the **week selector** to a closed week to enter
   **history** mode: an immutable, archived standings view (no polling, no
   simulation) served from the backend's history endpoint.

> Tip: to jump straight to a specific player, append `?playerId=p123` to the URL.

---

## Project structure

```
src/
├─ App.tsx                  # Top-level screen: layout, live/history modes, mobile tabs
├─ config.ts                # API base URL + default demo player (from env)
├─ api/
│  ├─ client.ts             # Typed API calls (the only place we hit the backend)
│  ├─ http.ts               # fetch wrapper: retry/backoff, abort, error mapping
│  ├─ errors.ts             # ApiError + typed error body
│  └─ sampleData.ts         # Contract-faithful sample data for tests/stories
├─ components/              # Reusable UI (barrel-exported from index.ts)
│  ├─ VirtualizedLeaderboard.tsx
│  ├─ LeaderboardRow.tsx  RankBadge.tsx  SelfRankCard.tsx
│  ├─ PrizePoolBanner.tsx  WeeklyStatus.tsx  StatCard.tsx
│  ├─ PlayerPicker.tsx  EarningsPanel.tsx  WeekSelector.tsx
│  └─ Avatar.tsx  LeaderboardSkeleton.tsx
├─ hooks/                   # Data-fetching & demo hooks
│  ├─ useLeaderboard.ts     # Foreground load + background poll, isSlow flag
│  ├─ useHistory.ts  useHistoryWeeks.ts
│  ├─ usePlayerWallet.ts  usePlayerSuggestions.ts  useDemoUser.ts
│  └─ useLiveSimulation.ts  # Client-driven demo traffic (keeps backend stateless)
├─ lib/                     # Pure helpers (format, cx, leaderboard window logic)
├─ types/domain.ts          # API contract — COPIED from the backend (source of truth)
└─ tests/                   # Vitest specs mirroring src/ (api, hooks, components, lib)
```

---

## How it works

### Two modes
The screen runs in either **live** mode (the current, in-progress week) or
**history** mode (a closed week selected in the `WeekSelector`). Live mode polls
and can simulate traffic; history mode reads immutable archived standings from
the backend's Mongo-backed history endpoint.

### The self-rank rule
The backend returns the top 100 for everyone, plus — only when the caller is
outside it — a `me` view containing their entry and a window of neighbours. The
frontend renders that window under an "Around you" heading and keeps the
`SelfRankCard` sticky so the player's position is never scrolled away.

### Data fetching & resilience
All requests go through [`api/http.ts`](src/api/http.ts): a cancellable GET that
retries transient failures (no response, or 502/503/504 while a host wakes) with
backoff. [`useLeaderboard`](src/hooks/useLeaderboard.ts) runs a foreground load
on mount / player change and a lightweight background poll thereafter, exposing
explicit `loading | success | error` states and an `isSlow` flag for cold starts.

### Demo affordances
Because auth is out of scope for the case, the app ships several reviewer-facing
demo tools:
- **Player picker** — switch "who am I" between freshly-sampled real players.
- **Live toggle** — start/stop client-driven demo traffic (`POST /admin/simulate`).
  This is deliberately browser-driven so the backend keeps **no** timers and stays
  stateless.
- **Close week** — distribute the prize pool now, archive the standings, and reset
  the board, instead of waiting for the Monday cron.

---

## Testing

```bash
npm test
```

Tests use Vitest with `jsdom` and Testing Library. They cover the tricky pure
logic first (money/rank formatting, the leaderboard window selection), the API
client and its retry/error behavior, and key hooks and components. Test fixtures
live in [`src/api/sampleData.ts`](src/api/sampleData.ts) and are contract-faithful
to `types/domain.ts` (they are **not** wired into the runtime client).

---

## Building & deploying

```bash
npm run build      # → dist/
npm run preview    # sanity-check the build locally
```

`dist/` is a static bundle deployable to any static host (Vercel, Netlify, S3,
…). Set `VITE_API_BASE_URL` to the deployed backend URL in the host's build-time
environment variables before building for production.

---

## Notes

- `src/types/domain.ts` is **copied** from the backend, not imported — client and
  server are intentionally separate repos. If the backend contract changes,
  re-copy that file.
- Money values crossing the API are always **integer minor units**; formatting to
  a human-readable string is the only place floats appear.
