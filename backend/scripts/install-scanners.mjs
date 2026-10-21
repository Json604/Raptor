// Downloads the exact Gitleaks and TruffleHog builds production uses into
// backend/bin, so local development works without Homebrew or Docker.
// Same versions and checksums as the Dockerfile; keep them in sync.
//
//   node scripts/install-scanners.mjs              # (re)install
//   node scripts/install-scanners.mjs --if-missing # used by `npm run dev`
import { createHash } from "crypto"
import { execFileSync } from "child_process"
import fs from "fs"
import os from "os"
import path from "path"
import { fileURLToPath } from "url"

const BIN_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'bin')

const TOOLS = {
    gitleaks: {
        version: '8.30.1',
        url: (v, platform) => `https://github.com/gitleaks/gitleaks/releases/download/v${v}/gitleaks_${v}_${platform}.tar.gz`,
        platforms: { 'darwin-arm64': 'darwin_arm64', 'darwin-x64': 'darwin_x64', 'linux-arm64': 'linux_arm64', 'linux-x64': 'linux_x64' },
        sha256: {
            darwin_arm64: 'b40ab0ae55c505963e365f271a8d3846efbc170aa17f2607f13df610a9aeb6a5',
            darwin_x64: 'dfe101a4db2255fc85120ac7f3d25e4342c3c20cf749f2c20a18081af1952709',
            linux_arm64: 'e4a487ee7ccd7d3a7f7ec08657610aa3606637dab924210b3aee62570fb4b080',
            linux_x64: '551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb',
        },
    },
    trufflehog: {
        version: '3.97.9',
        url: (v, platform) => `https://github.com/trufflesecurity/trufflehog/releases/download/v${v}/trufflehog_${v}_${platform}.tar.gz`,
        platforms: { 'darwin-arm64': 'darwin_arm64', 'darwin-x64': 'darwin_amd64', 'linux-arm64': 'linux_arm64', 'linux-x64': 'linux_amd64' },
        sha256: {
            darwin_arm64: '3d25c178fe1a2563687b22547adcaebcf08cc8a607315c6741fe396c597951f7',
            darwin_amd64: '4451ba8d17106da0d0a2f1952d3b1c2d20a6e5c97c21ccd1f8fc04ecf2ff77d9',
            linux_arm64: '372c568695d49e53517075b5f74d1ee9a19053f13661d689c7928ee1fc27d705',
            linux_amd64: '40377e6572495412fb9ba0bc21c9401f73b72f1d2afd11b9931bc4a5ed622866',
        },
    },
}

const ifMissing = process.argv.includes('--if-missing')
const key = `${process.platform}-${process.arch}`

const install = async (name, tool) => {
    const target = path.join(BIN_DIR, name)
    if (ifMissing && fs.existsSync(target)) return

    const platform = tool.platforms[key]
    if (!platform) {
        console.warn(`! No ${name} build for ${key}. Install it yourself and set ${name.toUpperCase()}_BIN.`)
        return
    }

    const url = tool.url(tool.version, platform)
    process.stdout.write(`↓ ${name} ${tool.version} (${platform}) … `)
    const response = await fetch(url)
    if (!response.ok) throw new Error(`download failed (${response.status}): ${url}`)
    const archive = Buffer.from(await response.arrayBuffer())

    const digest = createHash('sha256').update(archive).digest('hex')
    if (digest !== tool.sha256[platform]) {
        throw new Error(`checksum mismatch for ${name}: expected ${tool.sha256[platform]}, got ${digest}. Refusing to install.`)
    }

    const temp = fs.mkdtempSync(path.join(os.tmpdir(), `raptor-setup-${name}-`))
    try {
        const archivePath = path.join(temp, 'archive.tar.gz')
        fs.writeFileSync(archivePath, archive)
        execFileSync('tar', ['-xzf', archivePath, '-C', temp, name])
        fs.mkdirSync(BIN_DIR, { recursive: true })
        fs.copyFileSync(path.join(temp, name), target)
        fs.chmodSync(target, 0o755)
    } finally {
        fs.rmSync(temp, { recursive: true, force: true })
    }
    console.log('verified ✓')
}

try {
    for (const [name, tool] of Object.entries(TOOLS)) await install(name, tool)
} catch (error) {
    console.error(`\n✗ ${error.message}`)
    process.exit(1)
}
