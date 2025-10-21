import { githubUrlScanService } from "../services/scan.service.js";

export const githubUrlScan = async (req,res,next) => {
    try {
        const {url} = req.body
        const report = await githubUrlScanService(url)
        res.json({message: "Scanned Succesfully", data: report})
    } catch (error) {
        next(error)
    }
}