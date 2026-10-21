import { Router } from "express"
import rateLimit from "express-rate-limit"
import { createScan, getScan } from "../controllers/scan.controller.js"

const scanRouter = Router()

// Polling is cheap; starting scans is not.
const scanLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 15,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json({
        success: false,
        error: "You've started a lot of scans in the last few minutes. Take a breather and try again shortly.",
    }),
})

scanRouter.post('/scans', scanLimiter, createScan)
scanRouter.get('/scans/:id', getScan)

export default scanRouter
