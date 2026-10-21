import { Router } from "express"
import rateLimit from "express-rate-limit"
import { createScan, getScan } from "../controllers/scan.controller.js"

const scanRouter = Router()

// Limits are per IP, and a whole venue's Wi-Fi can share one IP, so they're sized
// for a room full of people. The real protection is the queue, not these limits.
const scanLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 40,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json({
        success: false,
        error: "You've started a lot of scans in the last few minutes. Take a breather and try again shortly.",
    }),
})

// Polling is cheap (an in-memory lookup), but every open results page does it.
const pollLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 900,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json({ success: false, error: 'Too many requests. Try again in a minute.' }),
})

scanRouter.post('/scans', scanLimiter, createScan)
scanRouter.get('/scans/:id', pollLimiter, getScan)

export default scanRouter
