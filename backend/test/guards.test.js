import { test } from "node:test"
import assert from "node:assert/strict"
import { isPrivateAddress, assertPublicUrl } from "../src/helpers/net/safeHttp.js"
import { parseGithubRepo } from "../src/helpers/repo/github.js"
import { normalizeWebsiteUrl } from "../src/helpers/scanners/website.js"

test('private and reserved addresses are blocked', () => {
    for (const address of ['127.0.0.1', '10.1.2.3', '172.17.0.1', '192.168.1.1', '169.254.169.254', '0.0.0.0', '100.64.0.1', '::1', 'fd00::1', 'fe80::1', '::ffff:127.0.0.1', '::ffff:169.254.169.254']) {
        assert.equal(isPrivateAddress(address), true, address)
    }
})

test('public addresses are allowed', () => {
    for (const address of ['8.8.8.8', '1.1.1.1', '159.89.169.228', '2606:4700:4700::1111']) {
        assert.equal(isPrivateAddress(address), false, address)
    }
})

test('URL guard rejects internal targets, odd ports and other protocols', () => {
    for (const url of ['http://127.0.0.1/', 'http://169.254.169.254/latest/meta-data', 'http://localhost:3000', 'http://[::1]/', 'https://example.com:22', 'ftp://example.com', 'http://db.internal/']) {
        assert.throws(() => assertPublicUrl(new URL(url)), url)
    }
    assert.doesNotThrow(() => assertPublicUrl(new URL('https://example.com/path')))
    assert.doesNotThrow(() => assertPublicUrl(new URL('http://example.com:8080/')))
})

test('GitHub repo references are parsed in all the ways people paste them', () => {
    const expected = { owner: 'vercel', repo: 'next.js' }
    for (const input of ['vercel/next.js', 'github.com/vercel/next.js', 'https://github.com/vercel/next.js', 'https://github.com/vercel/next.js.git', 'https://www.github.com/vercel/next.js/tree/canary/packages', ' https://github.com/vercel/next.js/ ']) {
        assert.deepEqual(parseGithubRepo(input), expected, input)
    }
})

test('malformed or hostile repo references are rejected', () => {
    for (const input of ['', 'vercel', 'https://gitlab.com/a/b', 'github.com/a/..', 'github.com/a/$(whoami)', 'github.com/a/b;rm -rf /', 'a/b c']) {
        assert.throws(() => parseGithubRepo(input), input)
    }
})

test('website URLs get https added and fragments dropped', () => {
    assert.equal(normalizeWebsiteUrl('myapp.vercel.app').toString(), 'https://myapp.vercel.app/')
    assert.equal(normalizeWebsiteUrl('http://example.com/a#b').toString(), 'http://example.com/a')
    assert.throws(() => normalizeWebsiteUrl('not a url'))
    assert.throws(() => normalizeWebsiteUrl('localhost'))
})
