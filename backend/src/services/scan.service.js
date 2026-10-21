import { normalizeWebsiteUrl, scanWebsite } from "../helpers/scanners/website.js"
import { parseGithubRepo } from "../helpers/repo/github.js"
import { scanRepository } from "../helpers/scanners/repository.js"
import { buildReport } from "../helpers/report/report.js"
import { submitJob } from "./jobs.js"

const WEBSITE_STEPS = [
    ['web.site', 'Connecting to your site'],
    ['web.headers', 'Checking HTTPS, headers and cookies'],
    ['web.exposed', 'Looking for exposed .env and .git files'],
    ['web.bundle', 'Searching your JavaScript for API keys'],
]

const REPO_STEPS = [
    ['repo.download', 'Downloading the repository'],
    ['repo.secrets', 'Searching every file for leaked keys'],
    ['repo.config', 'Reviewing config files and database rules'],
    ['repo.deps', 'Checking packages for known vulnerabilities'],
]

const MAX_INPUT_LENGTH = 500

export const startScan = ({ url, repo }) => {
    url = typeof url === 'string' ? url.trim().slice(0, MAX_INPUT_LENGTH) : ''
    repo = typeof repo === 'string' ? repo.trim().slice(0, MAX_INPUT_LENGTH) : ''

    // People paste repo links into the website box; route them to the right scanner.
    if (url && !repo && /^(https?:\/\/)?(www\.)?github\.com\//i.test(url)) {
        repo = url
        url = ''
    }

    if (!url && !repo) {
        const error = new Error('Enter a website, a GitHub repo, or both.')
        error.status = 400
        error.expose = true
        throw error
    }

    // Validate up front so typos fail instantly instead of after queueing.
    const website = url ? normalizeWebsiteUrl(url) : null
    const repoRef = repo ? parseGithubRepo(repo) : null

    return submitJob({
        target: {
            website: website ? website.toString() : null,
            repo: repoRef ? `${repoRef.owner}/${repoRef.repo}` : null,
        },
        steps: [...(website ? WEBSITE_STEPS : []), ...(repoRef ? REPO_STEPS : [])],
        lane: repoRef ? 'repo' : 'web',
        task: async ({ step, signal }) => {
            const startedAt = Date.now()
            const [websiteResult, codeResult] = await Promise.allSettled([
                website ? scanWebsite(website.toString(), { signal, step: (key, state) => step(`web.${key}`, state) }) : null,
                repoRef ? scanRepository(repoRef, { signal, step: (key, state) => step(`repo.${key}`, state) }) : null,
            ])

            const failures = [websiteResult, codeResult].filter(result => result.status === 'rejected')
            // If everything that was asked for failed, the scan failed.
            if (failures.length && failures.length === (website ? 1 : 0) + (repoRef ? 1 : 0)) throw failures[0].reason

            const errors = []
            if (websiteResult.status === 'rejected') {
                errors.push({ check: 'Website scan', status: 'failed', note: websiteResult.reason.expose ? websiteResult.reason.message : 'The website scan failed.' })
            }
            if (codeResult.status === 'rejected') {
                errors.push({ check: 'Repository scan', status: 'failed', note: codeResult.reason.expose ? codeResult.reason.message : 'The repository scan failed.' })
            }

            return buildReport({
                website: websiteResult.status === 'fulfilled' ? websiteResult.value : null,
                code: codeResult.status === 'fulfilled' ? codeResult.value : null,
                errors,
                startedAt,
            })
        },
    })
}
