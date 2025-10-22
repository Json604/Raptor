import { Router } from "express"
import { githubUrlScan, webUrlScan, fullApplicationScan, healthCheck } from "../controllers/scan.controller.js"

const scanRouter = Router()

// Health check endpoint
scanRouter.get('/health', healthCheck)

// GitHub repository scanning
scanRouter.post('/scan/github', githubUrlScan)

// Web application scanning
scanRouter.post('/scan/web', webUrlScan)

// Full application scanning (GitHub + Web combined)
scanRouter.post('/scan/full', fullApplicationScan)

export default scanRouter