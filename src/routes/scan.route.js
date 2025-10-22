import { Router } from "express"
import { githubUrlScan, webUrlScan, fullApplicationScan } from "../controllers/scan.controller.js"

const scanRouter = Router()

// GitHub repository scanning
scanRouter.post('/scan/github', githubUrlScan)

// Web application scanning
scanRouter.post('/scan/web', webUrlScan)

// Full application scanning (GitHub + Web combined)
scanRouter.post('/scan/full', fullApplicationScan)

export default scanRouter