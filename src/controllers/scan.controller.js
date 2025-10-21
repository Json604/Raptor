import { githubUrlScanService, webUrlScanService } from "../services/scan.service.js";

export const githubUrlScan = async (req,res,next) => {
    try {
        const {url} = req.body
        const report = await githubUrlScanService(url)
        res.json({
            success: true,
            message: "GitHub repository scanned successfully",
            data: report
        })
    } catch (error) {
        next(error)
    }
}

export const webUrlScan = async (req,res,next) => {
    try {
        const {url} = req.body
        const report = await webUrlScanService(url)
        res.json({
            success: true,
            message: "Web application scanned successfully",
            data: report
        })
    } catch (error) {
        next(error)
    }
}