import { safeGet, describeNetworkError } from "../net/safeHttp.js"
import { SERVICES, findSecretsInText, maskSecret } from "./secretPatterns.js"

export const normalizeWebsiteUrl = (input) => {
    const raw = String(input || '').trim()
    if (!raw) {
        const error = new Error("Enter your site's address, like myapp.vercel.app")
        error.status = 400
        error.expose = true
        throw error
    }
    let url
    try {
        url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`)
    } catch {
        const error = new Error("That doesn't look like a web address. Try something like myapp.vercel.app")
        error.status = 400
        error.expose = true
        throw error
    }
    if (!url.hostname.includes('.')) {
        const error = new Error("That doesn't look like a web address. Try something like myapp.vercel.app")
        error.status = 400
        error.expose = true
        throw error
    }
    url.hash = ''
    return url
}

// Where the site is hosted decides what the copy-paste fix looks like.
const detectPlatform = (headers, body) => {
    const server = String(headers.server || '').toLowerCase()
    const poweredBy = String(headers['x-powered-by'] || '').toLowerCase()
    const framework = poweredBy.includes('next.js') || body.includes('__NEXT_DATA__') || body.includes('/_next/static/') ? 'nextjs'
        : poweredBy.includes('express') ? 'express'
        : null
    const host = headers['x-vercel-id'] || server.includes('vercel') ? 'vercel'
        : headers['x-nf-request-id'] || server.includes('netlify') ? 'netlify'
        : server.includes('cloudflare') ? 'cloudflare'
        : server.includes('github.com') ? 'github-pages'
        : headers['rndr-id'] ? 'render'
        : headers['fly-request-id'] ? 'fly'
        : server.includes('railway') || headers['x-railway-request-id'] ? 'railway'
        : null
    return { host, framework }
}

const PLATFORM_NAMES = {
    vercel: 'Vercel', netlify: 'Netlify', cloudflare: 'Cloudflare', 'github-pages': 'GitHub Pages',
    render: 'Render', fly: 'Fly.io', railway: 'Railway',
}

export const headerSnippet = (platform, headers) => {
    const entries = Object.entries(headers)
    if (platform.host === 'netlify' || platform.host === 'cloudflare') {
        return {
            label: platform.host === 'netlify' ? 'public/_headers (Netlify)' : 'public/_headers (Cloudflare Pages)',
            language: 'text',
            code: ['/*', ...entries.map(([key, value]) => `  ${key}: ${value}`)].join('\n'),
        }
    }
    if (platform.framework === 'nextjs') {
        return {
            label: 'next.config.js',
            language: 'js',
            code: [
                'module.exports = {',
                '  async headers() {',
                '    return [{',
                "      source: '/(.*)',",
                '      headers: [',
                ...entries.map(([key, value]) => `        { key: '${key}', value: "${value}" },`),
                '      ],',
                '    }]',
                '  },',
                '}',
            ].join('\n'),
        }
    }
    if (platform.host === 'vercel') {
        return {
            label: 'vercel.json',
            language: 'json',
            code: JSON.stringify({ headers: [{ source: '/(.*)', headers: entries.map(([key, value]) => ({ key, value })) }] }, null, 2),
        }
    }
    if (platform.framework === 'express') {
        return {
            label: 'Express (npm install helmet)',
            language: 'js',
            code: "import helmet from 'helmet'\n\napp.use(helmet())",
        }
    }
    return {
        label: 'Response headers',
        language: 'text',
        code: entries.map(([key, value]) => `${key}: ${value}`).join('\n'),
    }
}

const RECOMMENDED = {
    hsts: ['Strict-Transport-Security', 'max-age=63072000; includeSubDomains'],
    // Deliberately loose so it can't break a working app: it blocks framing and
    // plugin content without restricting scripts.
    csp: ['Content-Security-Policy', "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests"],
    frame: ['X-Frame-Options', 'SAMEORIGIN'],
    nosniff: ['X-Content-Type-Options', 'nosniff'],
    referrer: ['Referrer-Policy', 'strict-origin-when-cross-origin'],
    permissions: ['Permissions-Policy', 'camera=(), microphone=(), geolocation=()'],
}

const checkHeaders = (page, platform, findings, passed) => {
    const headers = page.headers
    const isHttps = page.url.startsWith('https://')
    const csp = headers['content-security-policy'] || (page.body.match(/<meta[^>]+http-equiv=["']content-security-policy["'][^>]*content=["']([^"']+)/i) || [])[1] || ''
    const missing = {}

    const add = (key, finding) => {
        const [name, value] = RECOMMENDED[key]
        missing[name] = value
        findings.push({
            source: 'website',
            category: 'Security headers',
            snippet: headerSnippet(platform, { [name]: value }),
            ...finding,
        })
    }

    if (isHttps && !headers['strict-transport-security']) {
        add('hsts', {
            id: 'header-hsts',
            severity: 'medium',
            title: 'Browsers aren\'t told to always use HTTPS',
            summary: 'Your site supports HTTPS, but it doesn\'t send the Strict-Transport-Security header. A visitor\'s first request can still go over plain HTTP.',
            risk: 'On public Wi-Fi, an attacker can intercept that first insecure request and keep the visitor on a fake, unencrypted version of your site.',
            fix: ['Add the Strict-Transport-Security header below to every response.', 'Only do this once HTTPS works everywhere on your domain, because browsers will remember it.'],
        })
    } else if (isHttps) {
        passed.push({ source: 'website', title: 'HTTPS is enforced with HSTS' })
    }

    if (!csp) {
        add('csp', {
            id: 'header-csp',
            severity: 'medium',
            title: 'No Content Security Policy',
            summary: 'Your site doesn\'t send a Content-Security-Policy, so browsers will run any script that ends up on the page.',
            risk: 'If an attacker ever gets a script onto your page (cross-site scripting), nothing stops it from stealing sessions or data.',
            fix: ['Start with the safe baseline below. It blocks your site from being framed and blocks plugin content without restricting your own scripts, so it won\'t break anything.', 'Later, add a script-src directive listing only the domains your scripts actually load from.'],
        })
    } else {
        passed.push({ source: 'website', title: 'Content Security Policy is set' })
    }

    if (!headers['x-frame-options'] && !/frame-ancestors/i.test(csp)) {
        add('frame', {
            id: 'header-frame',
            severity: 'medium',
            title: 'Other sites can embed yours in a hidden frame',
            summary: 'Nothing stops another website from loading yours inside an invisible iframe.',
            risk: 'This is called clickjacking: an attacker overlays your real buttons with bait, so visitors click "delete account" or "send" without knowing it.',
            fix: ['Add the X-Frame-Options header below, or a Content-Security-Policy with frame-ancestors \'self\'.'],
        })
    } else {
        passed.push({ source: 'website', title: 'Protected against clickjacking' })
    }

    if (!headers['x-content-type-options']) {
        add('nosniff', {
            id: 'header-nosniff',
            severity: 'low',
            title: 'Browsers may guess file types',
            summary: 'Without X-Content-Type-Options: nosniff, browsers may treat uploaded or served files as a different type than you intended.',
            risk: 'A file a user uploads as an image could be run as a script in some situations.',
            fix: ['Add the header below. It\'s one line and has no side effects.'],
        })
    }

    if (!headers['referrer-policy']) {
        add('referrer', {
            id: 'header-referrer',
            severity: 'info',
            title: 'No Referrer-Policy set',
            summary: 'Modern browsers already default to a safe policy, but setting it explicitly protects visitors on older browsers.',
            risk: 'Full page URLs, which can contain tokens or IDs, may be sent to the other sites you link to.',
            fix: ['Add the header below.'],
        })
    }

    if (!headers['permissions-policy']) {
        add('permissions', {
            id: 'header-permissions',
            severity: 'info',
            title: 'No Permissions-Policy set',
            summary: 'You can tell browsers your site never needs the camera, microphone or location, so injected code can\'t ask for them either.',
            risk: 'Low on its own. It limits the damage if something else goes wrong.',
            fix: ['Add the header below, leaving out any feature your app actually uses.'],
        })
    }

    if (headers['x-powered-by']) {
        findings.push({
            id: 'header-powered-by',
            source: 'website',
            category: 'Security headers',
            severity: 'low',
            title: `Your server announces it runs ${headers['x-powered-by']}`,
            summary: `Every response includes "X-Powered-By: ${headers['x-powered-by']}".`,
            risk: 'It tells attackers exactly which known vulnerabilities to try first.',
            fix: platform.framework === 'nextjs'
                ? ['Set poweredByHeader: false in next.config.js.']
                : platform.framework === 'express'
                    ? ["Call app.disable('x-powered-by') or use helmet."]
                    : ['Turn off the X-Powered-By header in your server or framework settings.'],
            evidence: `X-Powered-By: ${headers['x-powered-by']}`,
        })
    }

    return missing
}

const checkTransport = async (page, findings, passed, signal) => {
    if (!page.url.startsWith('https://')) {
        findings.push({
            id: 'no-https',
            source: 'website',
            category: 'HTTPS',
            severity: 'critical',
            title: 'Your site doesn\'t use HTTPS',
            summary: 'Pages are sent unencrypted, so anyone on the same network can read or change them.',
            risk: 'Passwords, session cookies and anything users type can be read in transit. Browsers also mark the site "Not secure".',
            fix: ['Turn on HTTPS. Vercel, Netlify, Cloudflare and most hosts do this for free in one click.', 'Then redirect every http:// request to https://.'],
            location: page.url,
        })
        return
    }
    passed.push({ source: 'website', title: 'Uses HTTPS' })

    // Does the plain-HTTP version of the site redirect to HTTPS?
    try {
        const insecure = new URL(page.url)
        insecure.protocol = 'http:'
        insecure.port = ''
        const response = await safeGet(insecure.toString(), { timeout: 6000, maxBytes: 256 * 1024, maxRedirects: 3, signal })
        if (response.url.startsWith('http://') && response.status < 400) {
            findings.push({
                id: 'http-not-redirected',
                source: 'website',
                category: 'HTTPS',
                severity: 'medium',
                title: 'The http:// version of your site doesn\'t redirect to HTTPS',
                summary: `Visiting http://${insecure.host} loads your site unencrypted instead of redirecting to the secure version.`,
                risk: 'Anyone who types your address without https, or follows an old link, gets an unencrypted connection.',
                fix: ['Enable "Force HTTPS" or "Always use HTTPS" in your host\'s settings.'],
                location: `http://${insecure.host}`,
            })
        } else {
            passed.push({ source: 'website', title: 'HTTP redirects to HTTPS' })
        }
    } catch {
        // Port 80 closed or unreachable: nothing is served insecurely.
        passed.push({ source: 'website', title: 'Nothing is served over plain HTTP' })
    }
}

const SESSION_COOKIE = /sess|sid|auth|token|jwt|login|remember|user/i

const checkCookies = (page, findings, passed) => {
    const raw = page.headers['set-cookie']
    if (!raw) return
    const cookies = Array.isArray(raw) ? raw : [raw]
    const isHttps = page.url.startsWith('https://')
    const problems = []
    let severity = 'low'

    for (const cookie of cookies) {
        const [pair, ...attributes] = cookie.split(';')
        const name = pair.split('=')[0].trim()
        const attrs = attributes.map(attr => attr.trim().toLowerCase())
        const issues = []
        const sessionLike = SESSION_COOKIE.test(name)
        const insecure = isHttps && !attrs.includes('secure')
        const scriptReadable = sessionLike && !attrs.includes('httponly')
        if (insecure) issues.push('not marked Secure')
        if (scriptReadable) issues.push('readable by JavaScript (no HttpOnly)')
        if (!attrs.some(attr => attr.startsWith('samesite'))) issues.push('no SameSite')
        if (issues.length) problems.push(`${name}: ${issues.join(', ')}`)
        // Missing flags only matter much when the cookie can log someone in.
        if (sessionLike && (insecure || scriptReadable)) severity = 'medium'
    }

    if (!problems.length) {
        passed.push({ source: 'website', title: 'Cookies are set securely' })
        return
    }

    findings.push({
        id: 'cookies',
        source: 'website',
        category: 'Cookies',
        severity,
        title: problems.length === 1 ? 'A cookie is missing security flags' : `${problems.length} cookies are missing security flags`,
        summary: 'Cookies without the right flags can leak over insecure connections or be read by injected scripts.',
        risk: severity === 'medium'
            ? 'A login or session cookie that JavaScript can read can be stolen by any script that runs on your page, letting the attacker log in as your user.'
            : 'Mostly hardening, but it\'s an easy fix.',
        fix: ['Set cookies with Secure; HttpOnly; SameSite=Lax (use HttpOnly for anything related to login).'],
        evidence: problems.slice(0, 6).join('\n'),
        snippet: { label: 'Set-Cookie', language: 'text', code: 'Set-Cookie: session=...; Path=/; Secure; HttpOnly; SameSite=Lax' },
    })
}

const PROBE_ORIGIN = 'https://raptor-cors-check.example'

const checkCors = async (page, findings, passed, signal) => {
    try {
        const response = await safeGet(page.url, { headers: { Origin: PROBE_ORIGIN }, timeout: 8000, maxBytes: 512 * 1024, maxRedirects: 0, signal })
        const allowOrigin = response.headers['access-control-allow-origin']
        const allowCredentials = String(response.headers['access-control-allow-credentials']).toLowerCase() === 'true'
        if (allowOrigin === PROBE_ORIGIN && allowCredentials) {
            findings.push({
                id: 'cors-reflect-credentials',
                source: 'website',
                category: 'CORS',
                severity: 'high',
                title: 'Any website can make logged-in requests to yours and read the answers',
                summary: 'Your server copies back whatever Origin it\'s sent and allows credentials, so it trusts every website on the internet.',
                risk: 'A malicious page your user visits can silently fetch their private data from your site using their cookies.',
                fix: ['Replace the "reflect the Origin" logic with a fixed list of the domains you actually own.', 'Only send Access-Control-Allow-Credentials for those exact origins.'],
                evidence: `Access-Control-Allow-Origin: ${allowOrigin}\nAccess-Control-Allow-Credentials: true`,
                location: page.url,
            })
            return
        }
        if (allowOrigin === PROBE_ORIGIN) {
            findings.push({
                id: 'cors-reflect',
                source: 'website',
                category: 'CORS',
                severity: 'low',
                title: 'Your server trusts requests from any website',
                summary: 'It echoes back any Origin header it receives. Credentials aren\'t allowed, so the risk is limited to public data.',
                risk: 'Low today, but it becomes serious the moment someone adds credentials or private endpoints.',
                fix: ['Allow only the specific domains that need access.'],
                evidence: `Access-Control-Allow-Origin: ${allowOrigin}`,
                location: page.url,
            })
            return
        }
        passed.push({ source: 'website', title: 'Cross-origin access is restricted' })
    } catch {
        // Not worth failing the scan over.
    }
}

const ENV_LINE = /^\s*(?:export\s+)?([A-Z][A-Z0-9_]{1,60})\s*=/gm

const EXPOSED_FILES = [
    { path: '/.env', kind: 'env' },
    { path: '/.env.local', kind: 'env' },
    { path: '/.env.production', kind: 'env' },
    { path: '/.git/HEAD', kind: 'git' },
]

const checkExposedFiles = async (page, findings, passed, coverage, signal) => {
    const origin = new URL(page.url).origin
    let checked = 0
    const results = await Promise.all(EXPOSED_FILES.map(async (probe) => {
        try {
            const response = await safeGet(origin + probe.path, { timeout: 6000, maxBytes: 64 * 1024, maxRedirects: 0, signal })
            checked++
            if (response.status !== 200) return null
            const body = response.body.trim()
            if (!body || body.startsWith('<')) return null
            if (probe.kind === 'env') {
                const names = [...body.matchAll(ENV_LINE)].map(match => match[1])
                return names.length ? { ...probe, names } : null
            }
            return /^(ref: refs\/|[0-9a-f]{40}\s*$)/.test(body) ? probe : null
        } catch {
            return null
        }
    }))

    if (checked === 0) {
        coverage.push({ check: 'Exposed files', status: 'failed', note: 'We couldn\'t check for exposed files.' })
        return
    }

    const envFiles = results.filter(result => result?.kind === 'env')
    const git = results.find(result => result?.kind === 'git')

    for (const env of envFiles) {
        findings.push({
            id: `exposed-env-${env.path}`,
            source: 'website',
            category: 'Exposed files',
            severity: 'critical',
            title: `Your ${env.path.slice(1)} file is public`,
            summary: `Anyone can download ${origin}${env.path}. It contains ${env.names.length} setting${env.names.length === 1 ? '' : 's'}, including ${env.names.slice(0, 4).join(', ')}.`,
            risk: 'Environment files hold your API keys and database passwords. Bots scan the whole internet for exactly this file every day.',
            fix: [
                'Delete the file from your public/static folder (or wherever your host serves files from) and redeploy.',
                'Assume every key in it has been stolen: rotate all of them now.',
                'Add .env* to .gitignore and set secrets in your host\'s environment variable settings instead.',
            ],
            evidence: `Variable names: ${env.names.slice(0, 10).join(', ')}${env.names.length > 10 ? ', …' : ''}`,
            location: origin + env.path,
        })
    }
    if (git) {
        findings.push({
            id: 'exposed-git',
            source: 'website',
            category: 'Exposed files',
            severity: 'high',
            title: 'Your .git folder is public',
            summary: `${origin}/.git/ can be downloaded, which means your entire source code and its full history can be rebuilt.`,
            risk: 'Any secret ever committed, even one you deleted later, can be recovered from the history.',
            fix: ['Block access to /.git in your server config, or stop deploying the .git folder.', 'Rotate any secret that has ever been in your repository.'],
            location: `${origin}/.git/HEAD`,
        })
    }
    if (!envFiles.length && !git) passed.push({ source: 'website', title: 'No exposed .env or .git files' })
}

const sameSite = (scriptUrl, pageUrl) => {
    const a = new URL(scriptUrl).hostname
    const b = new URL(pageUrl).hostname
    const root = (host) => host.split('.').slice(-2).join('.')
    return a === b || root(a) === root(b)
}

const checkBundles = async (page, findings, passed, coverage, signal) => {
    const sources = new Set()
    for (const match of page.body.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)) sources.add(match[1])
    for (const match of page.body.matchAll(/<link\b[^>]*rel=["']modulepreload["'][^>]*href=["']([^"']+)["']/gi)) sources.add(match[1])

    const scripts = [...sources]
        .map(src => { try { return new URL(src, page.url).toString() } catch { return null } })
        .filter(src => src && /^https?:/.test(src) && sameSite(src, page.url))
        .slice(0, 12)

    const inline = [...page.body.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]).join('\n')
    const bodies = [{ url: page.url, text: inline }]
    let fetched = 0

    await Promise.all(scripts.map(async (url) => {
        try {
            const response = await safeGet(url, { timeout: 10000, maxBytes: 8 * 1024 * 1024, headers: { Accept: '*/*' }, signal })
            if (response.status === 200) {
                bodies.push({ url, text: response.body })
                fetched++
            }
        } catch {
            // One unreachable chunk shouldn't sink the scan.
        }
    }))

    if (scripts.length && fetched < scripts.length) {
        coverage.push({ check: 'JavaScript scan', status: 'partial', note: `Checked ${fetched} of ${scripts.length} script files.` })
    }

    const bySecret = new Map()
    for (const { url, text } of bodies) {
        for (const hit of findSecretsInText(text)) {
            if (!bySecret.has(hit.secret)) bySecret.set(hit.secret, { ...hit, url })
        }
    }

    for (const hit of bySecret.values()) {
        const service = SERVICES[hit.service]
        if (hit.service === 'supabase_anon') {
            findings.push({
                id: 'bundle-supabase-anon',
                source: 'website',
                category: 'Secrets',
                severity: 'info',
                title: 'Supabase anon key found (this one is meant to be public)',
                summary: 'Your site ships the Supabase anon key to the browser. That\'s normal, but it means your database is only as safe as your Row Level Security policies.',
                risk: 'Any table without Row Level Security can be read, and often written, by anyone with this key, which means anyone who opens your site.',
                fix: ['In Supabase → Table Editor, confirm "RLS enabled" on every table.', 'Add policies so users can only read and write their own rows.'],
                evidence: maskSecret(hit.secret),
                location: hit.url,
                learnMore: 'https://supabase.com/docs/guides/database/postgres/row-level-security',
            })
            continue
        }
        if (hit.service === 'google_api') {
            findings.push({
                id: `bundle-google-${maskSecret(hit.secret)}`,
                source: 'website',
                category: 'Secrets',
                severity: 'low',
                title: 'Google API key in your site\'s code',
                summary: 'Firebase and Maps keys are meant to be in the browser, but only if they\'re restricted. If this is a Gemini key, it\'s a real leak.',
                risk: 'An unrestricted key can be used by anyone, for any Google API it\'s allowed to call, billed to you.',
                fix: ['In Google Cloud → Credentials, restrict this key to your domain and to only the APIs you use.', 'If it\'s a Gemini/AI Studio key, revoke it and call Gemini from a server function instead.'],
                evidence: maskSecret(hit.secret),
                location: hit.url,
                learnMore: service.rotateUrl,
            })
            continue
        }
        findings.push({
            id: `bundle-${hit.service}-${maskSecret(hit.secret)}`,
            source: 'website',
            category: 'Secrets',
            severity: service.severity === 'medium' ? 'high' : service.severity,
            title: `${service.name} is visible in your website's code`,
            summary: `Anyone who opens your site can find this key in its JavaScript (View Source works). With it they can ${service.impact}.`,
            risk: 'Bots scrape public JavaScript for keys like this. Assume it has already been copied.',
            fix: [
                service.rotateUrl ? `Revoke this key now and create a new one: ${service.rotateUrl}` : 'Revoke this key now and create a new one.',
                'Move the code that uses it into a server function (a Next.js API route, a Vercel/Netlify function or a Supabase Edge Function) and keep the key there as an environment variable.',
                'Never prefix secret keys with VITE_, NEXT_PUBLIC_ or REACT_APP_. Those prefixes copy the value into the browser bundle.',
            ],
            evidence: maskSecret(hit.secret),
            location: hit.url,
            learnMore: service.rotateUrl,
        })
    }

    const real = [...bySecret.values()].filter(hit => !['supabase_anon', 'google_api'].includes(hit.service))
    if (!real.length) passed.push({ source: 'website', title: `No secret keys in your JavaScript (${fetched + 1} file${fetched ? 's' : ''} checked)` })
}

export const scanWebsite = async (input, { step = () => {}, signal } = {}) => {
    const target = normalizeWebsiteUrl(input)
    const findings = []
    const passed = []
    const coverage = []

    step('site', 'active')
    let page
    try {
        page = await safeGet(target.toString(), { signal })
    } catch (error) {
        step('site', 'failed')
        throw describeNetworkError(error)
    }
    if (page.status >= 400) {
        coverage.push({ check: 'Page fetch', status: 'partial', note: `Your homepage answered with HTTP ${page.status}, so some checks may be incomplete.` })
    }
    step('site', 'done')

    const platform = detectPlatform(page.headers, page.body)

    step('headers', 'active')
    await checkTransport(page, findings, passed, signal)
    const missingHeaders = checkHeaders(page, platform, findings, passed)
    checkCookies(page, findings, passed)
    await checkCors(page, findings, passed, signal)
    step('headers', 'done')

    step('exposed', 'active')
    await checkExposedFiles(page, findings, passed, coverage, signal)
    step('exposed', 'done')

    step('bundle', 'active')
    await checkBundles(page, findings, passed, coverage, signal)
    step('bundle', 'done')

    const missingNames = Object.keys(missingHeaders)
    return {
        url: page.url,
        platform: PLATFORM_NAMES[platform.host] || null,
        findings,
        passed,
        coverage,
        headerFix: missingNames.length > 1 ? headerSnippet(platform, missingHeaders) : null,
    }
}
