import axios from "axios";
import { exec } from "child_process";

// Environment detection: Use Docker locally, native binaries on Railway/production
const USE_DOCKER = process.env.USE_DOCKER === 'true';

// Web URL Scanner - Scans live web applications for security issues
export const scanWebUrl = async (url) => {
  console.log(`🔍 Scanning web application: ${url}`);
  
  const results = {
    url,
    timestamp: new Date().toISOString(),
    headers: {},
    securityHeaders: [],
    cors: [],
    ssl: [],
    cookies: [],
    misconfiguration: [],
    summary: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    }
  };

  try {
    // Fetch the URL and analyze headers
    const response = await axios.get(url, {
      validateStatus: () => true, // Accept any status
      maxRedirects: 5,
      timeout: 10000
    });

    results.headers = response.headers;
    results.statusCode = response.status;

    // Check security headers
    checkSecurityHeaders(response.headers, results);
    
    // Check CORS configuration
    checkCORS(response.headers, results);
    
    // Check cookies
    checkCookies(response.headers, results);
    
    // Check SSL/TLS
    await checkSSL(url, results);
    
    // Check for common misconfigurations
    checkMisconfigurations(response, results);

  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      throw new Error('Website not found or unreachable');
    } else if (error.code === 'ETIMEDOUT') {
      throw new Error('Request timed out - website may be slow or blocking requests');
    } else {
      throw new Error(`Failed to scan URL: ${error.message}`);
    }
  }

  console.log(`📊 Web scan complete: ${results.summary.critical} critical, ${results.summary.high} high, ${results.summary.medium} medium issues`);

  return results;
};

const checkSecurityHeaders = (headers, results) => {
  const requiredHeaders = {
    'x-frame-options': {
      severity: 'medium',
      name: 'X-Frame-Options',
      description: 'Missing X-Frame-Options header',
      risk: 'Vulnerable to clickjacking attacks',
      fix: 'Add header: X-Frame-Options: DENY or SAMEORIGIN'
    },
    'x-content-type-options': {
      severity: 'medium',
      name: 'X-Content-Type-Options',
      description: 'Missing X-Content-Type-Options header',
      risk: 'MIME type sniffing vulnerabilities',
      fix: 'Add header: X-Content-Type-Options: nosniff'
    },
    'strict-transport-security': {
      severity: 'high',
      name: 'Strict-Transport-Security (HSTS)',
      description: 'Missing HSTS header',
      risk: 'Man-in-the-middle attacks possible',
      fix: 'Add header: Strict-Transport-Security: max-age=31536000; includeSubDomains'
    },
    'content-security-policy': {
      severity: 'high',
      name: 'Content-Security-Policy',
      description: 'Missing CSP header',
      risk: 'XSS and data injection attacks possible',
      fix: 'Add CSP header with appropriate directives for your app'
    },
    'x-xss-protection': {
      severity: 'low',
      name: 'X-XSS-Protection',
      description: 'Missing X-XSS-Protection header',
      risk: 'Legacy XSS protection not enabled',
      fix: 'Add header: X-XSS-Protection: 1; mode=block'
    },
    'referrer-policy': {
      severity: 'low',
      name: 'Referrer-Policy',
      description: 'Missing Referrer-Policy header',
      risk: 'May leak sensitive information in referrer',
      fix: 'Add header: Referrer-Policy: strict-origin-when-cross-origin'
    },
    'permissions-policy': {
      severity: 'low',
      name: 'Permissions-Policy',
      description: 'Missing Permissions-Policy header',
      risk: 'Browser features not restricted',
      fix: 'Add header: Permissions-Policy: geolocation=(), microphone=(), camera=()'
    }
  };

  for (const [headerKey, headerInfo] of Object.entries(requiredHeaders)) {
    if (!headers[headerKey]) {
      results.securityHeaders.push({
        type: 'missing_header',
        severity: headerInfo.severity,
        name: headerInfo.name,
        description: headerInfo.description,
        risk: headerInfo.risk,
        recommendation: headerInfo.fix
      });
      
      results.summary[headerInfo.severity]++;
    }
  }

  // Check for insecure headers
  if (headers['server']) {
    results.securityHeaders.push({
      type: 'information_disclosure',
      severity: 'low',
      name: 'Server Header Exposed',
      description: `Server header reveals: ${headers['server']}`,
      risk: 'Attackers can identify server software and target specific vulnerabilities',
      recommendation: 'Remove or obscure the Server header'
    });
    results.summary.low++;
  }

  if (headers['x-powered-by']) {
    results.securityHeaders.push({
      type: 'information_disclosure',
      severity: 'low',
      name: 'X-Powered-By Header Exposed',
      description: `Technology stack revealed: ${headers['x-powered-by']}`,
      risk: 'Exposes backend technology, helping attackers target specific vulnerabilities',
      recommendation: 'Remove X-Powered-By header'
    });
    results.summary.low++;
  }
};

const checkCORS = (headers, results) => {
  const corsHeader = headers['access-control-allow-origin'];
  
  if (corsHeader === '*') {
    results.cors.push({
      type: 'cors_misconfiguration',
      severity: 'high',
      name: 'Wildcard CORS',
      description: 'CORS allows requests from any origin (*)',
      risk: 'Any website can make requests to your API, potentially exposing sensitive data',
      recommendation: 'Restrict CORS to specific trusted origins'
    });
    results.summary.high++;
  }

  const allowCredentials = headers['access-control-allow-credentials'];
  if (corsHeader === '*' && allowCredentials === 'true') {
    results.cors.push({
      type: 'cors_misconfiguration',
      severity: 'critical',
      name: 'Critical CORS Misconfiguration',
      description: 'CORS allows all origins with credentials',
      risk: 'CRITICAL: Any site can make authenticated requests to your app',
      recommendation: 'Never combine wildcard origin with credentials. Specify exact origins.'
    });
    results.summary.critical++;
  }

  const allowMethods = headers['access-control-allow-methods'];
  if (allowMethods && allowMethods.includes('DELETE') && corsHeader === '*') {
    results.cors.push({
      type: 'cors_misconfiguration',
      severity: 'high',
      name: 'Dangerous CORS Methods',
      description: 'CORS allows DELETE method from any origin',
      risk: 'Any website could delete data via your API',
      recommendation: 'Restrict dangerous methods to specific origins'
    });
    results.summary.high++;
  }
};

const checkCookies = (headers, results) => {
  const setCookie = headers['set-cookie'];
  
  if (setCookie) {
    const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
    
    cookies.forEach(cookie => {
      const issues = [];
      
      if (!cookie.toLowerCase().includes('secure')) {
        issues.push('Missing Secure flag');
      }
      
      if (!cookie.toLowerCase().includes('httponly')) {
        issues.push('Missing HttpOnly flag');
      }
      
      if (!cookie.toLowerCase().includes('samesite')) {
        issues.push('Missing SameSite attribute');
      }

      if (issues.length > 0) {
        const cookieName = cookie.split('=')[0];
        results.cookies.push({
          type: 'insecure_cookie',
          severity: 'medium',
          name: 'Insecure Cookie Configuration',
          description: `Cookie "${cookieName}" has issues: ${issues.join(', ')}`,
          risk: 'Cookies vulnerable to interception or CSRF attacks',
          recommendation: 'Add Secure, HttpOnly, and SameSite=Strict attributes to cookies'
        });
        results.summary.medium++;
      }
    });
  }
};

const checkSSL = async (url, results) => {
  if (!url.startsWith('https://')) {
    results.ssl.push({
      type: 'no_ssl',
      severity: 'critical',
      name: 'No HTTPS',
      description: 'Website not using HTTPS',
      risk: 'All traffic is unencrypted and vulnerable to interception',
      recommendation: 'Enable HTTPS with a valid SSL/TLS certificate (use Let\'s Encrypt for free)'
    });
    results.summary.critical++;
  }
};

const checkMisconfigurations = (response, results) => {
  // Check for common exposed endpoints
  const data = response.data?.toString() || '';
  
  // Check for development/debug indicators
  if (data.includes('__NEXT_DATA__') && data.includes('"buildId"')) {
    // This is normal for Next.js, but check for exposed env
    if (data.match(/NEXT_PUBLIC_[\w_]+|process\.env/)) {
      results.misconfiguration.push({
        type: 'exposed_config',
        severity: 'medium',
        name: 'Potential Config Exposure',
        description: 'Environment variables may be exposed in page source',
        risk: 'Sensitive configuration might be visible to users',
        recommendation: 'Review which env vars are exposed via NEXT_PUBLIC_ prefix'
      });
      results.summary.medium++;
    }
  }

  // Check for common debug modes
  if (data.includes('DEBUG=') || data.includes('NODE_ENV=development')) {
    results.misconfiguration.push({
      type: 'debug_mode',
      severity: 'high',
      name: 'Debug Mode Enabled',
      description: 'Application appears to be in debug/development mode',
      risk: 'Exposes detailed error messages and internal application structure',
      recommendation: 'Set NODE_ENV=production and disable debug flags'
    });
    results.summary.high++;
  }

  // Check for directory listing
  if (data.includes('Index of /') || data.includes('Directory listing for')) {
    results.misconfiguration.push({
      type: 'directory_listing',
      severity: 'medium',
      name: 'Directory Listing Enabled',
      description: 'Server is listing directory contents',
      risk: 'Exposes file structure and potentially sensitive files',
      recommendation: 'Disable directory listing in web server configuration'
    });
    results.summary.medium++;
  }
};

// Nuclei integration for advanced web vulnerability scanning
export const runNuclei = async (url) => {
  console.log('🔍 Running Nuclei vulnerability scanner...');
  
  // Choose command based on environment
  const command = USE_DOCKER
    ? `docker run --rm projectdiscovery/nuclei:latest -u "${url}" -json -silent -severity critical,high,medium`
    : `nuclei -u "${url}" -json -silent -severity critical,high,medium`;
  
  return new Promise((resolve) => {
    exec(
      command,
      { maxBuffer: 50 * 1024 * 1024, timeout: 120000 }, // 2 min timeout
      (err, stdout, stderr) => {
        if (err) {
          console.warn('⚠️  Nuclei scan error (continuing anyway):', err.message);
          resolve([]);
          return;
        }

        try {
          if (!stdout || !stdout.trim()) {
            console.log('📊 Nuclei found no vulnerabilities');
            resolve([]);
            return;
          }

          const findings = stdout
            .trim()
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
              try {
                return JSON.parse(line);
              } catch (e) {
                return null;
              }
            })
            .filter(item => item !== null)
            .map(finding => ({
              type: finding.type || 'unknown',
              severity: finding.info?.severity || 'info',
              name: finding.info?.name || 'Unknown Vulnerability',
              description: finding.info?.description || '',
              matched: finding['matched-at'] || finding.host,
              reference: finding.info?.reference || [],
              recommendation: `Review and fix: ${finding.info?.name || 'this vulnerability'}`
            }));

          console.log(`📊 Nuclei found ${findings.length} vulnerabilities`);
          resolve(findings);
        } catch (parseError) {
          console.error('❌ Failed to parse Nuclei output:', parseError.message);
          resolve([]);
        }
      }
    );
  });
};


