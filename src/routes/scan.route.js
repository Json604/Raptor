import { Router } from "express"
import { githubUrlScan, webUrlScan, fullApplicationScan,deepGithubUrlScan, deepWebUrlScan, deepFullApplicationScan } from "../controllers/scan.controller.js"

const scanRouter = Router()


// QUICK SCAN ROUTES (Free - No Nuclei)
scanRouter.post('/scan/quick/github', githubUrlScan)
scanRouter.post('/scan/quick/web', webUrlScan)
scanRouter.post('/scan/quick/full', fullApplicationScan)

// DEEP SCAN ROUTES (Paid - With Nuclei)
scanRouter.post('/scan/deep/github', deepGithubUrlScan)
scanRouter.post('/scan/deep/web', deepWebUrlScan)
scanRouter.post('/scan/deep/full', deepFullApplicationScan)

export default scanRouter