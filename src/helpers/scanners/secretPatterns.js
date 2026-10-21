// Shared knowledge about secrets: high-precision patterns for scanning website
// JavaScript, plus names, severities and rotation links used to explain what
// Gitleaks and TruffleHog find in repositories.

export const SERVICES = {
    stripe: { name: 'Stripe secret key', severity: 'critical', rotateUrl: 'https://dashboard.stripe.com/apikeys', impact: 'charge cards, issue refunds and read customer data on your Stripe account' },
    stripe_test: { name: 'Stripe test-mode key', severity: 'medium', rotateUrl: 'https://dashboard.stripe.com/test/apikeys', impact: 'read and change your Stripe test data' },
    openai: { name: 'OpenAI API key', severity: 'critical', rotateUrl: 'https://platform.openai.com/api-keys', impact: 'run up your OpenAI bill and use your account' },
    anthropic: { name: 'Anthropic API key', severity: 'critical', rotateUrl: 'https://console.anthropic.com/settings/keys', impact: 'run up your Anthropic bill and use your account' },
    aws: { name: 'AWS access key', severity: 'critical', rotateUrl: 'https://console.aws.amazon.com/iam/home#/security_credentials', impact: 'use your AWS account, which can mean large bills or data theft' },
    github: { name: 'GitHub token', severity: 'critical', rotateUrl: 'https://github.com/settings/tokens', impact: 'read or change your repositories' },
    gcp_service_account: { name: 'Google Cloud service account key', severity: 'critical', rotateUrl: 'https://console.cloud.google.com/iam-admin/serviceaccounts', impact: 'use your Google Cloud project' },
    google_api: { name: 'Google API key', severity: 'low', rotateUrl: 'https://console.cloud.google.com/apis/credentials', impact: 'use any Google API the key is allowed to call, billed to you' },
    supabase_service: { name: 'Supabase service_role key', severity: 'critical', rotateUrl: 'https://supabase.com/dashboard/project/_/settings/api', impact: 'read, change and delete everything in your database, ignoring Row Level Security' },
    supabase_anon: { name: 'Supabase anon key', severity: 'info', rotateUrl: 'https://supabase.com/dashboard/project/_/settings/api', impact: 'query your database as an anonymous user' },
    mongodb: { name: 'MongoDB connection string', severity: 'critical', rotateUrl: 'https://cloud.mongodb.com', impact: 'log straight into your database' },
    postgres: { name: 'Postgres connection string', severity: 'critical', impact: 'log straight into your database' },
    mysql: { name: 'MySQL connection string', severity: 'critical', impact: 'log straight into your database' },
    redis: { name: 'Redis connection string', severity: 'high', impact: 'read and change data in your Redis instance' },
    private_key: { name: 'Private key', severity: 'critical', impact: 'impersonate your server or sign things as you' },
    slack_token: { name: 'Slack token', severity: 'high', rotateUrl: 'https://api.slack.com/apps', impact: 'read messages or post as your Slack app' },
    slack_webhook: { name: 'Slack webhook URL', severity: 'medium', rotateUrl: 'https://api.slack.com/apps', impact: 'post messages into your Slack channel' },
    discord_token: { name: 'Discord bot token', severity: 'high', rotateUrl: 'https://discord.com/developers/applications', impact: 'take control of your Discord bot' },
    discord_webhook: { name: 'Discord webhook URL', severity: 'medium', impact: 'post messages into your Discord channel' },
    twilio: { name: 'Twilio credentials', severity: 'high', rotateUrl: 'https://console.twilio.com', impact: 'send SMS and make calls billed to you' },
    sendgrid: { name: 'SendGrid API key', severity: 'high', rotateUrl: 'https://app.sendgrid.com/settings/api_keys', impact: 'send email from your domain, which is ideal for phishing' },
    mailgun: { name: 'Mailgun API key', severity: 'high', rotateUrl: 'https://app.mailgun.com/settings/api_security', impact: 'send email from your domain' },
    resend: { name: 'Resend API key', severity: 'high', rotateUrl: 'https://resend.com/api-keys', impact: 'send email from your domain' },
    groq: { name: 'Groq API key', severity: 'high', rotateUrl: 'https://console.groq.com/keys', impact: 'use your Groq account and quota' },
    huggingface: { name: 'Hugging Face token', severity: 'high', rotateUrl: 'https://huggingface.co/settings/tokens', impact: 'use your Hugging Face account' },
    replicate: { name: 'Replicate API token', severity: 'high', rotateUrl: 'https://replicate.com/account/api-tokens', impact: 'run models billed to you' },
    xai: { name: 'xAI API key', severity: 'high', rotateUrl: 'https://console.x.ai', impact: 'run up your xAI bill' },
    uri: { name: 'Password inside a URL', severity: 'high', impact: 'log in to that service with your credentials' },
    jwt: { name: 'JSON Web Token', severity: 'medium', impact: 'act as whoever the token belongs to, until it expires' },
    generic: { name: 'Possible secret', severity: 'medium', impact: 'use whatever service this key belongs to' },
}

// Patterns tuned for precision: a false alarm on someone's live site erodes trust
// faster than a miss, and Gitleaks/TruffleHog cover the long tail in repos.
export const BUNDLE_PATTERNS = [
    { service: 'stripe', regex: /\b[sr]k_live_[0-9a-zA-Z]{20,247}\b/g },
    { service: 'stripe_test', regex: /\b[sr]k_test_[0-9a-zA-Z]{20,247}\b/g },
    { service: 'openai', regex: /\bsk-(?:proj-|svcacct-|admin-)?[A-Za-z0-9_-]{20,}T3BlbkFJ[A-Za-z0-9_-]{20,}\b/g },
    { service: 'openai', regex: /\bsk-proj-[A-Za-z0-9_-]{40,}\b/g },
    { service: 'anthropic', regex: /\bsk-ant-(?:api|admin)\d{2}-[A-Za-z0-9_-]{80,}\b/g },
    { service: 'aws', regex: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g },
    { service: 'github', regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}\b/g },
    { service: 'github', regex: /\bgithub_pat_[A-Za-z0-9_]{80,}\b/g },
    { service: 'google_api', regex: /\bAIza[0-9A-Za-z_-]{35}\b/g },
    { service: 'slack_token', regex: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g },
    { service: 'slack_webhook', regex: /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[A-Za-z0-9]{20,}/g },
    { service: 'discord_webhook', regex: /https:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]{60,}/g },
    { service: 'sendgrid', regex: /\bSG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}\b/g },
    { service: 'groq', regex: /\bgsk_[A-Za-z0-9]{52}\b/g },
    { service: 'huggingface', regex: /\bhf_[A-Za-z0-9]{34}\b/g },
    { service: 'replicate', regex: /\br8_[A-Za-z0-9]{37}\b/g },
    { service: 'xai', regex: /\bxai-[A-Za-z0-9]{80}\b/g },
    { service: 'private_key', regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY(?: BLOCK)?-----/g },
    { service: 'mongodb', regex: /\bmongodb(?:\+srv)?:\/\/[^\s:@/"'`]+:[^\s@/"'`]+@[^\s"'`]+/g },
    { service: 'postgres', regex: /\bpostgres(?:ql)?:\/\/[^\s:@/"'`]+:[^\s@/"'`]+@[^\s"'`]+/g },
    { service: 'jwt', regex: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g },
]

const PLACEHOLDER = /(x{6,}|\*{4,}|your[_-]?|example|placeholder|dummy|changeme|<[^>]+>|\$\{)/i

export const looksLikePlaceholder = (secret) => {
    if (PLACEHOLDER.test(secret)) return true
    // Connection strings like postgres://user:password@localhost are tutorials, not leaks.
    if (/:\/\/[^:]+:(password|pass|secret|admin|root|postgres)@(localhost|127\.0\.0\.1|db|postgres|mongo)/i.test(secret)) return true
    return false
}

export const decodeJwtPayload = (token) => {
    try {
        const payload = token.split('.')[1]
        return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    } catch {
        return null
    }
}

// JWTs are only interesting when we know what they unlock.
export const classifyJwt = (token) => {
    const payload = decodeJwtPayload(token)
    if (!payload) return null
    if (payload.role === 'service_role') return 'supabase_service'
    if (payload.role === 'anon' && (payload.iss === 'supabase' || payload.ref)) return 'supabase_anon'
    return 'jwt'
}

// Reveal just enough to recognise which key it is, never enough to use it.
export const maskSecret = (secret) => {
    const value = String(secret || '').trim()
    const pem = value.match(/^-----BEGIN [A-Z ]+-----/)
    if (pem) return `${pem[0]} ••••••••`
    const uri = value.match(/^([a-z][a-z0-9+.-]*:\/\/)([^:@/\s]+):[^@\s]+@([^/\s?#]+)/i)
    if (uri) return `${uri[1]}${uri[2]}:••••••••@${uri[3]}`
    if (value.length <= 8) return '••••••••'
    const start = Math.min(6, Math.floor(value.length / 4))
    const end = Math.min(3, Math.floor(value.length / 10))
    return `${value.slice(0, start)}••••••••${end ? value.slice(-end) : ''}`
}

// Maps a Gitleaks rule id or TruffleHog detector name onto SERVICES.
export const serviceFromDetector = (detector = '', secret = '') => {
    const name = detector.toLowerCase()
    if (/^[sr]k_test_/.test(secret)) return 'stripe_test'
    if (secret.startsWith('eyJ')) return classifyJwt(secret) || 'jwt'
    const rules = [
        [/stripe/, 'stripe'], [/openai/, 'openai'], [/anthropic|claude/, 'anthropic'],
        [/aws/, 'aws'], [/github/, 'github'], [/gcp.*service|google.*service|service.?account/, 'gcp_service_account'],
        [/gcp|google|firebase|gemini/, 'google_api'], [/supabase/, 'supabase_service'],
        [/mongo/, 'mongodb'], [/postgres/, 'postgres'], [/mysql/, 'mysql'], [/redis/, 'redis'],
        [/private.?key|privatekey|ssh|rsa|pgp/, 'private_key'], [/slack.*webhook/, 'slack_webhook'], [/slack/, 'slack_token'],
        [/discord.*webhook/, 'discord_webhook'], [/discord/, 'discord_token'], [/twilio/, 'twilio'],
        [/sendgrid/, 'sendgrid'], [/mailgun/, 'mailgun'], [/resend/, 'resend'], [/groq/, 'groq'],
        [/hugging/, 'huggingface'], [/replicate/, 'replicate'], [/xai|grok/, 'xai'], [/jwt/, 'jwt'],
        [/^uri$|url|connection.?string/, 'uri'],
    ]
    for (const [pattern, service] of rules) {
        if (pattern.test(name)) return service
    }
    return 'generic'
}

export const findSecretsInText = (text) => {
    const hits = []
    const seen = new Set()
    for (const { service, regex } of BUNDLE_PATTERNS) {
        regex.lastIndex = 0
        for (const match of text.matchAll(regex)) {
            const secret = match[0]
            if (seen.has(secret) || looksLikePlaceholder(secret)) continue
            seen.add(secret)
            const resolved = service === 'jwt' ? classifyJwt(secret) : service
            // Generic JWTs in a bundle are usually harmless public tokens; skip them.
            if (!resolved || resolved === 'jwt') continue
            hits.push({ service: resolved, secret, index: match.index })
        }
    }
    return hits
}
