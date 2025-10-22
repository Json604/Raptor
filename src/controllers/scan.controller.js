import { githubUrlScanService, webUrlScanService, fullApplicationScanService } from "../services/scan.service.js";

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

export const fullApplicationScan = async (req,res,next) => {
    try {
        const {githubUrl, webUrl} = req.body
        
        // Validate both URLs are provided
        if (!githubUrl || !webUrl) {
            return res.status(400).json({
                success: false,
                message: "Both 'githubUrl' and 'webUrl' are required for full application scan"
            })
        }
        
        const report = await fullApplicationScanService(githubUrl, webUrl)
        res.json({
            success: true,
            message: "Full application security scan completed successfully",
            data: report
        })
    } catch (error) {
        next(error)
    }
}