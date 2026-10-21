import fs from "fs";
import os from "os";
import path from "path";
import { glob } from "glob";
import { GITLEAKS_BIN, TRUFFLEHOG_BIN, NPM_BIN } from "../../config/env.js";
import { fetchRepoInfo, downloadRepo, extractRepo } from "../repo/github.js";
import { runTool } from "./runTool.js";
import { SERVICES, looksLikePlaceholder, maskSecret, serviceFromDetector } from "./secretPatterns.js";

const IGNORE = ['**/node_modules/**', '**/vendor/**', '**/.venv/**', '**/venv/**']
const TEST_PATH = /(^|\/)(tests?|__tests__|spec|fixtures?|examples?|samples?|mocks?|docs?|testdata)(\/|$)|\.(test|spec)\.[a-z]+$|\.(example|sample|template)$/i
const DOWNGRADE = { critical: 'high', high: 'medium', medium: 'low', low: 'low', info: 'info' }
const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }

// ---------- Leaked secrets (Gitleaks + TruffleHog) ----------

const runGitleaks = async (repoDir, workDir) => {
    const report = path.join(workDir, 'gitleaks.json')
    const { error, timedOut } = await runTool(GITLEAKS_BIN, [
        'dir', repoDir,
        '--report-path', report,
        '--report-format', 'json',
        '--no-banner',
        '--log-level', 'error',
        '--exit-code', '0',
        '--max-target-megabytes', '5',
    ], { timeout: 120000, home: workDir })
    if (error) return { ok: false, timedOut, hits: [] }
    try {
        const results = JSON.parse(fs.readFileSync(report, 'utf8'))
        return {
            ok: true,
            hits: results.map(result => ({
                detector: result.RuleID,
                file: path.relative(repoDir, result.File),
                line: result.StartLine,
                secret: result.Secret,
                context: result.Match || '',
                verified: false,
            })),
        }
    } catch {
        return { ok: false, hits: [] }
    }
}

const runTrufflehog = async (repoDir, workDir) => {
    const { error, stdout, timedOut } = await runTool(TRUFFLEHOG_BIN, [
        'filesystem', repoDir, '--json', '--no-update',
    ], { timeout: 150000, home: workDir })
    if (error && !stdout) return { ok: false, timedOut, hits: [] }
    const hits = []
    for (const line of stdout.split('\n')) {
        if (!line.startsWith('{')) continue
        try {
            const result = JSON.parse(line)
            if (!result.DetectorName) continue
            const file = result.SourceMetadata?.Data?.Filesystem?.file
            hits.push({
                detector: result.DetectorName,
                file: file ? path.relative(repoDir, file) : 'unknown',
                line: result.SourceMetadata?.Data?.Filesystem?.line || 0,
                secret: result.Raw || result.RawV2 || '',
                // For paired credentials (AWS key id + secret) RawV2 holds both halves.
                related: result.RawV2 || '',
                verified: Boolean(result.Verified),
                rotationGuide: result.ExtraData?.rotation_guide,
            })
        } catch {
            // Partial line from a killed process.
        }
    }
    return { ok: !error || hits.length > 0, timedOut, hits }
}

// Both tools often flag the same key, sometimes with slightly different bounds.
// Group by the secret itself so one leaked key is one finding, however many files it's in.
const groupHits = (hits) => {
    const groups = []
    for (const hit of hits) {
        if (!hit.secret || hit.secret.length < 8 || looksLikePlaceholder(hit.secret)) continue
        const location = `${hit.file}${hit.line ? `:${hit.line}` : ''}`
        const existing = groups.find(group =>
            group.secret === hit.secret
            || (group.related && group.related.includes(hit.secret))
            || (group.locations.includes(location) && (group.secret.includes(hit.secret) || hit.secret.includes(group.secret))))
        if (existing) {
            if (!existing.locations.includes(location)) existing.locations.push(location)
            existing.verified ||= hit.verified
            existing.rotationGuide ||= hit.rotationGuide
            continue
        }
        groups.push({ ...hit, locations: [location] })
    }
    return groups
}

// Keys that are designed to be public (search-only, analytics, anon, publishable).
const PUBLIC_KEY_CONTEXT = /algolia|docsearch|docusaurus|search.?only|publishable|anon|measurement|site.?key|recaptcha|firebase|sentry|posthog|mixpanel|segment|amplitude|gtag|analytics/i
const SECRET_CONTEXT = /secret|passw|private|token|auth/i
// Real keys mix letters and digits; identifiers like getTargetKey and slugs don't.
const looksRandom = (value) => value.length >= 16 && /\d/.test(value) && /[A-Za-z]/.test(value) && !/^[a-z0-9]+(-[a-z0-9]+)+$/.test(value)

const secretFinding = (group) => {
    const serviceKey = serviceFromDetector(group.detector, group.secret)
    const service = SERVICES[serviceKey]
    const inTestFile = group.locations.every(location => TEST_PATH.test(location))
    let severity = group.verified ? 'critical' : service.severity

    // Gitleaks' generic rule fires on anything that looks like `apiKey = "..."`.
    // Without a known format, only flag it when the name says it's sensitive.
    if (serviceKey === 'generic' && !group.verified) {
        const context = `${group.context || ''} ${group.locations.join(' ')}`
        if (PUBLIC_KEY_CONTEXT.test(context) || !looksRandom(group.secret) || inTestFile) return null
        severity = SECRET_CONTEXT.test(group.context || '') ? 'medium' : 'low'
    }
    if (inTestFile && !group.verified) severity = DOWNGRADE[severity]
    const where = group.locations.length > 1 ? `${group.locations[0]} and ${group.locations.length - 1} other place${group.locations.length > 2 ? 's' : ''}` : group.locations[0]
    const rotate = group.rotationGuide || service.rotateUrl

    if (serviceKey === 'google_api' && !group.verified) {
        return {
            id: `secret-google-${maskSecret(group.secret)}`,
            source: 'code',
            category: 'Secrets',
            severity: 'low',
            title: 'Google API key in your repo',
            summary: `Found in ${where}. Firebase and Maps keys are meant to be public, but only if they're restricted. If this is a Gemini key, it's a real leak.`,
            risk: 'An unrestricted key can be used by anyone, for any Google API it\'s allowed to call, billed to you.',
            fix: ['In Google Cloud → Credentials, restrict this key to your domains and to only the APIs you use.', 'If it\'s a Gemini / AI Studio key, revoke it and call Gemini from server code instead.'],
            evidence: maskSecret(group.secret),
            location: group.locations[0],
            locations: group.locations,
            learnMore: service.rotateUrl,
        }
    }

    if (serviceKey === 'supabase_anon') {
        return {
            id: `secret-${maskSecret(group.secret)}`,
            source: 'code',
            category: 'Secrets',
            severity: 'info',
            title: 'Supabase anon key in your code (this one is meant to be public)',
            summary: `Found in ${where}. The anon key is safe to ship, but only if Row Level Security protects every table.`,
            risk: 'Any table without RLS can be read or written by anyone who has this key.',
            fix: ['In Supabase → Table Editor, confirm RLS is enabled on every table.', 'Add policies so users can only access their own rows.'],
            evidence: maskSecret(group.secret),
            location: group.locations[0],
            locations: group.locations,
            learnMore: 'https://supabase.com/docs/guides/database/postgres/row-level-security',
        }
    }

    return {
        id: `secret-${serviceKey}-${maskSecret(group.secret)}`,
        source: 'code',
        category: 'Secrets',
        severity,
        verified: group.verified,
        title: `${service.name} committed to your repo`,
        summary: `Found in ${where}.${group.verified ? ' We checked, and this key still works.' : ''} With it, someone could ${service.impact}.`
            + (inTestFile && !group.verified ? ' It\'s in a test or example file, so it may be a dummy value. Double-check.' : ''),
        risk: 'Bots scrape public repos for keys within minutes of a push. Deleting the line isn\'t enough, because the key stays in your git history forever.',
        fix: [
            rotate ? `Revoke this key and create a new one: ${rotate}` : 'Revoke this key and create a new one.',
            'Put the new key in an environment variable (.env locally, your host\'s settings in production) and read it with process.env.',
            'Add .env to your .gitignore so it can\'t be committed again.',
        ],
        evidence: maskSecret(group.secret),
        location: group.locations[0],
        locations: group.locations,
        learnMore: rotate,
    }
}

const scanSecrets = async (repoDir, workDir, coverage) => {
    const [gitleaks, trufflehog] = await Promise.all([runGitleaks(repoDir, workDir), runTrufflehog(repoDir, workDir)])
    if (!gitleaks.ok) coverage.push({ check: 'Gitleaks', status: 'failed', note: gitleaks.timedOut ? 'Gitleaks ran out of time on this repo.' : 'Gitleaks couldn\'t finish on this repo.' })
    if (!trufflehog.ok) coverage.push({ check: 'TruffleHog', status: 'failed', note: trufflehog.timedOut ? 'TruffleHog ran out of time on this repo.' : 'TruffleHog couldn\'t finish on this repo.' })
    if (!gitleaks.ok && !trufflehog.ok) {
        const error = new Error('Our secret scanners failed on this repo. Please try again.')
        error.status = 502
        error.expose = true
        throw error
    }
    // TruffleHog first so its verified status and detector names win the merge.
    return groupHits([...trufflehog.hits, ...gitleaks.hits]).map(secretFinding).filter(Boolean)
}

// ---------- Config files ----------

const ENV_ASSIGNMENT = /^\s*(?:export\s+)?([A-Z][A-Z0-9_]{1,60})\s*=\s*(.*)$/gm
// Prefixes that frameworks copy into the browser bundle.
const PUBLIC_PREFIX = /^(VITE_|NEXT_PUBLIC_|REACT_APP_|EXPO_PUBLIC_|PUBLIC_|NUXT_PUBLIC_|GATSBY_|VUE_APP_)/
const SECRET_NAME = /SECRET|PASSW|PRIVATE|TOKEN|API_?KEY|ACCESS_?KEY|CREDENTIAL|AUTH|DATABASE_URL|DB_URL|DSN|CONNECTION|SERVICE_ROLE|WEBHOOK/
const PUBLIC_BY_DESIGN = /ANON|PUBLISHABLE|PUBLIC_KEY|SITE_KEY|MEASUREMENT_ID|FIREBASE|APP_ID|PROJECT_ID|SENTRY_DSN|POSTHOG|ALGOLIA_SEARCH/

export const checkConfig = async (repoDir) => {
    const findings = []
    const passed = []

    const envFiles = (await glob(['**/.env', '**/.env.*', '**/*.env'], { cwd: repoDir, dot: true, nodir: true, ignore: IGNORE }))
        .filter(file => !/\.(example|sample|template|dist|defaults?|schema)$/i.test(file))
    for (const file of envFiles.slice(0, 10)) {
        let content = ''
        try { content = fs.readFileSync(path.join(repoDir, file), 'utf8').slice(0, 64 * 1024) } catch { continue }
        const secrets = [...content.matchAll(ENV_ASSIGNMENT)]
            .filter(([, name, value]) => {
                const clean = value.trim().replace(/^["']|["']$/g, '')
                return clean.length > 0 && !looksLikePlaceholder(clean) && SECRET_NAME.test(name) && !PUBLIC_BY_DESIGN.test(name)
            })
            .map(([, name]) => name)
        // Committed env files holding only public config (URLs, modes, VITE_ flags) are normal.
        if (!secrets.length) continue

        const bundled = secrets.filter(name => PUBLIC_PREFIX.test(name))
        const list = (names) => names.slice(0, 4).join(', ') + (names.length > 4 ? ', …' : '')
        findings.push({
            id: `env-file-${file}`,
            source: 'code',
            category: 'Configuration',
            severity: 'high',
            title: `${path.basename(file)} with secrets is committed to your repo`,
            summary: `${file} is public and contains ${secrets.length} secret value${secrets.length === 1 ? '' : 's'} (${list(secrets)}).`
                + (bundled.length ? ` ${list(bundled)} also ${bundled.length === 1 ? 'has a prefix' : 'have prefixes'} that copies the value into your frontend bundle, so ${bundled.length === 1 ? 'it ships' : 'they ship'} to every visitor.` : ''),
            risk: 'Anyone browsing your repo can copy these values. Removing the file now doesn\'t help, because it stays in your git history.',
            fix: [
                `Run: git rm --cached ${file}`,
                'Add .env* to .gitignore (keep a .env.example with empty values for other developers).',
                'Rotate every secret that was in this file.',
                ...(bundled.length ? ['Rename secret variables so they don\'t start with VITE_, NEXT_PUBLIC_ or REACT_APP_, and only use them from server code.'] : []),
            ],
            snippet: { label: '.gitignore', language: 'text', code: '.env\n.env.*\n!.env.example' },
            location: file,
            evidence: `Secret variables: ${list(secrets)}`,
        })
    }
    if (!findings.length) passed.push({ source: 'code', title: envFiles.length ? 'No secrets in committed .env files' : 'No .env files committed' })

    // Firebase rules left in "test mode" are one of the most common real-world leaks.
    const rulesFiles = await glob(['**/firestore.rules', '**/storage.rules', '**/database.rules.json'], { cwd: repoDir, nodir: true, ignore: IGNORE })
    let openRules = 0
    for (const file of rulesFiles.slice(0, 6)) {
        let content = ''
        try { content = fs.readFileSync(path.join(repoDir, file), 'utf8').slice(0, 128 * 1024) } catch { continue }
        const wideOpen = file.endsWith('.json')
            ? /"\.(read|write)"\s*:\s*(true|"true")/.test(content)
            : /allow\s+[a-z,\s]+(:\s*if\s+true\s*)?;/.test(content) || /allow\s+[a-z,\s]+:\s*if\s+request\.time\s*</.test(content)
        if (!wideOpen) continue
        openRules++
        const product = file.includes('storage') ? 'Firebase Storage' : file.endsWith('.json') ? 'Realtime Database' : 'Firestore database'
        findings.push({
            id: `firebase-rules-${file}`,
            source: 'code',
            category: 'Configuration',
            severity: 'high',
            title: `Your ${product} rules let anyone read and write`,
            summary: `${file} allows access without checking who's asking (often the default "test mode" rules).`,
            risk: 'Anyone with your project ID, which ships in your frontend code, can download or wipe all of your data.',
            fix: ['Require sign-in at minimum: allow read, write: if request.auth != null;', 'Better: only let users access their own documents (match on request.auth.uid).', 'Deploy the rules with firebase deploy --only firestore:rules (or storage).'],
            snippet: {
                label: 'firestore.rules',
                language: 'text',
                code: "rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /users/{userId}/{document=**} {\n      allow read, write: if request.auth != null && request.auth.uid == userId;\n    }\n  }\n}",
            },
            location: file,
            learnMore: 'https://firebase.google.com/docs/rules/insecure-rules',
        })
    }
    if (rulesFiles.length && !openRules) passed.push({ source: 'code', title: 'Firebase security rules aren\'t wide open' })

    return { findings, passed }
}

// ---------- Dependencies (npm audit) ----------

const NPM_SEVERITY = { critical: 'critical', high: 'high', moderate: 'medium', low: 'low', info: 'info' }

const auditDependencies = async (repoDir, workDir, coverage) => {
    const lockfiles = (await glob('**/package-lock.json', { cwd: repoDir, nodir: true, ignore: IGNORE }))
        .sort((a, b) => a.split('/').length - b.split('/').length)
    const otherLocks = await glob(['**/yarn.lock', '**/pnpm-lock.yaml', '**/bun.lockb', '**/bun.lock'], { cwd: repoDir, nodir: true, ignore: IGNORE })
    const manifests = await glob(['**/package.json'], { cwd: repoDir, nodir: true, ignore: IGNORE })

    if (!lockfiles.length) {
        if (otherLocks.length) coverage.push({ check: 'Dependencies', status: 'partial', note: 'This repo uses yarn, pnpm or bun. Raptor can only audit npm lockfiles (package-lock.json) right now.' })
        else if (manifests.length) coverage.push({ check: 'Dependencies', status: 'partial', note: 'No package-lock.json found, so exact package versions couldn\'t be checked.' })
        return { findings: [], passed: [], audited: 0 }
    }
    if (lockfiles.length > 4) coverage.push({ check: 'Dependencies', status: 'partial', note: `Audited 4 of ${lockfiles.length} npm projects in this repo.` })

    const vulnerable = new Map()
    let audited = 0
    for (const lockfile of lockfiles.slice(0, 4)) {
        const dir = path.join(repoDir, path.dirname(lockfile))
        if (!fs.existsSync(path.join(dir, 'package.json'))) continue
        // A repo's .npmrc could point npm at any registry; ignore it.
        fs.rmSync(path.join(dir, '.npmrc'), { force: true })
        const { stdout } = await runTool(NPM_BIN, [
            'audit', '--json', '--omit=dev', '--registry=https://registry.npmjs.org/', '--no-update-notifier', '--no-fund',
        ], { cwd: dir, timeout: 60000, home: workDir })
        let report
        try { report = JSON.parse(stdout) } catch { continue }
        if (report.error) continue
        audited++

        let versions = {}
        try { versions = JSON.parse(fs.readFileSync(path.join(dir, 'package-lock.json'), 'utf8')).packages || {} } catch { /* versions are a nicety */ }

        for (const [name, entry] of Object.entries(report.vulnerabilities || {})) {
            const advisories = (entry.via || []).filter(via => typeof via === 'object')
            if (!advisories.length) continue // only vulnerable because of a dependency; reported there
            const current = vulnerable.get(name)
            const severity = NPM_SEVERITY[entry.severity] || 'medium'
            const fix = entry.fixAvailable
            const record = {
                name,
                version: versions[`node_modules/${name}`]?.version,
                severity,
                direct: entry.isDirect,
                advisories: advisories.map(advisory => ({ title: advisory.title, url: advisory.url })),
                fix: fix === true ? { command: 'npm audit fix' }
                    : fix && typeof fix === 'object' ? { command: fix.name === name ? `npm install ${name}@${fix.version}` : `npm install ${fix.name}@${fix.version}`, major: fix.isSemVerMajor }
                    : null,
                project: path.dirname(lockfile) === '.' ? null : path.dirname(lockfile),
            }
            // The same package can show up in several projects; keep its worst rating.
            if (!current || SEVERITY_ORDER[severity] < SEVERITY_ORDER[current.severity]) vulnerable.set(name, record)
        }
    }

    if (!audited) {
        coverage.push({ check: 'Dependencies', status: 'failed', note: 'npm couldn\'t audit this repo\'s lockfile.' })
        return { findings: [], passed: [], audited }
    }

    const sorted = [...vulnerable.values()].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || Number(b.direct) - Number(a.direct))
    if (sorted.length > 15) coverage.push({ check: 'Dependencies', status: 'partial', note: `Showing the 15 most serious of ${sorted.length} vulnerable packages. Run npm audit to see them all.` })

    const findings = sorted.slice(0, 15).map(pkg => ({
        id: `dep-${pkg.name}`,
        source: 'code',
        category: 'Dependencies',
        severity: pkg.severity,
        title: `${pkg.name}${pkg.version ? ` ${pkg.version}` : ''} has a known vulnerability`,
        summary: `${pkg.advisories[0].title}${pkg.advisories.length > 1 ? ` (and ${pkg.advisories.length - 1} more advisor${pkg.advisories.length > 2 ? 'ies' : 'y'})` : ''}. ${pkg.direct ? 'You depend on it directly.' : 'It comes in through another package you use.'}`,
        risk: 'Attackers scan for apps running versions with published vulnerabilities, because the exploit is often public too.',
        fix: pkg.fix
            ? [`${pkg.project ? `In ${pkg.project}/, run` : 'Run'}: ${pkg.fix.command}`, pkg.fix.major ? 'This is a major version bump, so check the package\'s changelog and test your app afterwards.' : 'Then redeploy.']
            : ['No patched version exists yet. Check the advisory for a workaround, or replace the package.'],
        snippet: pkg.fix ? { label: 'Terminal', language: 'bash', code: pkg.fix.command } : undefined,
        location: pkg.project ? `${pkg.project}/package-lock.json` : 'package-lock.json',
        learnMore: pkg.advisories[0].url,
    }))

    return { findings, passed: findings.length ? [] : [{ source: 'code', title: 'No known-vulnerable npm packages' }], audited }
}

// ---------- Orchestration ----------

export const scanRepository = async (ref, { step = () => {} } = {}) => {
    const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'raptor-'))
    const coverage = []
    try {
        step('download', 'active')
        const info = await fetchRepoInfo(ref)
        const zipPath = await downloadRepo(ref, workDir)
        const { repoDir, fileCount } = await extractRepo(zipPath, workDir)
        fs.rmSync(zipPath, { force: true })
        step('download', 'done')

        step('secrets', 'active')
        const secrets = await scanSecrets(repoDir, workDir, coverage)
        step('secrets', 'done')

        step('config', 'active')
        const config = await checkConfig(repoDir)
        step('config', 'done')

        step('deps', 'active')
        const deps = await auditDependencies(repoDir, workDir, coverage)
        step('deps', 'done')

        const realSecrets = secrets.filter(finding => finding.severity !== 'info')
        return {
            repo: info?.fullName || `${ref.owner}/${ref.repo}`,
            url: info?.url || `https://github.com/${ref.owner}/${ref.repo}`,
            branch: info?.branch || null,
            fileCount,
            findings: [...secrets, ...config.findings, ...deps.findings],
            passed: [
                ...(realSecrets.length ? [] : [{ source: 'code', title: `No leaked keys in ${fileCount.toLocaleString()} files` }]),
                ...config.passed,
                ...deps.passed,
            ],
            coverage,
        }
    } finally {
        fs.rmSync(workDir, { recursive: true, force: true })
    }
}
