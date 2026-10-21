import { randomUUID } from "crypto";
import { MAX_CONCURRENT_REPO_SCANS, MAX_CONCURRENT_WEB_SCANS, MAX_QUEUED_SCANS } from "../config/env.js";

// Scans run in the background and the browser polls for progress. That keeps
// requests short (no proxy timeouts on 40-second repo scans) and lets the UI show
// real step-by-step progress and queue position instead of a fake progress bar.
//
// Each kind of scan has its own lane with a concurrency limit. The server is a
// small droplet shared with other apps, so work queues up instead of piling on.

const JOB_TTL_MS = 2 * 60 * 60 * 1000
const MAX_JOBS = 1000

const jobs = new Map()
const lanes = {
    repo: { limit: MAX_CONCURRENT_REPO_SCANS, running: 0, waiting: [] },
    web: { limit: MAX_CONCURRENT_WEB_SCANS, running: 0, waiting: [] },
}

const pump = (lane) => {
    while (lane.running < lane.limit && lane.waiting.length) {
        const { start } = lane.waiting.shift()
        lane.running++
        start().finally(() => {
            lane.running--
            pump(lane)
        })
    }
}

export const queueStats = () => ({
    repo: { running: lanes.repo.running, waiting: lanes.repo.waiting.length },
    web: { running: lanes.web.running, waiting: lanes.web.waiting.length },
    jobs: jobs.size,
})

export const submitJob = ({ target, steps, lane: laneName, task }) => {
    const lane = lanes[laneName]
    const queued = lanes.repo.waiting.length + lanes.web.waiting.length
    if (queued >= MAX_QUEUED_SCANS || jobs.size >= MAX_JOBS) {
        const error = new Error('Raptor is busy right now. Please try again in a minute.')
        error.status = 503
        error.expose = true
        throw error
    }

    const job = {
        id: randomUUID(),
        lane: laneName,
        status: 'queued',
        target,
        steps: steps.map(([key, label]) => ({ key, label, state: 'pending' })),
        result: null,
        error: null,
        createdAt: Date.now(),
        startedAt: null,
        finishedAt: null,
    }
    jobs.set(job.id, job)

    const step = (key, state) => {
        const entry = job.steps.find(candidate => candidate.key === key)
        if (entry) entry.state = state
    }

    const start = async () => {
        job.status = 'running'
        job.startedAt = Date.now()
        try {
            job.result = await task({ step })
            job.status = 'done'
        } catch (error) {
            job.status = 'failed'
            job.error = error.expose ? error.message : 'Something went wrong on our side. Please try again.'
            if (!error.expose) console.error(`Scan ${job.id} failed:`, error)
        } finally {
            job.finishedAt = Date.now()
            for (const entry of job.steps) {
                if (entry.state === 'active') entry.state = job.status === 'failed' ? 'failed' : 'done'
                if (entry.state === 'pending' && job.status === 'failed') entry.state = 'skipped'
            }
        }
    }

    lane.waiting.push({ job, start })
    pump(lane)
    return job
}

export const getJob = (id) => {
    const job = jobs.get(id)
    if (!job) return null
    const position = lanes[job.lane].waiting.findIndex(entry => entry.job.id === id)
    return {
        id: job.id,
        status: job.status,
        position: position === -1 ? null : position + 1,
        target: job.target,
        steps: job.steps,
        result: job.result,
        error: job.error,
        elapsedMs: (job.finishedAt || Date.now()) - (job.startedAt || job.createdAt),
    }
}

setInterval(() => {
    const cutoff = Date.now() - JOB_TTL_MS
    for (const [id, job] of jobs) {
        if (job.finishedAt && job.finishedAt < cutoff) jobs.delete(id)
    }
}, 5 * 60 * 1000).unref()
