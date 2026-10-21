import { test } from "node:test"
import assert from "node:assert/strict"
import { submitJob, getJob, queueStats } from "../src/services/jobs.js"

const tick = () => new Promise(resolve => setTimeout(resolve, 5))

test('scans never exceed their lane limits and queue in order', async () => {
    const releases = []
    const submit = (lane) => submitJob({
        target: {}, steps: [], lane,
        task: () => new Promise(resolve => releases.push(resolve)),
    })

    const web = Array.from({ length: 5 }, () => submit('web'))
    const repo = Array.from({ length: 2 }, () => submit('repo'))
    await tick()

    assert.deepEqual(queueStats().web, { running: 3, waiting: 2 })
    assert.deepEqual(queueStats().repo, { running: 1, waiting: 1 })
    assert.equal(getJob(web[3].id).position, 1)
    assert.equal(getJob(repo[1].id).status, 'queued')

    while (releases.length) {
        releases.shift()()
        await tick()
    }
    assert.deepEqual(queueStats().web, { running: 0, waiting: 0 })
    assert.deepEqual(queueStats().repo, { running: 0, waiting: 0 })
    assert.equal(getJob(repo[1].id).status, 'done')
})
