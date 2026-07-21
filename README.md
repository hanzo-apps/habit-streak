# Habit Streak

Build habits with streaks and a green calendar heatmap. Check in each day, keep
the run alive, and watch a calm grid fill in.

A real, buildable [Hanzo](https://hanzo.ai) app — fork it on
[hanzo.app](https://hanzo.app) and deploy live on Hanzo Cloud.

- **UI** — [`@hanzo/gui`](https://www.npmjs.com/package/@hanzo/gui) (the Hanzo
  design system) under Vite + React 19. No Tailwind, no second kit.
- **Auth** — [`@hanzo/iam`](https://www.npmjs.com/package/@hanzo/iam), OAuth2
  **PKCE** against [hanzo.id](https://hanzo.id). No local passwords — IAM owns
  every credential interaction.
- **Data** — [`@hanzo/base`](https://www.npmjs.com/package/@hanzo/base), the
  IAM-native, org-scoped data plane. Habits and check-ins are real Base
  collections.

## What it does

- **Today** — every habit with a big check button, its current streak, and a
  glanceable seven-day strip. One tap logs today; tap again to undo.
- **Habit detail** — the streak stats (current / longest / total) and an
  18-week heatmap where deeper green means a longer run.
- **Add** — name a habit and pick a cadence (Daily / Weekdays / Weekly).

Streaks and the heatmap are derived, in the browser, from real check-in rows —
no numbers are faked.

## Stack (pinned)

| Package | Version |
| --- | --- |
| `react` / `react-dom` | `^19.2.4` |
| `@hanzo/gui` + `@hanzogui/config` | `7.3.0` |
| `@hanzo/iam` | `^0.13.1` |
| `@hanzo/base` | `^0.2.1` |
| `vite` | `^6` (`@vitejs/plugin-react`) |
| `react-native-web` | `^0.21.0` |
| `typescript` | `5.9.3` |

## Run it

```sh
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc --noEmit && vite build  ->  dist/
npm run preview    # serve the production build (SPA fallback on)
```

Out of the box it runs against **live** Hanzo (hanzo.id + api.hanzo.ai) — no
config needed to see the sign-in flow. Copy `.env.example` to `.env` to point at
a different environment.

## Environment contract

Only `VITE_`-prefixed vars reach the browser (this is a static SPA — there is no
server). Defaults in parentheses.

| Var | Purpose |
| --- | --- |
| `VITE_HANZO_IAM_URL` (`https://hanzo.id`) | OIDC issuer. |
| `VITE_HANZO_CLIENT_ID` (`hanzo-app`) | IAM application (`<org>-<app>`). Its redirect-URI list must allow this deploy's `/auth/callback` — see **Ambient IAM**. |
| `VITE_HANZO_REDIRECT_URI` (`${origin}/auth/callback`) | PKCE redirect. |
| `VITE_HANZO_BASE_URL` (`https://api.hanzo.ai`) | Browser-reachable Hanzo Base data plane. Deploy injects the provisioned URL. |
| `VITE_HANZO_API_URL` / `VITE_HANZO_API_KEY` | Optional — only if the app calls the Hanzo LLM gateway. Unused here; never commit a real key. |

## How auth works — ambient IAM

`login()` starts an OAuth2 **PKCE S256** redirect to hanzo.id; hanzo.id returns
to `/auth/callback`, where `handleCallback()` exchanges the code for tokens
(stored in `localStorage`, refresh-aware via `offline_access`). Every deployed
app is a static site at `<slug>.hanzo.app`; there is **no server token** — the
SPA authenticates the user in the browser and carries the resulting IAM JWT to
Base. "Ambient" means the app just reads the signed-in user via that token.

The one deploy requirement: the IAM client (`VITE_HANZO_CLIENT_ID`) must list
this origin's `/auth/callback` as an allowed redirect URI. Register a
`https://*.hanzo.app/auth/callback` wildcard on the shared client so every
forked app works, or register a dedicated `habit-streak` client.

## How data works — Base from `schema.sql`

[`schema.sql`](./schema.sql) is the app's `databaseSchema` (SQL DDL). On publish,
Hanzo Cloud translates each `CREATE TABLE` into a Hanzo Base collection
(`provisionBaseFromDDL`, additive + idempotent). Base manages
`id`/`created`/`updated`/`owner`/`org`, stamps `owner`+`org` from the verified
IAM principal, and scopes every row to the caller's org (rule
`@request.auth.org_id = org`) — a teammate in your org sees the row; other orgs
cannot. At runtime `src/lib/data.ts` reads/writes the `habits` and `checkins`
collections through `@hanzo/base/react` (`useQuery`/`useMutation`) carrying the
IAM token. Keep `schema.sql` in lockstep with `src/lib/habits.ts`.

## Deploy — Hanzo Cloud

[`hanzo.yml`](./hanzo.yml) declares a static build (`npm run build` → `dist/`,
served at `<slug>.hanzo.app`) plus the Base schema to provision and the env to
inject. Do **not** build a container image locally — Hanzo Cloud owns builds and
deploys. CI here only proves the app compiles green.

## Layout

```
src/
  main.tsx          entry
  providers.tsx     GuiProvider -> IamProvider -> BaseProvider(client=IAM-token)
  app.tsx           route (/auth/callback) + auth gate
  gui.config.ts     createGui(defaultConfig from @hanzogui/config/v5)
  iam.config.ts     IAM PKCE config
  env.ts            the VITE_ env contract, one place
  ui.tsx            @hanzo/gui kit — CheckButton, Heatmap, StatTile, Segmented…
  lib/base.ts       BaseClient carrying the IAM bearer token
  lib/habits.ts     domain model + pure, TZ-safe streak/heatmap math
  lib/data.ts       Base hooks — useHabits, useCheckins
  auth/callback.tsx PKCE return leg
  views/            signed-out · home · today · detail · add
schema.sql          databaseSchema -> Base collections (habits, checkins)
hanzo.yml           Hanzo Cloud build/deploy manifest
```
