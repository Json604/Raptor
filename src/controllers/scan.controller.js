import { githubUrlScanService, webUrlScanService, fullApplicationScanService } from "../services/scan.service.js";
import { analyzeReportWithAI } from "../helpers/ai/analyseReport.js";

export const githubUrlScan = async (req,res,next) => {
    try {
        const {url} = req.body       
        
        const report = await githubUrlScanService(url)
        // const aiReport = await analyzeReportWithAI(report.raw);

        res.json({
            success: true,
            message: "GitHub repository scanned successfully",
            data:report
        })
    } catch (error) {
        next(error)
    }
}

export const webUrlScan = async (req,res,next) => {
    try {
        const {url} = req.body
        
        const report = await webUrlScanService(url)
        // const aiReport = await analyzeReportWithAI(report.raw);

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
        // const aiReport = await analyzeReportWithAI(report.raw);

        res.json({
            success: true,
            message: "Full application security scan completed successfully",
            data: report
        })
    } catch (error) {
        next(error)
    }
}


// DEEP SCAN CONTROLLERS (Paid Features - Coming Soon)
export const deepGithubUrlScan = async (req, res, next) => {
    res.status(503).json({
        success: false,
        message: "Deep Scan feature coming soon! This will include advanced vulnerability scanning with Nuclei.",
        feature: "Deep GitHub Scan",
        status: "coming_soon",
    });
}

export const deepWebUrlScan = async (req, res, next) => {
    res.status(503).json({
        success: false,
        message: "Deep Scan feature coming soon! This will include advanced vulnerability scanning with Nuclei.",
        feature: "Deep Web Scan", 
        status: "coming_soon",
    });
}

export const deepFullApplicationScan = async (req, res, next) => {
    res.status(503).json({
        success: false,
        message: "Deep Scan feature coming soon! This will include advanced vulnerability scanning with Nuclei and correlation analysis.",
        feature: "Deep Full Application Scan",
        status: "coming_soon", 
    });
}