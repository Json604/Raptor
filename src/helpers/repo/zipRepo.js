import fs from "fs";
import os from "os";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

// ZIP DOWNLOADER - Fast current-state scanning (perfect for Raptor)
export const zipDownloader = async(url) => {
    const repoMatch = url.match(/github\.com\/([^\/]+)\/([^\/]+)(\/|$)/);
    if (!repoMatch) {
        const error = new Error("Could not extract owner/repo from URL");
        error.status = 400;
        throw error;
    }
    let owner = repoMatch[1];
    let repo = repoMatch[2].replace(/\.git$/, "");

    // Auto-detect default branch (main, master, etc.)
    let defaultBranch = 'main';
    try {
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
        const apiResponse = await axios.get(apiUrl);
        defaultBranch = apiResponse.data.default_branch;
        console.log(`📌 Default branch detected: ${defaultBranch}`);
    } catch (apiError) {
        console.warn('⚠️  Could not fetch default branch, trying common branches...');
        // Try common branch names
        const branchesToTry = ['main', 'master', 'develop'];
        for (const branch of branchesToTry) {
            try {
                const testUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/${branch}.zip`;
                await axios.head(testUrl);
                defaultBranch = branch;
                console.log(`📌 Found branch: ${defaultBranch}`);
                break;
            } catch (e) {
                // Branch doesn't exist, try next
            }
        }
    }

    // Build ZIP download URL
    const zipUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/${defaultBranch}.zip`;

    // Create temporary directory
    const tempDir = `${os.tmpdir()}/raptor-${uuidv4()}`;
    fs.mkdirSync(tempDir, { recursive: true });
    const zipPath = `${tempDir}/repo.zip`;

    console.log(`📥 Downloading repository ZIP (current files only)...`);

    // Download the ZIP
    const zipResponse = await axios({ url: zipUrl, responseType: 'stream' });
    await new Promise((resolve, reject) => {
        const stream = zipResponse.data.pipe(fs.createWriteStream(zipPath));
        stream.on('finish', resolve);
        stream.on('error', reject);
    });

    console.log(`✅ Repository downloaded successfully`);

    return {zipPath, tempDir};
}
