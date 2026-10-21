import { test } from "node:test"
import assert from "node:assert/strict"

// Tiny limits so the safety nets can be exercised quickly. Each test file runs in
// its own process, so these don't leak into other tests.
process.env.WEB_SCAN_TIME_LIMIT_MS = '50'
const { submitJob, getJob, queueStats } = await import("../src/services/jobs.js")

const until = async (check) => {
    for (let i = 0; i < 200; i++) {
        if (check()) return
        await new Promise(resolve => setTimeout(resolve, 10))
    }
    throw new Error('timed out waiting')
}

test('a scan that runs too long is stopped, told why, and frees its slot', async () => {
    let sawAbort = false
    const job = submitJob({
        target: {}, steps: [], lane: 'web',
        task: ({ signal }) => new Promise((_, reject) => {
            signal.addEventListener('abort', () => { sawAbort = true; reject(new Error('killed')) })
        }),
    })
    await until(() => getJob(job.id).status === 'failed')
    assert.equal(sawAbort, true)
    assert.match(getJob(job.id).error, /limit/)
    assert.equal(queueStats().web.running, 0)
})
