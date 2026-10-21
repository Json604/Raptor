export const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info']

const WEIGHTS = { critical: 30, high: 15, medium: 6, low: 2, info: 0 }

// Without caps, a repo with 20 outdated packages or a site missing every header
// scores the same as one leaking its Stripe key. Caps keep the score honest.
const CATEGORY_CAPS = { Dependencies: 30, 'Security headers': 24, Cookies: 6, CORS: 15 }

const ORDER = Object.fromEntries(SEVERITIES.map((severity, index) => [severity, index]))

export const scoreFindings = (findings) => {
    const penalties = {}
    for (const finding of findings) {
        penalties[finding.category] = (penalties[finding.category] || 0) + WEIGHTS[finding.severity]
    }
    const total = Object.entries(penalties)
        .reduce((sum, [category, penalty]) => sum + Math.min(CATEGORY_CAPS[category] ?? Infinity, penalty), 0)
    return Math.max(0, Math.round(100 - total))
}

export const gradeFor = (score) => score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F'

export const countSeverities = (findings) => {
    const counts = Object.fromEntries(SEVERITIES.map(severity => [severity, 0]))
    for (const finding of findings) counts[finding.severity]++
    counts.total = findings.filter(finding => finding.severity !== 'info').length
    return counts
}

export const verdictFor = (score, counts) => {
    if (counts.critical > 0) return `Fix the critical ${counts.critical === 1 ? 'issue' : 'issues'} first. ${counts.critical === 1 ? 'It' : 'They'} can be exploited today.`
    if (counts.total === 0) return 'Nothing to fix. Raptor didn\'t find any problems.'
    if (score >= 90) return 'Solid. Only a couple of small improvements left.'
    if (score >= 80) return 'Good shape. A few things are worth tightening.'
    if (score >= 70) return 'Some real gaps, but most are quick fixes.'
    return 'Several serious issues. Start at the top of the list.'
}

const sortFindings = (findings) => [...findings].sort((a, b) =>
    ORDER[a.severity] - ORDER[b.severity] || Number(Boolean(b.verified)) - Number(Boolean(a.verified)))

const section = (findings) => {
    const score = scoreFindings(findings)
    return { score, grade: gradeFor(score), counts: countSeverities(findings) }
}

export const buildReport = ({ website, code, errors = [], startedAt }) => {
    const findings = sortFindings([...(website?.findings || []), ...(code?.findings || [])])
    const score = scoreFindings(findings)
    const counts = countSeverities(findings)
    return {
        score,
        grade: gradeFor(score),
        verdict: verdictFor(score, counts),
        counts,
        sections: {
            website: website ? { url: website.url, platform: website.platform, headerFix: website.headerFix, ...section(website.findings) } : null,
            code: code ? { repo: code.repo, url: code.url, branch: code.branch, fileCount: code.fileCount, ...section(code.findings) } : null,
        },
        findings,
        passed: [...(website?.passed || []), ...(code?.passed || [])],
        coverage: [...(website?.coverage || []), ...(code?.coverage || []), ...errors],
        scannedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
    }
}
