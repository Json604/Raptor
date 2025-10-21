import { Router } from "express"
import { githubUrlScan, webUrlScan } from "../controllers/scan.controller.js"

const scanRouter = Router()

// GitHub repository scanning
scanRouter.post('/scan/github', githubUrlScan)

// Web application scanning
scanRouter.post('/scan/web', webUrlScan)

export default scanRouter