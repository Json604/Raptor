import isGithubUrl from "is-github-url"
import { axiosURLverifier , axiosGithubverifier} from "../helpers/repo/verifyRepo.js"
import { zipDownloader } from "../helpers/repo/zipRepo.js"
import { unzipRepo } from "../helpers/repo/unzipRepo.js"
import { runGitleaks, runTruffleHog } from "../helpers/scanners/runScans.js"
import { scanConfigExposure } from "../helpers/scanners/configScanner.js"
import { scanDependencies } from "../helpers/scanners/dependencyScanner.js"
import { scanWebUrl } from "../helpers/scanners/webScanner.js"
import { formatScanResults } from "../helpers/formatters/formatter.js"
import fs from "fs"

// Internal GitHub scan function
export const githubUrlScanService = async (url) => {
    console.log('\n🦅 Raptor GitHub Scan Started:', url);
    const startTime = Date.now();
    
    if(!isGithubUrl(url)){
        const error = new Error("Invalid GitHub URL. Please provide a GitHub repository URL (e.g., https://github.com/owner/repo)")
        error.status = 400
        throw error
    }
    console.log('✅ Valid GitHub URL');
    
    await axiosGithubverifier(url)
    console.log('✅ Repository verified and accessible');
    
    const {zipPath, tempDir} = await zipDownloader(url)

    const repoPath = await unzipRepo(zipPath, tempDir);
    console.log('✅ Repository extracted to:', repoPath);

    // Run all scans on current files (Raptor MVP)
    console.log('\n🔐 Running comprehensive security scans...');
    
    const [trufflehogResults, gitleaksResults, configResults, dependencyResults] = await Promise.all([
        runTruffleHog(repoPath),
        runGitleaks(repoPath),
        scanConfigExposure(repoPath),
        scanDependencies(repoPath)
    ]);

    // Cleanup temp
    console.log('\n🧹 Cleaning up temporary files...');
    fs.rmSync(tempDir, { recursive: true, force: true });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ GitHub scan completed in ${duration}s\n`);

    // Raw results
    const rawResults = {
        trufflehog: trufflehogResults,
        gitleaks: gitleaksResults,
        config: configResults,
        dependencies: dependencyResults
    };

    // Format for non-tech users
    const formatted = formatScanResults({ type: 'github', results: rawResults });

    return {
        ...formatted,
        scanDuration: duration,
        raw: rawResults // Include raw data for advanced users
    };
}


// Internal web scan function
export const webUrlScanService = async (url) => {
    console.log('\n🦅 Raptor Web Scan Started:', url);
    const startTime = Date.now();
    
    // 1. Validate URL format
    let parsedUrl;
    try {
        parsedUrl = new URL(url);
    } catch (error) {
        const err = new Error("Invalid URL format. Please provide a valid URL (e.g., https://example.com)");
        err.status = 400;
        throw err;
    }

    // 2. Ensure it's HTTP/HTTPS only (web applications)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        const err = new Error(`Invalid protocol: ${parsedUrl.protocol}. Only HTTP and HTTPS URLs are supported for web scanning.`);
        err.status = 400;
        throw err;
    }

    // 3. Reject localhost/internal IPs for security (optional - you might want to allow these for dev)
    // const hostname = parsedUrl.hostname.toLowerCase();
    // const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
    // if (blockedHosts.includes(hostname)) {
    //     const err = new Error("Scanning localhost/internal IPs is not allowed for security reasons. Deploy your app to scan it.");
    //     err.status = 400;
    //     throw err;
    // }

    // 4. Reject GitHub URLs - they should use /scan/github endpoint
    if (isGithubUrl(url)) {
        const err = new Error("GitHub URLs should use /api/v1/scan/github endpoint instead");
        err.status = 400;
        throw err;
    }


    // 6. Verify the URL is actually reachable
    console.log('✅ Validating URL accessibility...');
    await axiosURLverifier(url);
    console.log('✅ Website is accessible');

    console.log('\n🔐 Running web security scans...');
    
    const webResults = await scanWebUrl(url);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Web scan completed in ${duration}s\n`);

    // Format for non-tech users
    const formatted = formatScanResults({ type: 'web', results: webResults });

    return {
        ...formatted,
        scanDuration: duration,
        raw: webResults // Include raw data for advanced users
    };
}


// COMBINED FULL APPLICATION SCAN (GitHub + Web)
export const fullApplicationScanService = async (githubUrl, webUrl) => {
    console.log('\n🦅🦅 RAPTOR FULL APPLICATION SCAN STARTED 🦅🦅');
    console.log('📦 GitHub Repository:', githubUrl);
    console.log('🌐 Live Web Application:', webUrl);
    const startTime = Date.now();

    try {
        // Run both scans in parallel for maximum speed
        console.log('\n⚡ Running parallel scans (GitHub + Web)...\n');
        const [githubResults, webResults] = await Promise.all([
            githubUrlScanService(githubUrl),
            webUrlScanService(webUrl)
        ]);

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`\n✅ Full application scan completed in ${duration}s\n`);

        // Calculate combined security score
        const combinedScore = calculateCombinedScore(githubResults, webResults);
        const combinedGrade = getCombinedGrade(combinedScore);

        // Find correlated security issues (code + web)
        const correlatedIssues = findCorrelatedIssues(githubResults, webResults);

        // Aggregate all findings
        const allFindings = [
            ...githubResults.findings.map(f => ({ ...f, source: 'code' })),
            ...webResults.findings.map(f => ({ ...f, source: 'web' }))
        ].sort((a, b) => getSeverityValue(b.severity) - getSeverityValue(a.severity));

        // Combined summary
        const combinedSummary = {
            total: allFindings.length,
            critical: (githubResults.summary?.critical || 0) + (webResults.summary?.critical || 0),
            high: (githubResults.summary?.high || 0) + (webResults.summary?.high || 0),
            medium: (githubResults.summary?.medium || 0) + (webResults.summary?.medium || 0),
            low: (githubResults.summary?.low || 0) + (webResults.summary?.low || 0),
            codeIssues: githubResults.summary?.total || 0,
            webIssues: webResults.summary?.total || 0
        };

        // Generate comprehensive recommendations
        const recommendations = generateCombinedRecommendations(correlatedIssues, combinedSummary);

        return {
            scanType: 'full',
            overallScore: combinedScore,
            overallGrade: combinedGrade,
            summary: combinedSummary,
            message: getOverallSecurityMessage(combinedScore, combinedSummary),
            
            // Separate section results
            codeSecurity: {
                score: githubResults.score,
                grade: githubResults.grade,
                summary: githubResults.summary,
                findings: githubResults.findings,
                scanDuration: githubResults.scanDuration
            },
            
            webSecurity: {
                score: webResults.score,
                grade: webResults.grade,
                summary: webResults.summary,
                findings: webResults.findings,
                scanDuration: webResults.scanDuration
            },
            
            // Correlated findings (the magic!)
            correlatedIssues: correlatedIssues,
            
            // All findings combined and sorted by severity
            allFindings: allFindings,
            
            // Smart recommendations
            recommendations: recommendations,
            
            // Metadata
            scannedAt: new Date().toISOString(),
            totalScanDuration: duration,
            
            // Raw data for advanced users
            raw: {
                github: githubResults.raw,
                web: webResults.raw
            }
        };

    } catch (error) {
        console.error('❌ Full application scan error:', error.message);
        throw error;
    }
}

// Helper: Calculate combined security score
const calculateCombinedScore = (githubResults, webResults) => {
    // Weighted average: Code security is 60%, Web security is 40%
    // (Code vulnerabilities are typically more critical)
    const codeWeight = 0.6;
    const webWeight = 0.4;
    
    const combinedScore = Math.round(
        (githubResults.score * codeWeight) + (webResults.score * webWeight)
    );
    
    return combinedScore;
}

// Helper: Get combined grade
const getCombinedGrade = (score) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
}

// Helper: Find correlated issues between code and web
const findCorrelatedIssues = (githubResults, webResults) => {
    const correlations = [];
    
    // Check for secret exposure chains (secret in code + no CSP on web)
    const hasSecrets = githubResults.findings.some(f => f.category === 'Secrets');
    const missingCSP = webResults.findings.some(f => f.title === 'Content-Security-Policy');
    
    if (hasSecrets && missingCSP) {
        correlations.push({
            type: 'critical',
            category: 'Secret Exposure Chain',
            title: 'Exposed Secrets + Missing Web Protection',
            description: 'Your code contains exposed secrets AND your website lacks Content Security Policy',
            plainEnglish: 'You have passwords/API keys visible in your code, and your website is missing a security feature that could prevent attackers from stealing them. This is a dangerous combination!',
            risk: 'Attackers could steal your secrets and use them to compromise your entire application',
            fix: '1. Remove all secrets from code immediately\n2. Add CSP header to your website\n3. Use environment variables for all sensitive data\n4. Rotate all exposed credentials',
            severity: 'critical'
        });
    }
    
    // Check for dependency vulnerabilities + no HTTPS
    const hasDependencyIssues = githubResults.findings.some(f => f.category === 'Dependencies');
    const noHTTPS = webResults.findings.some(f => f.title === 'No HTTPS');
    
    if (hasDependencyIssues && noHTTPS) {
        correlations.push({
            type: 'high',
            category: 'Vulnerable Stack',
            title: 'Outdated Dependencies + Unencrypted Traffic',
            description: 'Vulnerable packages in code AND unencrypted web traffic',
            plainEnglish: 'Your code uses outdated packages with security flaws, and your website doesn\'t use HTTPS. Hackers could exploit both weaknesses at once.',
            risk: 'Combined attack vector: exploit vulnerable packages while intercepting unencrypted traffic',
            fix: '1. Enable HTTPS immediately (use Let\'s Encrypt for free)\n2. Update all vulnerable dependencies\n3. Set up automatic dependency updates',
            severity: 'high'
        });
    }
    
    // Check for config exposure + missing security headers
    const hasConfigIssues = githubResults.findings.some(f => f.category === 'Configuration');
    const missingHeaders = webResults.findings.filter(f => f.category === 'Security Headers').length;
    
    if (hasConfigIssues && missingHeaders >= 3) {
        correlations.push({
            type: 'high',
            category: 'Defense Gaps',
            title: 'Config Exposure + Weak Web Defenses',
            description: 'Configuration files exposed in code AND multiple missing security headers',
            plainEnglish: 'Your configuration files are visible in your code, and your website is missing basic security settings. This makes it easy for attackers to find and exploit weaknesses.',
            risk: 'Attackers can study your config to find attack vectors, and missing headers make exploitation easier',
            fix: '1. Move all config to environment variables\n2. Add missing security headers (see web scan results)\n3. Review all public files for sensitive data',
            severity: 'high'
        });
    }
    
    // If no specific correlations found, add general observation
    if (correlations.length === 0) {
        const totalIssues = (githubResults.summary?.total || 0) + (webResults.summary?.total || 0);
        if (totalIssues > 0) {
            correlations.push({
                type: 'info',
                category: 'Security Analysis',
                title: 'Code and Web Security Status',
                description: 'Your application has security issues in both code and web layers',
                plainEnglish: 'Both your source code and live website have some security improvements to make. The good news is they\'re fixable!',
                risk: 'Multiple attack surfaces exist across your application stack',
                fix: 'Follow the specific recommendations in the Code Security and Web Security sections below',
                severity: 'medium'
            });
        }
    }
    
    return correlations;
}

// Helper: Generate combined recommendations
const generateCombinedRecommendations = (correlatedIssues, summary) => {
    const recommendations = [];
    
    if (summary.critical > 0) {
        recommendations.push({
            priority: 'URGENT',
            action: `Fix ${summary.critical} critical issue${summary.critical > 1 ? 's' : ''} immediately`,
            reason: 'Critical vulnerabilities can be exploited right now to compromise your app'
        });
    }
    
    if (correlatedIssues.some(c => c.severity === 'critical')) {
        recommendations.push({
            priority: 'URGENT',
            action: 'Address correlated security issues first',
            reason: 'Combined vulnerabilities create a dangerous attack chain'
        });
    }
    
    if (summary.codeIssues > summary.webIssues) {
        recommendations.push({
            priority: 'HIGH',
            action: 'Focus on code security first (more issues found)',
            reason: 'Code vulnerabilities are typically more critical and harder to exploit defensively'
        });
    } else if (summary.webIssues > summary.codeIssues) {
        recommendations.push({
            priority: 'HIGH',
            action: 'Strengthen web security headers',
            reason: 'Your live application is more vulnerable than your codebase'
        });
    }
    
    if (summary.total === 0) {
        recommendations.push({
            priority: 'MAINTAIN',
            action: 'Keep up the great security practices!',
            reason: 'No major vulnerabilities found - continue monitoring regularly'
        });
    }
    
    return recommendations;
}

// Helper: Get overall security message
const getOverallSecurityMessage = (score, summary) => {
    if (summary.critical > 0) {
        return `⚠️ URGENT: Your application has ${summary.critical} critical security issue${summary.critical > 1 ? 's' : ''} that need immediate attention!`;
    }
    
    if (score >= 90) {
        return "🎉 Excellent! Your application is highly secure across both code and web layers.";
    } else if (score >= 80) {
        return "✅ Great job! Your application is mostly secure with just a few minor improvements needed.";
    } else if (score >= 70) {
        return "👍 Good start! Your application has some security issues to fix. Let's make it safer.";
    } else if (score >= 60) {
        return "⚠️ Your application has several security problems across code and web. Let's tackle them systematically.";
    } else {
        return "🚨 Your application needs urgent security improvements. Don't worry - we'll help you fix them step by step!";
    }
}

// Helper: Get severity numeric value for sorting
const getSeverityValue = (severity) => {
    const values = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
    return values[severity] || 0;
}