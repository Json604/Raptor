# Raptor

**Is your app leaking your API keys?** Raptor is a free security scanner for apps built fast with AI tools. Paste a live site, a public GitHub repo, or both. It finds leaked keys, exposed files and missing protections, then explains each one in plain English with a copy-paste fix.

Live at **[raptor.support](https://raptor.support)**. No sign-up.

## What it checks

| | Website | Repository |
| --- | --- | --- |
| **Leaked secrets** | OpenAI, Stripe, Supabase `service_role`, AWS, GitHub and other keys shipped in your JavaScript bundle | Gitleaks + TruffleHog over every file; TruffleHog confirms which keys **still work** |
| **Exposed files** | Public `/.env`, `/.env.local`, `/.env.production`, `/.git/` | `.env` files with real secrets committed, including secrets behind `VITE_` / `NEXT_PUBLIC_` prefixes |
| **Databases** | Supabase anon key found → RLS reminder | Firebase / Firestore / Storage rules left open or in test mode |
| **Transport & headers** | HTTPS, HTTP→HTTPS redirect, HSTS, CSP, clickjacking, nosniff, cookies, CORS origin reflection | |
| **Dependencies** | | `npm audit` on production dependencies |

Fixes are written for the host it detects (Netlify, Vercel, Next.js, Express), and the report can be copied as a prompt for Cursor, Claude Code, Lovable or Bolt.

## Layout

```
backend/   Express API + scanners (Node 22, Gitleaks, TruffleHog), runs in Docker
frontend/  React + Vite site, deployed on Netlify
demo/      Generator for a deliberately insecure demo site (fake keys)
deploy/    Droplet deploy script and Caddy config
```

## Run locally

```bash
# API (needs gitleaks and trufflehog on your PATH: brew install gitleaks trufflehog)
cd backend
npm install
npm run dev          # http://localhost:3000
npm test

# Site
cd frontend
npm install
cp .env.example .env # VITE_API_URL=http://localhost:3000/api/v1
npm run dev          # http://localhost:5173
```

Or run the API exactly as production does: `cd backend && docker compose up --build` (listens on `127.0.0.1:3100`).

## API

| | |
| --- | --- |
| `POST /api/v1/scans` | Body `{ "url"?: string, "repo"?: string }`. Returns `202` with a job (`id`, `status`, `steps`). |
| `GET /api/v1/scans/:id` | Poll for progress. When `status` is `done`, `result` holds the report. Jobs are kept in memory for 2 hours. |
| `GET /api/v1/health` | Uptime, memory, queue and scanner versions. |

Repo scans run one at a time (the server has 1 GB of RAM); queued jobs report their position.

## Deploy

- **API + demo site** → DigitalOcean droplet: `./deploy/deploy.sh`. Caddy terminates TLS in front of the container. The site blocks are in `deploy/Caddyfile.raptor`.
- **Frontend** → Netlify site `raptorfe`, base directory `frontend/`; `frontend/netlify.toml` holds the build settings, the API URL and the security headers.

## How Raptor protects itself

Raptor downloads code and fetches URLs that strangers choose, so:

- Scanners run via `execFile` with argument arrays. No shell, so a repo can't inject commands through file or branch names.
- Website scans refuse private, loopback and cloud-metadata addresses, re-check every redirect hop, and check DNS answers too.
- Downloads, unpacked size, file count and per-file size are capped; archive paths are checked for traversal.
- Secrets are masked before they leave the server; repos are deleted right after each scan.
- The container runs as a non-root user with no capabilities, a 640 MB memory cap and a CPU cap.
- Scanner binaries are pinned and checksum-verified at build time.
