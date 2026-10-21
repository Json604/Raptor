import { startScan } from "../services/scan.service.js";
import { getJob } from "../services/jobs.js";

export const createScan = async (req, res, next) => {
    try {
        const { url, repo } = req.body || {}
        const job = startScan({ url, repo })
        res.status(202).json({ success: true, data: getJob(job.id) })
    } catch (error) {
        next(error)
    }
}

export const getScan = async (req, res, next) => {
    try {
        const job = getJob(req.params.id)
        if (!job) {
            return res.status(404).json({ success: false, error: 'This scan has expired or never existed. Results are kept for 2 hours.' })
        }
        res.set('Cache-Control', 'no-store')
        res.json({ success: true, data: job })
    } catch (error) {
        next(error)
    }
}
