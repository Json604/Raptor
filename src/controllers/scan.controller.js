import { githubUrlScanService, webUrlScanService, fullApplicationScanService } from "../services/scan.service.js";
import { scanRateLimiter } from "../helpers/rateLimiter.js";
import { scanQueue } from "../helpers/scanQueue.js";

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
        res.json({
            success: true,
            message: "Full application security scan completed successfully",
            data: report
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