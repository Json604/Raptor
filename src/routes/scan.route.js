import { Router } from "express"
import { githubUrlScan } from "../controllers/scan.controller.js"

const scanRouter = Router()

scanRouter.post('/scan/github', githubUrlScan)

export default scanRouter