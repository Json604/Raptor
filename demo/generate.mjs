// Builds a deliberately insecure demo site for showing Raptor off, like badssl.com.
// Every "key" is random junk shaped like a real one. They're generated here instead
// of committed so GitHub's secret scanning doesn't flag the repo.
//
//   node demo/generate.mjs <output-dir>
import { randomBytes } from 'crypto'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

const out = process.argv[2]
if (!out) throw new Error('usage: node demo/generate.mjs <output-dir>')

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const random = (length) => [...randomBytes(length)].map(byte => alphabet[byte % alphabet.length]).join('')
const b64url = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')

const openai = ['sk', 'proj', random(40)].join('-') + ['T3Blbk', 'FJ'].join('') + random(40)
const stripe = ['sk', 'live', random(32)].join('_')
const supabase = [b64url({ alg: 'HS256', typ: 'JWT' }), b64url({ iss: 'supabase', ref: 'raptordemo', role: ['service', 'role'].join('_'), iat: 1735689600, exp: 2051222400 }), random(43)].join('.')

mkdirSync(join(out, 'assets'), { recursive: true })

writeFileSync(join(out, 'index.html'), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>ChatterBox (insecure demo)</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; max-width: 560px; margin: 64px auto; padding: 0 20px; color: #1d1d1f; line-height: 1.5; }
  .note { background: #fff4e5; border-radius: 12px; padding: 14px 16px; font-size: 15px; }
  input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #d2d2d7; font: inherit; box-sizing: border-box; }
</style>
</head>
<body>
<p class="note"><strong>This site is deliberately insecure.</strong> It's a demo target for <a href="https://raptor.support">Raptor</a>. Every key on it is fake.</p>
<h1>ChatterBox</h1>
<p>Ask our AI anything.</p>
<input placeholder="Type a message…">
<script type="module" src="/assets/app.js"></script>
</body>
</html>
`)

writeFileSync(join(out, 'assets', 'app.js'), `// The classic vibe-coding mistake: secret keys bundled into frontend code.
const OPENAI_API_KEY = "${openai}";
const SUPABASE_URL = "https://raptordemo.supabase.co";
const SUPABASE_KEY = "${supabase}";
export async function ask(prompt) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: "Bearer " + OPENAI_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }] }),
  });
  return res.json();
}
console.log("ChatterBox ready", SUPABASE_URL, SUPABASE_KEY.length);
`)

writeFileSync(join(out, '.env'), `OPENAI_API_KEY=${openai}
STRIPE_SECRET_KEY=${stripe}
SUPABASE_SERVICE_ROLE_KEY=${supabase}
DATABASE_URL=postgres://chatterbox:${random(20)}@db.chatterbox.internal:5432/app
`)

console.log(`Demo site written to ${out}`)
