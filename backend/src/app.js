import express from "express"
import cors from "cors"
import rateLimit from "express-rate-limit"
import { PORT, CORS_ORIGINS, CORS_ORIGIN_PATTERNS, GITLEAKS_BIN, TRUFFLEHOG_BIN } from "./config/env.js"
import scanRouter from "./routes/scan.route.js"
import errorMiddleware from "./middlewares/error.middleware.js"
import { queueStats } from "./services/jobs.js"
import { runTool } from "./helpers/scanners/runTool.js"

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

app.listen(PORT, async () => {
    console.log(`Raptor API listening on http://localhost:${PORT}`)
    const [gitleaks, trufflehog] = await Promise.all([
        runTool(GITLEAKS_BIN, ['version'], { timeout: 10000 }),
        runTool(TRUFFLEHOG_BIN, ['--version'], { timeout: 10000 }),
    ])
    toolVersions.gitleaks = gitleaks.error ? 'missing' : gitleaks.stdout.trim()
    toolVersions.trufflehog = trufflehog.error ? 'missing' : (trufflehog.stdout + trufflehog.stderr).trim()
    console.log('Scanners:', toolVersions)
})
