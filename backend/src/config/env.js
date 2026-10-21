import { config } from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

config({ path: `.env.local` })

export const PORT = Number(process.env.PORT) || 3000

// Optional. Raises the GitHub API limit from 60 to 5000 requests/hour.
export const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''

// Locally, `npm run setup` installs pinned builds into backend/bin. In Docker
// they live on the PATH instead.
const localBin = (name) => {
    const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'bin', name)
    return fs.existsSync(file) ? file : name
}

export const GITLEAKS_BIN = process.env.GITLEAKS_BIN || localBin('gitleaks')
export const TRUFFLEHOG_BIN = process.env.TRUFFLEHOG_BIN || localBin('trufflehog')
export const NPM_BIN = process.env.NPM_BIN || 'npm'

const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:4173',
    'https://raptorscan.netlify.app',
]

export const CORS_ORIGINS = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
    : defaultOrigins

// Netlify deploy previews: https://<hash>--raptorscan.netlify.app
export const CORS_ORIGIN_PATTERNS = [/^https:\/\/[a-z0-9-]+--raptorscan\.netlify\.app$/]

// Repo scans are the memory-heavy part, so they run one at a time. Website scans
// are light but still capped: this runs on a small droplet shared with other apps.
export const MAX_CONCURRENT_REPO_SCANS = Number(process.env.MAX_CONCURRENT_REPO_SCANS) || 1
export const MAX_CONCURRENT_WEB_SCANS = Number(process.env.MAX_CONCURRENT_WEB_SCANS) || 3
export const MAX_QUEUED_SCANS = Number(process.env.MAX_QUEUED_SCANS) || 20

// Hard ceiling per scan. When it's hit the scanners are killed and the slot goes
// to the next person in line, so one stuck scan can never block the queue.
export const REPO_SCAN_TIME_LIMIT_MS = Number(process.env.REPO_SCAN_TIME_LIMIT_MS) || 4 * 60 * 1000
export const WEB_SCAN_TIME_LIMIT_MS = Number(process.env.WEB_SCAN_TIME_LIMIT_MS) || 75 * 1000
