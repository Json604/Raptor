import { useEffect, useState } from "react";
import './Results.css';
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { Shield, Activity, Check } from 'lucide-react';

export default function Results() {
    const [data, setData] = useState<any>(null);
    const [error] = useState<string | null>(null); // Demo mode: errors disabled
    const [isLoading, setIsLoading] = useState(true);
    const [monitoringState, setMonitoringState] = useState<'idle' | 'loading' | 'success'>('idle');
    const [showModal, setShowModal] = useState(false);
    const location = useLocation()
    const navigate = useNavigate()
    const {githubUrl, webUrl} = location.state || {}
    // const BASE_URL = import.meta.env.VITE_BASE_URL; // Demo mode: API disabled
    
    // Sample data for development
//     useEffect(() => {
//     setData({
//   "success": true,
//   "message": "Web application scanned successfully",
//   "data": {
//     "report": {
//       "score": 71,
//       "grade": "C",
//       "url": "https://raptor.support",
//       "summary": {
//         "total": 7,
//         "critical": 0,
//         "high": 1,
//         "medium": 2,
//         "low": 4
//       },
//       "message": "Good start, but there are some security issues to fix. Let's make your app safer!",
//       "findings": [
//         {
//           "category": "Security Headers",
//           "severity": "high",
//           "title": "Content-Security-Policy",
//           "description": "Missing CSP header",
//           "plainEnglish": "Your website is missing a security setting (Content-Security-Policy) that protects against attacks. Think of it like forgetting to lock a door.",
//           "risk": "XSS and data injection attacks possible",
//           "fix": "Add CSP header with appropriate directives for your app"
//         },
//         {
//           "category": "Security Headers",
//           "severity": "medium",
//           "title": "X-Frame-Options",
//           "description": "Missing X-Frame-Options header",
//           "plainEnglish": "Your website is missing a security setting (X-Frame-Options) that protects against attacks. Think of it like forgetting to lock a door.",
//           "risk": "Vulnerable to clickjacking attacks",
//           "fix": "Add header: X-Frame-Options: DENY or SAMEORIGIN"
//         },
//         {
//           "category": "Security Headers",
//           "severity": "medium",
//           "title": "X-Content-Type-Options",
//           "description": "Missing X-Content-Type-Options header",
//           "plainEnglish": "Your website is missing a security setting (X-Content-Type-Options) that protects against attacks. Think of it like forgetting to lock a door.",
//           "risk": "MIME type sniffing vulnerabilities",
//           "fix": "Add header: X-Content-Type-Options: nosniff"
//         },
//         {
//           "category": "Security Headers",
//           "severity": "low",
//           "title": "X-XSS-Protection",
//           "description": "Missing X-XSS-Protection header",
//           "plainEnglish": "Your website is missing a security setting (X-XSS-Protection) that protects against attacks. Think of it like forgetting to lock a door.",
//           "risk": "Legacy XSS protection not enabled",
//           "fix": "Add header: X-XSS-Protection: 1; mode=block"
//         },
//         {
//           "category": "Security Headers",
//           "severity": "low",
//           "title": "Referrer-Policy",
//           "description": "Missing Referrer-Policy header",
//           "plainEnglish": "Your website is missing a security setting (Referrer-Policy) that protects against attacks. Think of it like forgetting to lock a door.",
//           "risk": "May leak sensitive information in referrer",
//           "fix": "Add header: Referrer-Policy: strict-origin-when-cross-origin"
//         },
//         {
//           "category": "Security Headers",
//           "severity": "low",
//           "title": "Permissions-Policy",
//           "description": "Missing Permissions-Policy header",
//           "plainEnglish": "Your website is missing a security setting (Permissions-Policy) that protects against attacks. Think of it like forgetting to lock a door.",
//           "risk": "Browser features not restricted",
//           "fix": "Add header: Permissions-Policy: geolocation=(), microphone=(), camera=()"
//         },
//         {
//           "category": "Security Headers",
//           "severity": "low",
//           "title": "Server Header Exposed",
//           "description": "Server header reveals: Netlify",
//           "plainEnglish": "Your website is missing a security setting (Server Header Exposed) that protects against attacks. Think of it like forgetting to lock a door.",
//           "risk": "Attackers can identify server software and target specific vulnerabilities",
//           "fix": "Remove or obscure the Server header"
//         }
//       ],
//       "scannedAt": "2025-10-23T20:25:33.320Z",
//       "scanDuration": "0.34",
//       "raw": {
//         "url": "https://raptor.support",
//         "timestamp": "2025-10-23T20:25:33.320Z",
//         "headers": {
//           "accept-ranges": "bytes",
//           "age": "21614",
//           "cache-control": "public,max-age=0,must-revalidate",
//           "cache-status": "\"Netlify Edge\"; hit",
//           "content-length": "891",
//           "content-type": "text/html; charset=UTF-8",
//           "date": "Thu, 23 Oct 2025 20:25:33 GMT",
//           "etag": "\"20d836e73e1859a3dc06450252b22c0b-ssl-df\"",
//           "server": "Netlify",
//           "strict-transport-security": "max-age=31536000",
//           "vary": "Accept-Encoding",
//           "x-nf-request-id": "01K89BZ1YZS9XFA2E00Q6QYKSW"
//         },
//         "securityHeaders": [
//           {
//             "type": "missing_header",
//             "severity": "medium",
//             "name": "X-Frame-Options",
//             "description": "Missing X-Frame-Options header",
//             "risk": "Vulnerable to clickjacking attacks",
//             "recommendation": "Add header: X-Frame-Options: DENY or SAMEORIGIN"
//           },
//           {
//             "type": "missing_header",
//             "severity": "medium",
//             "name": "X-Content-Type-Options",
//             "description": "Missing X-Content-Type-Options header",
//             "risk": "MIME type sniffing vulnerabilities",
//             "recommendation": "Add header: X-Content-Type-Options: nosniff"
//           },
//           {
//             "type": "missing_header",
//             "severity": "high",
//             "name": "Content-Security-Policy",
//             "description": "Missing CSP header",
//             "risk": "XSS and data injection attacks possible",
//             "recommendation": "Add CSP header with appropriate directives for your app"
//           },
//           {
//             "type": "missing_header",
//             "severity": "low",
//             "name": "X-XSS-Protection",
//             "description": "Missing X-XSS-Protection header",
//             "risk": "Legacy XSS protection not enabled",
//             "recommendation": "Add header: X-XSS-Protection: 1; mode=block"
//           },
//           {
//             "type": "missing_header",
//             "severity": "low",
//             "name": "Referrer-Policy",
//             "description": "Missing Referrer-Policy header",
//             "risk": "May leak sensitive information in referrer",
//             "recommendation": "Add header: Referrer-Policy: strict-origin-when-cross-origin"
//           },
//           {
//             "type": "missing_header",
//             "severity": "low",
//             "name": "Permissions-Policy",
//             "description": "Missing Permissions-Policy header",
//             "risk": "Browser features not restricted",
//             "recommendation": "Add header: Permissions-Policy: geolocation=(), microphone=(), camera=()"
//           },
//           {
//             "type": "information_disclosure",
//             "severity": "low",
//             "name": "Server Header Exposed",
//             "description": "Server header reveals: Netlify",
//             "risk": "Attackers can identify server software and target specific vulnerabilities",
//             "recommendation": "Remove or obscure the Server header"
//           }
//         ],
//         "cors": [],
//         "ssl": [],
//         "cookies": [],
//         "misconfiguration": [],
//         "summary": {
//           "critical": 0,
//           "high": 1,
//           "medium": 2,
//           "low": 4
//         },
//         "statusCode": 200
//       }
//     },
//     "aiReport": {
//       "inDepth": {
//         "summary": "The security scan for raptor.support identified several missing security headers and an exposed server header. The most significant finding is the missing Content-Security-Policy (CSP) header, which leaves the application vulnerable to Cross-Site Scripting (XSS) and data injection attacks. The absence of X-Frame-Options makes the site susceptible to clickjacking. The lack of X-Content-Type-Options opens the door to MIME sniffing vulnerabilities. Additionally, the report indicates that the legacy X-XSS-Protection is not enabled. The Referrer-Policy and Permissions-Policy headers are also missing, potentially leading to information leakage and unrestricted browser feature usage, respectively. Finally, the exposure of the 'Server' header, which reveals 'Netlify', allows attackers to identify the underlying server software and target known vulnerabilities specific to that platform.",
//         "fixes": [
//           {
//             "issue": "Missing X-Frame-Options header",
//             "recommendation": "Add the following header to the server configuration: `X-Frame-Options: DENY` or `X-Frame-Options: SAMEORIGIN`. `DENY` prevents the page from being framed at all, while `SAMEORIGIN` allows framing only by pages from the same origin. Choose the option that best fits the application's requirements."
//           },
//           {
//             "issue": "Missing X-Content-Type-Options header",
//             "recommendation": "Add the following header to the server configuration: `X-Content-Type-Options: nosniff`. This prevents the browser from MIME-sniffing the content type, mitigating potential security vulnerabilities."
//           },
//           {
//             "issue": "Missing Content-Security-Policy (CSP) header",
//             "recommendation": "Implement a Content-Security-Policy header. This is a complex header and should be tailored to the specific application requirements. A basic example is: `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self';` Carefully review and adjust the `default-src` and other directives to restrict the sources from which the application can load resources."
//           },
//           {
//             "issue": "Missing X-XSS-Protection header",
//             "recommendation": "Add the following header to the server configuration: `X-XSS-Protection: 1; mode=block`. This enables the browser's built-in XSS protection and instructs it to block the page if an XSS attack is detected."
//           },
//           {
//             "issue": "Missing Referrer-Policy header",
//             "recommendation": "Add the following header to the server configuration: `Referrer-Policy: strict-origin-when-cross-origin`. This will send the full URL as the referrer when navigating within the same origin, but only the origin when navigating to a different origin, reducing the risk of leaking sensitive information."
//           },
//           {
//             "issue": "Missing Permissions-Policy header",
//             "recommendation": "Add a Permissions-Policy header to restrict access to browser features. For example, to disable geolocation, microphone, and camera features, use: `Permissions-Policy: geolocation=(), microphone=(), camera=()`. Adjust the policy according to the application's needs and required permissions."
//           },
//           {
//             "issue": "Server Header Exposed",
//             "recommendation": "Configure the web server (Netlify in this case) to remove or obscure the 'Server' header. While the specific configuration varies depending on the server, most servers have options to customize the 'Server' header value or suppress it entirely. Consult the Netlify documentation for guidance on modifying or removing server headers."
//           }
//         ]
//       },
//       "vibe": {
//         "summary": "Okay, so the scan found some security holes on your website. Think of it like leaving the doors and windows unlocked on your house. The biggest risk is someone could inject malicious code into your site (XSS), which would let them steal user data or mess with your content. There are also smaller issues, like your website revealing it's running on Netlify, which could help bad guys target it with attacks. It's best to fix these, even the smaller ones, to keep everything safe and sound.",
//         "fixes": [
//           {
//             "issue": "Missing X-Frame-Options header",
//             "stepByStep": [
//               "Step 1: Access your Netlify project's 'netlify.toml' file.",
//               "Step 2: Add the following to the [http_headers] section:\n[[headers]]\n for = \"/*\"\n [headers.values]\n X-Frame-Options = \"DENY\""
//             ],
//             "necessary": "Yes — Prevents your site from being embedded in malicious iframes (clickjacking)."
//           },
//           {
//             "issue": "Missing X-Content-Type-Options header",
//             "stepByStep": [
//               "Step 1: Access your Netlify project's 'netlify.toml' file.",
//               "Step 2: Add the following to the [http_headers] section (or append to the existing one):\n[[headers]]\n for = \"/*\"\n [headers.values]\n X-Content-Type-Options = \"nosniff\""
//             ],
//             "necessary": "Yes — Prevents browsers from incorrectly interpreting file types, reducing the risk of XSS attacks."
//           },
//           {
//             "issue": "Missing Content-Security-Policy header",
//             "stepByStep": [
//               "Step 1: Access your Netlify project's 'netlify.toml' file.",
//               "Step 2: **Carefully** define your CSP directives (this is complex, research best practices for your app). Start with a restrictive policy and loosen as needed.",
//               "Step 3: Add to the [http_headers] section:\n[[headers]]\n for = \"/*\"\n [headers.values]\n Content-Security-Policy = \"default-src 'self'\" (Example - replace with a secure policy applicable to your code)"
//             ],
//             "necessary": "Yes — Crucial for mitigating XSS attacks by controlling the sources from which the browser is allowed to load resources."
//           },
//           {
//             "issue": "Missing X-XSS-Protection header",
//             "stepByStep": [
//               "Step 1: Access your Netlify project's 'netlify.toml' file.",
//               "Step 2: Add the following to the [http_headers] section:\n[[headers]]\n for = \"/*\"\n [headers.values]\n X-XSS-Protection = \"1; mode=block\""
//             ],
//             "necessary": "Good to have — Adds a legacy layer of XSS protection, even though newer browsers rely on CSP. "
//           },
//           {
//             "issue": "Missing Referrer-Policy header",
//             "stepByStep": [
//               "Step 1: Access your Netlify project's 'netlify.toml' file.",
//               "Step 2: Add the following to the [http_headers] section:\n[[headers]]\n for = \"/*\"\n [headers.values]\n Referrer-Policy = \"strict-origin-when-cross-origin\""
//             ],
//             "necessary": "Useful — Controls how much information is sent in the Referer header, preventing potential information leaks."
//           },
//           {
//             "issue": "Missing Permissions-Policy header",
//             "stepByStep": [
//               "Step 1: Access your Netlify project's 'netlify.toml' file.",
//               "Step 2: Add the following to the [http_headers] section. Customize the policy based on your app's needs:\n[[headers]]\n for = \"/*\"\n [headers.values]\n Permissions-Policy = \"geolocation=(), microphone=(), camera=()\""
//             ],
//             "necessary": "Nice to have — Restricts access to browser features, improving security and privacy by disabling features you don't need."
//           },
//           {
//             "issue": "Server Header Exposed",
//             "stepByStep": [
//               "Step 1:  This typically requires configuration within the web server itself.  With Netlify, this often isn't directly configurable.",
//               "Step 2: Since this is on Netlify and you can't directly control it, you would need to use a proxy or CDN in front of Netlify to strip the header. This adds complexity.",
//               "Step 3: If you chose this route, configure your proxy (like Cloudflare) to remove or mask the Server header."
//             ],
//             "necessary": "Not critical —  Lower priority; hiding server information makes targeting attacks slightly harder, but isn't a core vulnerability."
//           }
//         ]
//       }
//     }
//   }
// })
//     }, []);

    // Scroll to top when page loads
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, []);

    // DEMO MODE: Using mock data for product demonstration
    useEffect(() => {
        // Simulate loading state for realistic demo experience
        setTimeout(() => {
            setData({
                success: true,
                message: "Security scan completed successfully",
                data: {
                    url: webUrl ? `https://${webUrl}` : githubUrl || "demo-application.com",
                    score: 68,
                    grade: "C+",
                    summary: {
                        total: 5,
                        critical: 1,
                        high: 2,
                        medium: 1,
                        low: 1
                    },
                    message: "Your application has several security vulnerabilities that require immediate attention. We've identified critical issues that could expose sensitive data.",
                    findings: [
                        {
                            title: "Insecure Content Loading via HTTP",
                            category: "Network Security",
                            severity: "critical",
                            plainEnglish: "Your application loads critical resources over unencrypted HTTP connections, making them vulnerable to interception and tampering by attackers.",
                            risk: "Man-in-the-middle attacks, data interception, credential theft",
                            fix: "Enforce HTTPS for all external resources. Update Content-Security-Policy header to 'upgrade-insecure-requests'",
                            aiSuggestedFix: "Add to your server config:\nContent-Security-Policy: upgrade-insecure-requests;\nStrict-Transport-Security: max-age=31536000;"
                        },
                        {
                            title: "Missing Authentication Rate Limiting",
                            category: "Authentication",
                            severity: "high",
                            plainEnglish: "Your login endpoints don't have rate limiting protection, allowing attackers to attempt unlimited password guesses without being blocked.",
                            risk: "Brute force attacks, credential stuffing, account takeover",
                            fix: "Implement rate limiting on authentication endpoints (max 5 attempts per 15 minutes)",
                            aiSuggestedFix: "Install: npm install express-rate-limit\n\nconst rateLimit = require('express-rate-limit');\nconst loginLimiter = rateLimit({\n  windowMs: 15 * 60 * 1000,\n  max: 5\n});\napp.use('/api/login', loginLimiter);"
                        },
                        {
                            title: "SQL Injection Vulnerability Detected",
                            category: "Code Security",
                            severity: "high",
                            plainEnglish: "Database queries are being constructed using string concatenation with user input, creating opportunities for SQL injection attacks.",
                            risk: "Unauthorized data access, data manipulation, database compromise",
                            fix: "Use parameterized queries or prepared statements for all database operations",
                            aiSuggestedFix: "Replace:\ndb.query(`SELECT * FROM users WHERE id = ${userId}`)\n\nWith:\ndb.query('SELECT * FROM users WHERE id = ?', [userId])"
                        },
                        {
                            title: "Exposed API Keys in Client Code",
                            category: "Data Exposure",
                            severity: "medium",
                            plainEnglish: "Sensitive API keys and tokens are hardcoded in your frontend JavaScript, making them visible to anyone who views your page source.",
                            risk: "Unauthorized API usage, service abuse, potential data breaches",
                            fix: "Move all API keys to server-side environment variables and use backend proxies for API calls",
                            aiSuggestedFix: "Create .env file:\nAPI_KEY=your_secret_key\n\nServer:\nconst apiKey = process.env.API_KEY;\n\nNever expose keys in frontend code."
                        },
                        {
                            title: "Weak Session Configuration",
                            category: "Session Management",
                            severity: "low",
                            plainEnglish: "Session cookies are configured without secure flags, making them vulnerable to theft through JavaScript or non-HTTPS connections.",
                            risk: "Session hijacking, unauthorized access to user accounts",
                            fix: "Configure session cookies with HttpOnly, Secure, and SameSite=Strict flags",
                            aiSuggestedFix: "app.use(session({\n  cookie: {\n    httpOnly: true,\n    secure: true,\n    sameSite: 'strict',\n    maxAge: 3600000\n  }\n}));"
                        }
                    ],
                    scannedAt: new Date().toISOString(),
                    scanDuration: "2.47",
                    raw: {} // Placeholder for export functionality
                }
            });
            setIsLoading(false);
        }, 2000); // 2 second simulated loading
    }, [githubUrl, webUrl]);

    const handleMonitoringClick = () => {
        setMonitoringState('loading');
        
        // After 2 seconds, show success
        setTimeout(() => {
            setMonitoringState('success');
            
            // After 0.5 seconds, show modal
            setTimeout(() => {
                setShowModal(true);
            }, 500);
        }, 2000);
    };

    const handleStartMonitoring = () => {
        navigate('/monitoring-dashboard');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (error) {
        return (
            <>
                <Navbar />
                <div className="results-container">
                    <div className="error-message">
                        <h2>Scan Failed</h2>
                        <p>{error}</p>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button 
                                onClick={() => window.location.reload()} 
                                style={{
                                    background: '#00d4ff',
                                    color: 'black',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                Try Again
                            </button>
                            <button 
                                onClick={() => window.history.back()} 
                                style={{
                                    background: 'transparent',
                                    color: '#00d4ff',
                                    border: '1px solid #00d4ff',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                Go Back
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (isLoading || !data) {
        return (
            <>
                <Navbar />
                <div className="results-container">
                    {/* Skeleton Page Header */}
                    <div className="skeleton-page-header">
                        <div className="skeleton-page-title"></div>
                        <div className="skeleton-monitoring-button"></div>
                    </div>

                    {/* Skeleton Two Column Layout */}
                    <div className="skeleton-results-layout">
                        {/* Skeleton Left Column */}
                        <div className="skeleton-overview-column">
                            {/* Skeleton Summary Card */}
                            <div className="skeleton-summary-card">
                                <div className="skeleton-summary-label"></div>
                                <div className="skeleton-summary-value"></div>
                                <div className="skeleton-summary-badge">
                                    <div className="skeleton-badge-icon"></div>
                                    <div className="skeleton-badge-text">
                                        <div className="skeleton-badge-label"></div>
                                        <div className="skeleton-badge-score"></div>
                                    </div>
                                </div>
                                <div className="skeleton-meta-list">
                                    <div className="skeleton-meta-item"></div>
                                    <div className="skeleton-meta-item"></div>
                                    <div className="skeleton-meta-item"></div>
                                </div>
                            </div>

                            {/* Skeleton Risk Overview */}
                            <div className="skeleton-risk-card">
                                <div className="skeleton-risk-title"></div>
                                <div className="skeleton-risk-items">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="skeleton-risk-item">
                                            <div className="skeleton-risk-count"></div>
                                            <div className="skeleton-risk-label"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Skeleton Right Column */}
                        <div className="skeleton-vulnerabilities-column">
                            <div className="skeleton-section-title"></div>
                            <div className="skeleton-vulnerabilities-list">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="skeleton-vulnerability-card">
                                        <div className="skeleton-vuln-header">
                                            <div className="skeleton-vuln-title"></div>
                                            <div className="skeleton-severity-badge"></div>
                                        </div>
                                        <div className="skeleton-vuln-category"></div>
                                        <div className="skeleton-vuln-description"></div>
                                        <div className="skeleton-vuln-description short"></div>
                                        <div className="skeleton-impact-box"></div>
                                        <div className="skeleton-code-block"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const report = data.data;

    return (
        <>
            <Navbar />
            <div className="results-container">
                {/* Page Header */}
                <div className="page-header fade-in">
                    <h1 className="page-title">Scan Results</h1>
                    <button 
                        className={`monitoring-button-header ${monitoringState}`}
                        onClick={handleMonitoringClick}
                        disabled={monitoringState !== 'idle'}
                    >
                        {monitoringState === 'idle' && (
                            <>
                                <Shield size={16} />
                                <span>Enable Monitoring</span>
                            </>
                        )}
                        {monitoringState === 'loading' && (
                            <>
                                <Activity size={16} className="spin" />
                                <span>Activating...</span>
                            </>
                        )}
                        {monitoringState === 'success' && (
                            <>
                                <Check size={16} />
                                <span>Ready!</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Monitoring Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-icon">
                                <Activity size={48} />
                            </div>
                            <h2 className="modal-title">Continuous Monitoring</h2>
                            <p className="modal-description">
                                Monitor your site in real-time with Raptor's Continuous Monitoring. 
                                Stay ahead of every risk.
                            </p>
                            <div className="modal-actions">
                                <button className="modal-button primary" onClick={handleStartMonitoring}>
                                    Start Monitoring
                                </button>
                                <button className="modal-button secondary" onClick={() => setShowModal(false)}>
                                    Maybe Later
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Two Column Layout */}
                <div className="results-layout">
                    {/* Left Column - Overview */}
                    <div className="overview-column">
                        {/* Scan Summary */}
                        <div className="summary-card fade-in" style={{ animationDelay: '0.1s' }}>
                            <div className="summary-header">
                                <div className="summary-info">
                                    <div className="summary-label">Application</div>
                                    <div className="summary-value">{report.url}</div>
                                </div>
                                <div className="summary-badge">
                                    <div className="badge-icon">
                                        <Shield size={20} />
                                    </div>
                                    <div className="badge-content">
                                        <div className="badge-label">Score</div>
                                        <div className="badge-score">{report.score}<span className="score-suffix">/100</span></div>
                                    </div>
                                </div>
                            </div>
                            <div className="summary-meta">
                                <div className="meta-group">
                                    <span className="meta-key">Last Scan</span>
                                    <span className="meta-value">{formatDate(report.scannedAt)}</span>
                                </div>
                                <div className="meta-group">
                                    <span className="meta-key">Duration</span>
                                    <span className="meta-value">{report.scanDuration}s</span>
                                </div>
                                <div className="meta-group">
                                    <span className="meta-key">Issues</span>
                                    <span className="meta-value">{report.summary.total}</span>
                                </div>
                            </div>
                        </div>

                        {/* Risk Overview */}
                        <div className="overview-section fade-in" style={{ animationDelay: '0.15s' }}>
                            <h3 className="overview-title">Risk Overview</h3>
                            <div className="risk-list">
                                <div className="risk-item">
                                    <div className="risk-count">{report.summary.critical}</div>
                                    <div className="risk-label">Critical</div>
                                </div>
                                <div className="risk-item">
                                    <div className="risk-count">{report.summary.high}</div>
                                    <div className="risk-label">High</div>
                                </div>
                                <div className="risk-item">
                                    <div className="risk-count">{report.summary.medium}</div>
                                    <div className="risk-label">Medium</div>
                                </div>
                                <div className="risk-item">
                                    <div className="risk-count">{report.summary.low}</div>
                                    <div className="risk-label">Low</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Vulnerabilities */}
                    <div className="vulnerabilities-column">
                        <h2 className="section-title fade-in" style={{ animationDelay: '0.2s' }}>Vulnerabilities & Fixes</h2>
                        <div className="vulnerabilities-list">
                            {report.findings.map((finding: any, index: number) => (
                                <div key={index} className="vulnerability-card fade-in" style={{ animationDelay: `${0.25 + index * 0.08}s` }}>
                                    <div className="vulnerability-header">
                                        <div className="vulnerability-top">
                                            <h3 className="vulnerability-title">{finding.title}</h3>
                                            <div className={`severity-badge severity-${finding.severity.toLowerCase()}`}>
                                                {finding.severity}
                                            </div>
                                        </div>
                                        <div className="vulnerability-category">{finding.category}</div>
                                    </div>

                                    <div className="vulnerability-content">
                                        <p className="vulnerability-description">{finding.plainEnglish}</p>
                                        
                                        <div className="impact-section">
                                            <div className="impact-label">Impact</div>
                                            <div className="impact-text">{finding.risk}</div>
                                        </div>

                                        <div className="fix-section">
                                            <div className="fix-header">
                                                <div className="fix-label">AI Suggested Fix</div>
                                                <button 
                                                    className="copy-fix-button"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(finding.aiSuggestedFix);
                                                        const btn = document.activeElement as HTMLButtonElement;
                                                        const originalText = btn.textContent;
                                                        btn.textContent = '✓ Copied';
                                                        setTimeout(() => {
                                                            btn.textContent = originalText;
                                                        }, 2000);
                                                    }}
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                            <pre className="fix-code">{finding.aiSuggestedFix}</pre>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
