import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "fs"
import os from "os"
import path from "path"
import { checkConfig } from "../src/helpers/scanners/repository.js"

// Assembled at runtime so secret scanners don't flag this file. Not a real key.
const FAKE_KEY = ['sk', '9f8e7d6c5b4a'].join('-')

const fixture = (files) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'raptor-test-'))
    for (const [name, content] of Object.entries(files)) {
        fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true })
        fs.writeFileSync(path.join(dir, name), content)
    }
    return dir
}

test('env files with only public config are not flagged', async () => {
    const dir = fixture({
        '.env.production': 'MODE=production\nVITE_APP_BACKEND_URL=https://api.example.org\nVITE_SUPABASE_ANON_KEY=eyJabc.def.ghi\n',
        '.env.example': 'OPENAI_API_KEY=sk-real-looking-but-example-file\n',
    })
    const { findings, passed } = await checkConfig(dir)
    assert.equal(findings.length, 0)
    assert.equal(passed[0].title, 'No secrets in committed .env files')
})

test('env files with server secrets are flagged', async () => {
    const dir = fixture({ '.env': `OPENAI_API_KEY=${FAKE_KEY}\nDATABASE_URL=postgres://app:Xk29fjQ@db.acme.io/app\nPORT=3000\n` })
    const { findings } = await checkConfig(dir)
    assert.equal(findings.length, 1)
    assert.equal(findings[0].severity, 'high')
    assert.match(findings[0].evidence, /OPENAI_API_KEY, DATABASE_URL/)
    assert.doesNotMatch(findings[0].evidence, /PORT/)
})

test('secrets with a bundler prefix are called out as shipped to the browser', async () => {
    const dir = fixture({ '.env.local': `VITE_OPENAI_API_KEY=${FAKE_KEY}\n` })
    const { findings } = await checkConfig(dir)
    assert.match(findings[0].summary, /frontend bundle/)
})

test('placeholder values are ignored', async () => {
    const dir = fixture({ '.env': 'STRIPE_SECRET_KEY=your_stripe_key_here\nJWT_SECRET=\n' })
    assert.equal((await checkConfig(dir)).findings.length, 0)
})

test('open Firebase rules are flagged, locked-down rules are not', async () => {
    const open = fixture({ 'firestore.rules': "service cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if true;\n    }\n  }\n}" })
    const testMode = fixture({ 'firestore.rules': 'allow read, write: if request.time < timestamp.date(2026, 1, 1);' })
    const locked = fixture({ 'firestore.rules': 'allow read, write: if request.auth != null && request.auth.uid == userId;' })
    assert.equal((await checkConfig(open)).findings[0].severity, 'high')
    assert.equal((await checkConfig(testMode)).findings.length, 1)
    assert.equal((await checkConfig(locked)).findings.length, 0)
})
