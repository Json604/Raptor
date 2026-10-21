import { config } from "dotenv";

config({ path: `.env.local` })

export const PORT = Number(process.env.PORT) || 3000

// Optional. Raises the GitHub API limit from 60 to 5000 requests/hour.
export const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''

export const GITLEAKS_BIN = process.env.GITLEAKS_BIN || 'gitleaks'
export const TRUFFLEHOG_BIN = process.env.TRUFFLEHOG_BIN || 'trufflehog'
export const NPM_BIN = process.env.NPM_BIN || 'npm'

const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:4173',
    'https://raptor.support',
    'https://www.raptor.support',
    'https://raptorfe.netlify.app',
]

export const CORS_ORIGINS = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
    : defaultOrigins

// Netlify deploy previews: https://<hash>--raptorfe.netlify.app
export const CORS_ORIGIN_PATTERNS = [/^https:\/\/[a-z0-9-]+--raptorfe\.netlify\.app$/]

// Repo scans are the memory-heavy part, so they run one at a time.
export const MAX_CONCURRENT_REPO_SCANS = Number(process.env.MAX_CONCURRENT_REPO_SCANS) || 1
export const MAX_QUEUED_SCANS = Number(process.env.MAX_QUEUED_SCANS) || 20
