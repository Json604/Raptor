import express from "express"
import cors from "cors"
import rateLimit from "express-rate-limit"
import { PORT, CORS_ORIGINS, CORS_ORIGIN_PATTERNS, GITLEAKS_BIN, TRUFFLEHOG_BIN } from "./config/env.js"
import scanRouter from "./routes/scan.route.js"
import errorMiddleware from "./middlewares/error.middleware.js"
import { queueStats } from "./services/jobs.js"
import { runTool } from "./helpers/scanners/runTool.js"
import { removeStaleWorkDirs } from "./helpers/scanners/repository.js"

const app = express()

// Caddy sits in front; without this every visitor shares Caddy's IP and one rate limit.
app.set('trust proxy', 1)
app.disable('x-powered-by')

app.use(cors({
    origin: [...CORS_ORIGINS, ...CORS_ORIGIN_PATTERNS],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    maxAge: 86400,
}))

app.use(rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    // Polling has its own, larger limit in the scan router.
    skip: (req) => req.method === 'GET' && req.path.startsWith('/api/v1/scans/'),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json({ success: false, error: 'Too many requests. Try again in a minute.' }),
}))

app.use(express.json({ limit: '8kb' }))

const toolVersions = {}

app.get('/api/v1/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: Math.round(process.uptime()),
        memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        queue: queueStats(),
        tools: toolVersions,
    })
})

app.use('/api/v1', scanRouter)

app.use((req, res) => res.status(404).json({ success: false, error: 'Not found' }))
app.use(errorMiddleware)

// Reported by /health. Checked with a generous timeout and retried, because on a
// busy 1-CPU box TruffleHog can take a while just to start.
const checkTools = async () => {
    const [gitleaks, trufflehog] = await Promise.all([
        runTool(GITLEAKS_BIN, ['version'], { timeout: 30000 }),
        runTool(TRUFFLEHOG_BIN, ['--version'], { timeout: 30000 }),
    ])
    toolVersions.gitleaks = gitleaks.error ? 'unavailable' : gitleaks.stdout.trim()
    toolVersions.trufflehog = trufflehog.error ? 'unavailable' : (trufflehog.stdout + trufflehog.stderr).trim()
    console.log('Scanners:', toolVersions)
    if (gitleaks.error || trufflehog.error) setTimeout(checkTools, 60000).unref()
}

app.listen(PORT, () => {
    console.log(`Raptor API listening on http://localhost:${PORT}`)
    const stale = removeStaleWorkDirs()
    if (stale) console.log(`Removed ${stale} temp folder(s) left by an interrupted scan`)
    checkTools()
})
