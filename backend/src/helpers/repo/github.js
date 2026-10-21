import axios from "axios";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import { Transform } from "stream";
import unzipper from "unzipper";
import { GITHUB_TOKEN } from "../../config/env.js";

const MAX_REPO_KB = 300 * 1024          // GitHub reports size in KB, history included
const MAX_DOWNLOAD_BYTES = 120 * 1024 * 1024
const MAX_EXTRACTED_BYTES = 400 * 1024 * 1024
const MAX_FILES = 25000
const MAX_FILE_BYTES = 10 * 1024 * 1024

// Third-party code that drowns real findings in noise and slows every tool down.
const SKIPPED_DIRS = /(^|\/)(node_modules|bower_components|vendor|\.venv|venv|__pycache__|\.next\/cache|\.git)(\/|$)/

const badRequest = (message, status = 400) => {
    const error = new Error(message)
    error.status = status
    error.expose = true
    return error
}

export const parseGithubRepo = (input) => {
    const raw = String(input || '').trim().replace(/\.git$/, '').replace(/\/+$/, '')
    const match = raw.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9-]{1,39})\/([A-Za-z0-9._-]{1,100})(?:\/.*)?$/i)
        || raw.match(/^([A-Za-z0-9-]{1,39})\/([A-Za-z0-9._-]{1,100})$/)
    if (!match || match[2] === '.' || match[2] === '..') {
        throw badRequest("That doesn't look like a GitHub repo. Use a link like github.com/you/your-app")
    }
    return { owner: match[1], repo: match[2] }
}

const githubHeaders = () => ({
    'User-Agent': 'RaptorSecurityScanner',
    'Accept': 'application/vnd.github+json',
    ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
})

// Returns null when the API is unavailable (e.g. rate limited) so the scan can
// still go ahead using the archive URL, which has no API quota.
export const fetchRepoInfo = async ({ owner, repo }) => {
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: githubHeaders(),
        timeout: 10000,
        validateStatus: () => true,
    })
    if (response.status === 404) {
        throw badRequest("We couldn't find that repo. It may be private; Raptor can only scan public repos for now.", 404)
    }
    if (response.status !== 200) return null
    const data = response.data
    if (data.size > MAX_REPO_KB) {
        throw badRequest(`That repo is ${Math.round(data.size / 1024)} MB. Quick scans handle repos up to ${MAX_REPO_KB / 1024} MB.`, 413)
    }
    return {
        fullName: data.full_name,
        url: data.html_url,
        branch: data.default_branch,
        sizeKb: data.size,
    }
}

const byteLimit = (limit) => {
    let seen = 0
    return new Transform({
        transform(chunk, _encoding, callback) {
            seen += chunk.length
            if (seen > limit) return callback(badRequest(`That repo is too large to download for a quick scan (over ${limit / 1024 / 1024} MB).`, 413))
            callback(null, chunk)
        },
    })
}

// HEAD is always the default branch, so this needs no API call.
export const downloadRepo = async ({ owner, repo }, workDir) => {
    const zipPath = path.join(workDir, 'repo.zip')
    const response = await axios.get(`https://codeload.github.com/${owner}/${repo}/zip/HEAD`, {
        responseType: 'stream',
        timeout: 60000,
        maxRedirects: 3,
        validateStatus: () => true,
        headers: githubHeaders(),
    })
    if (response.status === 404) {
        response.data.destroy()
        throw badRequest("We couldn't download that repo. It may be private or empty.", 404)
    }
    if (response.status !== 200) {
        response.data.destroy()
        throw badRequest(`GitHub returned an error (${response.status}) while downloading the repo. Try again in a minute.`, 502)
    }
    await pipeline(response.data, byteLimit(MAX_DOWNLOAD_BYTES), fs.createWriteStream(zipPath))
    return zipPath
}

export const extractRepo = async (zipPath, workDir) => {
    const destination = path.join(workDir, 'src')
    fs.mkdirSync(destination)
    const archive = await unzipper.Open.file(zipPath)
    const files = archive.files.filter(entry => entry.type === 'File')

    if (files.length > MAX_FILES) throw badRequest(`That repo has over ${MAX_FILES.toLocaleString()} files, which is too many for a quick scan.`, 413)
    const total = files.reduce((sum, entry) => sum + (entry.uncompressedSize || 0), 0)
    if (total > MAX_EXTRACTED_BYTES) throw badRequest('That repo is too large to scan once unpacked.', 413)

    let written = 0
    for (const entry of files) {
        // GitHub archives wrap everything in "<repo>-<branch>/"; drop that prefix.
        const relative = entry.path.split('/').slice(1).join('/')
        if (!relative || SKIPPED_DIRS.test(relative) || entry.uncompressedSize > MAX_FILE_BYTES) continue
        const target = path.resolve(destination, relative)
        if (!target.startsWith(destination + path.sep)) continue // zip-slip guard
        fs.mkdirSync(path.dirname(target), { recursive: true })
        await pipeline(entry.stream(), fs.createWriteStream(target))
        written++
    }
    return { repoDir: destination, fileCount: written }
}
