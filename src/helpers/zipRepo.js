import fs from "fs";
import os from "os";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

// ZIP DOWNLOADer
export const zipDownloader = async(url) => {
    const repoMatch = url.match(/github\.com\/([^\/]+)\/([^\/]+)(\/|$)/);
    if (!repoMatch) {
    const error = new Error("Could not extract owner/repo from URL");
    error.status = 400;
    throw error;
    }
    const owner = repoMatch[1];
    const repo = repoMatch[2];

    // Build the ZIP Download URL
    const zipUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/main.zip`;

    // Create a Temporary Directory to Store the ZIP File
    const tempDir = `${os.tmpdir()}/raptor-${uuidv4()}`;
    fs.mkdirSync(tempDir, { recursive: true });
    const zipPath = `${tempDir}/repo.zip`;

    // Download the ZIP to temp directory
    const zipResponse = await axios({ url: zipUrl, responseType: 'stream' });
    await new Promise((resolve, reject) => {
    const stream = zipResponse.data.pipe(fs.createWriteStream(zipPath));
    stream.on('finish', resolve);
    stream.on('error', reject);
    });

    return {zipPath, tempDir};
}
