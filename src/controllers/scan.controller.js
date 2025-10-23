import { githubUrlScanService, webUrlScanService, fullApplicationScanService } from "../services/scan.service.js";
import { scanRateLimiter } from "../helpers/queue/rateLimiter.js";
import { scanQueue } from "../helpers/queue/scanQueue.js";
import { analyzeReportWithAI } from "../helpers/ai/analyseReport.js";

export const githubUrlScan = async (req,res,next) => {
    try {
        const {url} = req.body
        
        // Rate limiting (1 scan per minute per IP)
        const clientId = req.ip || req.connection.remoteAddress;
        const rateCheck = scanRateLimiter.check(clientId);
        
        if (!rateCheck.allowed) {
            return res.status(429).json({
                success: false,
                message: rateCheck.message,
                retryAfter: rateCheck.retryAfter
            });
        }
        
        const report = await githubUrlScanService(url)
        console.log(report.raw);
        const aiReport = await analyzeReportWithAI(report.raw);

        res.json({
            success: true,
            message: "GitHub repository scanned successfully",
            data: {report,aiReport}
        })
    } catch (error) {
        next(error)
    }
}

export const webUrlScan = async (req,res,next) => {
    try {
        const {url} = req.body
        
        // Rate limiting (1 scan per minute per IP)
        const clientId = req.ip || req.connection.remoteAddress;
        const rateCheck = scanRateLimiter.check(clientId);
        
        if (!rateCheck.allowed) {
            return res.status(429).json({
                success: false,
                message: rateCheck.message,
                retryAfter: rateCheck.retryAfter
            });
        }
        
        const report = await webUrlScanService(url)
        const aiReport = await analyzeReportWithAI(report.raw);

        res.json({
            success: true,
            message: "Web application scanned successfully",
            data: {report,aiReport}
        })
    } catch (error) {
        next(error)
    }
}

export const fullApplicationScan = async (req,res,next) => {
    try {
        const {githubUrl, webUrl} = req.body
        
        // Rate limiting (1 scan per minute per IP)
        const clientId = req.ip || req.connection.remoteAddress;
        const rateCheck = scanRateLimiter.check(clientId);
        
        if (!rateCheck.allowed) {
            return res.status(429).json({
                success: false,
                message: rateCheck.message,
                retryAfter: rateCheck.retryAfter
            });
        }
        
        // Validate both URLs are provided
        if (!githubUrl || !webUrl) {
            return res.status(400).json({
                success: false,
                message: "Both 'githubUrl' and 'webUrl' are required for full application scan"
            })
        }
        
        const report = await fullApplicationScanService(githubUrl, webUrl)
        const aiReport = await analyzeReportWithAI(report.raw);

        res.json({
            success: true,
            message: "Full application security scan completed successfully",
            data: {report,aiReport}
        })
    } catch (error) {
        next(error)
    }
}

// Health check endpoint
export const healthCheck = async (req,res) => {
    const memoryUsage = process.memoryUsage();
    const queueStatus = scanQueue.getStatus();
    
    const healthStatus = {
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        memory: {
            heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
            rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
            healthy: memoryUsage.heapUsed < 400 * 1024 * 1024 // Under 400MB
        },
        queue: {
            ...queueStatus,
            healthy: queueStatus.queueLength < 10 // Queue not too long
        },
        environment: {
            useDocker: process.env.USE_DOCKER === 'true',
            nodeEnv: process.env.NODE_ENV || 'development',
            port: process.env.PORT || 3000
        }
    };
    
    // Determine overall health
    const isHealthy = healthStatus.memory.healthy && healthStatus.queue.healthy;
    healthStatus.status = isHealthy ? 'healthy' : 'degraded';
    
    res.status(isHealthy ? 200 : 503).json(healthStatus);
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