import isGithubUrl from "is-github-url"
import { axiosURLverifier } from "../helpers/verifyRepo.js"
import { zipDownloader } from "../helpers/zipRepo.js"
import { unzipRepo } from "../helpers/unzipRepo.js"
import { runGitleaks, runTruffleHog } from "../helpers/runScans.js"
import fs from "fs"

export const githubUrlScanService = async (url) => {
    
    if(!isGithubUrl(url)){
        const error = new Error("Invalid Github URL")
        error.status = 400
        throw error
    }
    await axiosURLverifier(url)
    const {zipPath, tempDir} = await zipDownloader(url)

    const repoPath = await unzipRepo(zipPath, tempDir);

    // Run scans
    const trufflehogResults = await runTruffleHog(repoPath);
    const gitleaksResults = await runGitleaks(repoPath);

    // Cleanup temp
    fs.rmSync(tempDir, { recursive: true, force: true });

    // Return/aggregate results
    return { trufflehog: trufflehogResults, gitleaks: gitleaksResults };
}