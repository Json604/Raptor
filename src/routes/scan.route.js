import { Router } from "express"
import { 
  githubUrlScan, webUrlScan, fullApplicationScan, healthCheck,
  deepGithubUrlScan, deepWebUrlScan, deepFullApplicationScan 
} from "../controllers/scan.controller.js"

const scanRouter = Router()

// Health check endpoint
scanRouter.get('/health', healthCheck)

// QUICK SCAN ROUTES (Free - No Nuclei)
// GitHub repository scanning
scanRouter.post('/scan/quick/github', githubUrlScan)

// Web application scanning
scanRouter.post('/scan/quick/web', webUrlScan)

// Full application scanning (GitHub + Web combined)
scanRouter.post('/scan/quick/full', fullApplicationScan)

// DEEP SCAN ROUTES (Paid - With Nuclei)
// Deep GitHub repository scanning
scanRouter.post('/scan/deep/github', deepGithubUrlScan)

// Deep web application scanning
scanRouter.post('/scan/deep/web', deepWebUrlScan)

// Deep full application scanning (GitHub + Web combined)
scanRouter.post('/scan/deep/full', deepFullApplicationScan)

export default scanRouter