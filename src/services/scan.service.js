import isGithubUrl from "is-github-url"
import { axiosURLverifier } from "../helpers/verifyRepo.js"
import { zipDownloader } from "../helpers/zipRepo.js"
import { unzipRepo } from "../helpers/unzipRepo.js"
import { runGitleaks, runTruffleHog } from "../helpers/runScans.js"
import { scanConfigExposure } from "../helpers/configScanner.js"
import { scanDependencies } from "../helpers/dependencyScanner.js"
import { scanWebUrl, runNuclei } from "../helpers/webScanner.js"
import { formatScanResults } from "../helpers/formatter.js"
import fs from "fs"

export const githubUrlScanService = async (url) => {
    console.log('\n🦅 Raptor GitHub Scan Started:', url);
    const startTime = Date.now();
    
    if(!isGithubUrl(url)){
        const error = new Error("Invalid GitHub URL. Please provide a GitHub repository URL (e.g., https://github.com/owner/repo)")
        error.status = 400
        throw error
    }
    console.log('✅ Valid GitHub URL');
    
    await axiosURLverifier(url)
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
    const hostname = parsedUrl.hostname.toLowerCase();
    const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
    if (blockedHosts.includes(hostname)) {
        const err = new Error("Scanning localhost/internal IPs is not allowed for security reasons. Deploy your app to scan it.");
        err.status = 400;
        throw err;
    }

    // 4. Reject GitHub URLs - they should use /scan/github endpoint
    if (isGithubUrl(url)) {
        const err = new Error("GitHub URLs should use /api/v1/scan/github endpoint instead");
        err.status = 400;
        throw err;
    }

    // 5. Reject code hosting platforms
    const codeHostingPatterns = [
        'gitlab.com',
        'bitbucket.org',
        'gitea.',
        'codeberg.org'
    ];
    
    if (codeHostingPatterns.some(pattern => url.includes(pattern))) {
        const err = new Error("Code repository URLs are not supported for web scanning. This endpoint scans live web applications only.");
        err.status = 400;
        throw err;
    }

    // 6. Reject document sharing platforms and non-web-apps
    const nonWebAppPatterns = [
        'docs.google.com',      // Google Docs
        'drive.google.com',     // Google Drive
        'dropbox.com',          // Dropbox
        'onedrive.live.com',    // OneDrive
        'notion.so',            // Notion
        'airtable.com',         // Airtable
        'figma.com',            // Figma
        'canva.com',            // Canva
        'miro.com',             // Miro
        'trello.com',           // Trello
        'asana.com',            // Asana
        'slack.com',            // Slack
        'discord.com',          // Discord
        'youtube.com',          // YouTube
        'vimeo.com',            // Vimeo
        'facebook.com',         // Facebook
        'twitter.com',          // Twitter/X
        'linkedin.com',         // LinkedIn
        'instagram.com',        // Instagram
        'tiktok.com',           // TikTok
        'reddit.com',           // Reddit
        'stackoverflow.com',    // Stack Overflow
        'github.io',            // GitHub Pages (use GitHub scanner instead)
        'netlify.app',          // Netlify (might be valid, but often just static sites)
        'vercel.app',           // Vercel (might be valid, but often just static sites)
        'herokuapp.com',        // Heroku (might be valid, but often just demos)
        'surge.sh',             // Surge (static hosting)
        'firebaseapp.com',      // Firebase hosting (might be valid)
        'pages.dev',            // Cloudflare Pages
        'web.app',              // Firebase web apps
        'appspot.com'           // Google App Engine
    ];
    
    if (nonWebAppPatterns.some(pattern => hostname.includes(pattern))) {
        const err = new Error("This appears to be a document sharing platform, social media, or hosting service rather than a web application. Raptor scans actual web applications for security vulnerabilities.");
        err.status = 400;
        throw err;
    }

    // 6. Verify the URL is actually reachable
    console.log('✅ Validating URL accessibility...');
    try {
        const response = await axiosURLverifier(url);
    } catch (error) {
        const err = new Error(`Website is not accessible: ${error.message}. Please check the URL and try again.`);
        err.status = 400;
        throw err;
    }
    console.log('✅ Website is accessible');

    console.log('\n🔐 Running web security scans...');
    
    // Run web scans
    const webResults = await scanWebUrl(url);
    
    // Run Nuclei for advanced vulnerability detection (optional, may timeout)
    console.log('\n🔍 Running advanced vulnerability scanner...');
    const nucleiResults = await runNuclei(url);
    webResults.nuclei = nucleiResults;

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