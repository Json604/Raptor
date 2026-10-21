import { test } from "node:test"
import assert from "node:assert/strict"
import { findSecretsInText, maskSecret, classifyJwt, serviceFromDetector, looksLikePlaceholder } from "../src/helpers/scanners/secretPatterns.js"

// Fixtures are assembled at runtime so secret scanners (including Raptor itself)
// don't flag this file. None of these are real keys.
const STRIPE_LIVE = ['sk', 'live', '4eC39HqLyjWDarjtT1zdp7dc'].join('_')

const jwt = (payload) => [
    Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
    Buffer.from(JSON.stringify(payload)).toString('base64url'),
    'c2lnbmF0dXJlc2lnbmF0dXJlc2lnbmF0dXJl',
].join('.')

test('finds keys that vibe-coded frontends commonly leak', () => {
    const bundle = `
        const openai = new OpenAI({ apiKey: "sk-proj-${'a1B2c3D4e5'.repeat(5)}T3BlbkFJ${'z9Y8x7W6v5'.repeat(3)}" });
        const stripe = Stripe("${STRIPE_LIVE}");
        fetch(url, { headers: { Authorization: "Bearer ghp_${'a'.repeat(36)}" } });
    `
    const services = findSecretsInText(bundle).map(hit => hit.service).sort()
    assert.deepEqual(services, ['github', 'openai', 'stripe'])
})

test('Supabase keys are classified by role, not flagged blindly', () => {
    const service = jwt({ iss: 'supabase', ref: 'abcd', role: 'service_role' })
    const anon = jwt({ iss: 'supabase', ref: 'abcd', role: 'anon' })
    assert.equal(classifyJwt(service), 'supabase_service')
    assert.equal(classifyJwt(anon), 'supabase_anon')
    const hits = findSecretsInText(`createClient(url, "${service}"); createClient(url, "${anon}")`)
    assert.deepEqual(hits.map(hit => hit.service).sort(), ['supabase_anon', 'supabase_service'])
})

test('random JWTs and placeholders are not reported', () => {
    assert.equal(findSecretsInText(`token = "${jwt({ sub: '123', name: 'demo' })}"`).length, 0)
    assert.equal(findSecretsInText('apiKey: "sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"').length, 0)
    assert.equal(looksLikePlaceholder('postgres://user:password@localhost:5432/db'), true)
    assert.equal(looksLikePlaceholder('postgres://app:Xk29fjQ@db.prod.acme.io/app'), false)
})

test('masking never reveals enough of a secret to use it', () => {
    const secret = STRIPE_LIVE
    const masked = maskSecret(secret)
    const visible = masked.replace(/•/g, '')
    assert.ok(visible.length <= 9, masked)
    assert.ok(!masked.includes(secret.slice(6, 20)))
    assert.equal(maskSecret('short'), '••••••••')
})

test('detector names from Gitleaks and TruffleHog map to friendly services', () => {
    assert.equal(serviceFromDetector('stripe-access-token', ['sk', 'live', 'abc'].join('_')), 'stripe')
    assert.equal(serviceFromDetector('stripe-access-token', ['sk', 'test', 'abc'].join('_')), 'stripe_test')
    assert.equal(serviceFromDetector('OpenAI'), 'openai')
    assert.equal(serviceFromDetector('aws-access-token'), 'aws')
    assert.equal(serviceFromDetector('private-key'), 'private_key')
    assert.equal(serviceFromDetector('generic-api-key'), 'generic')
})
