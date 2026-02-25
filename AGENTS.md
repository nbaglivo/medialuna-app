# Medialuna

A personal productivity / day-planning web app built with Next.js 16, React 19, Tailwind CSS v4, and Supabase (PostgreSQL).

## Cursor Cloud specific instructions

### Services

| Service | Purpose | Port |
|---|---|---|
| Next.js dev server | Main web app | 3000 |
| Supabase (local) | PostgreSQL, Auth, REST API | API: 54321, DB: 54322, Studio: 54323 |

### Running the app

1. **Start Docker** (required for Supabase): `sudo dockerd &>/tmp/dockerd.log &` then wait a few seconds, then `sudo chmod 666 /var/run/docker.sock`
2. **Start Supabase**: `npx supabase start` (pulls Docker images on first run; takes ~2 min)
3. **Create `.env.local`** if it doesn't exist. Get values via `npx supabase status -o env`:
   - `SUPABASE_URL` = use the `API_URL` value from supabase status output
   - `SUPABASE_SERVICE_ROLE_KEY` = use the `SERVICE_ROLE_KEY` value from supabase status output
4. **Start dev server**: `pnpm dev` (port 3000)

### Key gotchas

- Docker must be configured with `fuse-overlayfs` storage driver and `iptables-legacy` in the Cloud VM environment (nested container setup).
- The Supabase CLI is installed as a dev dependency (`supabase` package in `package.json`); no global install needed.
- Linear integration is optional; the app degrades gracefully without `LINEAR_CLIENT_ID`, `LINEAR_CLIENT_SECRET`, `LINEAR_REDIRECT_URI` env vars.
- ESLint (`pnpm lint`) reports pre-existing warnings/errors in the codebase (13 errors, 22 warnings) -- these are not blockers.
- `pnpm build` compiles successfully despite lint errors.

### Commands reference

- **Install deps**: `pnpm install`
- **Dev server**: `pnpm dev`
- **Lint**: `pnpm lint`
- **Build**: `pnpm build`
- **Supabase start**: `npx supabase start`
- **Supabase status**: `npx supabase status`
