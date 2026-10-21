import { randomUUID } from "crypto";
import {
    MAX_CONCURRENT_REPO_SCANS, MAX_CONCURRENT_WEB_SCANS, MAX_QUEUED_SCANS,
    REPO_SCAN_TIME_LIMIT_MS, WEB_SCAN_TIME_LIMIT_MS,
} from "../config/env.js";

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
    repo: { limit: MAX_CONCURRENT_REPO_SCANS, timeLimit: REPO_SCAN_TIME_LIMIT_MS, running: 0, waiting: [] },
    web: { limit: MAX_CONCURRENT_WEB_SCANS, timeLimit: WEB_SCAN_TIME_LIMIT_MS, running: 0, waiting: [] },
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms).unref())
const whenAborted = (signal) => new Promise((_, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true })
})

// Finished reports are kept so links work for a while, but they must never stop
// new scans: when the store is full, the oldest finished report makes way.
const makeRoom = () => {
    if (jobs.size < MAX_JOBS) return true
    for (const [id, job] of jobs) {
        if (job.finishedAt) {
            jobs.delete(id)
            return true
        }
    }
    return false
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
    if (queued >= MAX_QUEUED_SCANS || !makeRoom()) {
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
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), lane.timeLimit)
        const work = task({ step, signal: controller.signal })
        work.catch(() => {}) // settles after an abort too; never let that go unhandled
        try {
            job.result = await Promise.race([work, whenAborted(controller.signal)])
            job.status = 'done'
        } catch (error) {
            job.status = 'failed'
            if (controller.signal.aborted) {
                job.error = `This scan hit the ${Math.round(lane.timeLimit / 1000)}-second limit and was stopped so the next person in line could go. Try again, or try a smaller repo.`
                console.warn(`Scan ${job.id} timed out`)
            } else {
                job.error = error.expose ? error.message : 'Something went wrong on our side. Please try again.'
                if (!error.expose) console.error(`Scan ${job.id} failed:`, error)
            }
        } finally {
            clearTimeout(timer)
            // Give killed scanners a moment to exit before the slot is reused.
            if (controller.signal.aborted) await Promise.race([work.catch(() => {}), sleep(10000)])
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
