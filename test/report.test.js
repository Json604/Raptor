import { test } from "node:test"
import assert from "node:assert/strict"
import { scoreFindings, gradeFor, countSeverities, buildReport } from "../src/helpers/report/report.js"

const finding = (severity, category = 'Secrets') => ({ severity, category })

test('a clean scan scores 100', () => {
    assert.equal(scoreFindings([]), 100)
    assert.equal(gradeFor(100), 'A')
})

test('a typical site missing a few headers lands around a B', () => {
    const findings = [finding('medium', 'Security headers'), finding('medium', 'Security headers'), finding('low', 'Security headers'), finding('info', 'Security headers')]
    const score = scoreFindings(findings)
    assert.equal(score, 86)
    assert.equal(gradeFor(score), 'B')
})

test('one leaked live key outweighs any amount of header noise', () => {
    const headers = Array.from({ length: 10 }, () => finding('medium', 'Security headers'))
    assert.ok(scoreFindings([finding('critical')]) < 75)
    assert.ok(scoreFindings(headers) > scoreFindings([finding('critical'), finding('high')]))
})

test('dependency penalties are capped so outdated packages cannot zero the score', () => {
    const deps = Array.from({ length: 40 }, () => finding('high', 'Dependencies'))
    assert.equal(scoreFindings(deps), 70)
})

test('info findings are shown but never cost points or count as problems', () => {
    const counts = countSeverities([finding('info'), finding('low')])
    assert.equal(counts.total, 1)
    assert.equal(scoreFindings([finding('info')]), 100)
})

test('reports sort by severity with verified keys first', () => {
    const report = buildReport({
        website: { findings: [finding('low', 'Cookies'), { ...finding('critical'), title: 'unverified' }], passed: [], coverage: [] },
        code: { findings: [{ ...finding('critical'), title: 'verified', verified: true }], passed: [], coverage: [] },
        startedAt: Date.now(),
    })
    assert.deepEqual(report.findings.map(f => f.title || f.severity), ['verified', 'unverified', 'low'])
    assert.equal(report.sections.website.counts.critical, 1)
    assert.equal(report.sections.code.counts.critical, 1)
})
