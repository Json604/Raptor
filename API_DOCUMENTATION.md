# 🦅 Raptor API Documentation

## Base URL
```
http://localhost:3000/api/v1
```

---

## Scan Types

### 🚀 Quick Scan (Free)
Fast security scanning without advanced vulnerability detection. Perfect for quick security checks.

### 🔍 Deep Scan (Paid - Coming Soon)
Comprehensive security scanning with advanced vulnerability detection using Nuclei. Includes correlation analysis and detailed reporting.

---

## Quick Scan Endpoints

### 1. GitHub Repository Quick Scan
**Endpoint:** `POST /scan/quick/github`

**Description:** Scans a GitHub repository for security vulnerabilities including secrets, dependencies, and configuration issues.

**Request Body:**
```json
{
  "url": "https://github.com/owner/repo"
}
```

**Response:**
```json
{
  "success": true,
  "message": "GitHub repository scanned successfully",
  "data": {
    "score": 85,
    "grade": "B",
    "summary": {
      "total": 5,
      "critical": 0,
      "high": 2,
      "medium": 3,
      "low": 0
    },
    "findings": [...],
    "scanDuration": "7.42",
    "scannedAt": "2025-10-22T12:00:00.000Z"
  }
}
```

---

### 2. Web Application Quick Scan
**Endpoint:** `POST /scan/quick/web`

**Description:** Scans a live web application for security headers, CORS, SSL, and other web vulnerabilities.

**Request Body:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Web application scanned successfully",
  "data": {
    "score": 71,
    "grade": "C",
    "url": "https://example.com",
    "summary": {
      "total": 7,
      "critical": 0,
      "high": 1,
      "medium": 2,
      "low": 4
    },
    "findings": [...],
    "scanDuration": "0.64",
    "scannedAt": "2025-10-22T12:00:00.000Z"
  }
}
```

---

### 3. 🌟 Full Application Quick Scan
**Endpoint:** `POST /scan/quick/full`

**Description:** **RAPTOR'S KILLER FEATURE!** Combines GitHub repository scan AND web application scan into a single comprehensive security assessment. This endpoint provides:
- **Unified Security Score** (weighted: 60% code, 40% web)
- **Correlated Security Issues** (finds dangerous combinations)
- **Smart Recommendations** (priority-based action items)
- **Complete Security Picture** (both code and live app)

**Request Body:**
```json
{
  "githubUrl": "https://github.com/owner/repo",
  "webUrl": "https://example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Full application security scan completed successfully",
  "data": {
    "scanType": "full",
    "overallScore": 78,
    "overallGrade": "C",
    "summary": {
      "total": 12,
      "critical": 1,
      "high": 3,
      "medium": 5,
      "low": 3,
      "codeIssues": 5,
      "webIssues": 7
    },
    "message": "👍 Good start! Your application has some security issues to fix. Let's make it safer.",
    
    "codeSecurity": {
      "score": 85,
      "grade": "B",
      "summary": {...},
      "findings": [...],
      "scanDuration": "7.42"
    },
    
    "webSecurity": {
      "score": 71,
      "grade": "C",
      "summary": {...},
      "findings": [...],
      "scanDuration": "0.64"
    },
    
    "correlatedIssues": [
      {
        "type": "critical",
        "category": "Secret Exposure Chain",
        "title": "Exposed Secrets + Missing Web Protection",
        "plainEnglish": "You have passwords/API keys visible in your code, and your website is missing a security feature that could prevent attackers from stealing them. This is a dangerous combination!",
        "risk": "Attackers could steal your secrets and use them to compromise your entire application",
        "fix": "1. Remove all secrets from code immediately\n2. Add CSP header to your website\n3. Use environment variables for all sensitive data\n4. Rotate all exposed credentials",
        "severity": "critical"
      }
    ],
    
    "allFindings": [...],
    
    "recommendations": [
      {
        "priority": "URGENT",
        "action": "Fix 1 critical issue immediately",
        "reason": "Critical vulnerabilities can be exploited right now to compromise your app"
      },
      {
        "priority": "URGENT",
        "action": "Address correlated security issues first",
        "reason": "Combined vulnerabilities create a dangerous attack chain"
      }
    ],
    
    "totalScanDuration": "8.15",
    "scannedAt": "2025-10-22T12:00:00.000Z"
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid GitHub URL. Please provide a GitHub repository URL (e.g., https://github.com/owner/repo)"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "An unexpected error occurred during scanning"
}
```

---

## Example Usage

### cURL Examples

**GitHub Scan:**
```bash
curl -X POST http://localhost:3000/api/v1/scan/github \
  -H "Content-Type: application/json" \
  -d '{"url":"https://github.com/owner/repo"}'
```

**Web Scan:**
```bash
curl -X POST http://localhost:3000/api/v1/scan/web \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

**Full Application Scan:**
```bash
curl -X POST http://localhost:3000/api/v1/scan/full \
  -H "Content-Type: application/json" \
  -d '{
    "githubUrl":"https://github.com/owner/repo",
    "webUrl":"https://example.com"
  }'
```

### JavaScript (fetch) Examples

**Full Application Scan:**
```javascript
const response = await fetch('http://localhost:3000/api/v1/scan/full', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    githubUrl: 'https://github.com/owner/repo',
    webUrl: 'https://example.com'
  })
});

const data = await response.json();
console.log(`Overall Score: ${data.data.overallScore}`);
console.log(`Grade: ${data.data.overallGrade}`);
console.log(`Correlated Issues: ${data.data.correlatedIssues.length}`);
```

---

## Features

### Scoring System
- **Score Range:** 0-100
- **Grading:**
  - A: 90-100 (Excellent)
  - B: 80-89 (Great)
  - C: 70-79 (Good)
  - D: 60-69 (Needs Improvement)
  - F: 0-59 (Urgent Action Required)

### Severity Weights
- **Critical:** -25 points each
- **High:** -15 points each
- **Medium:** -5 points each
- **Low:** -1 point each

### Combined Scan Weighting
- **Code Security:** 60% (code vulnerabilities are typically more critical)
- **Web Security:** 40% (live application security)

### Correlated Issues Detection
The full scan automatically detects dangerous combinations:
- **Secret Exposure Chain:** Secrets in code + Missing CSP on web
- **Vulnerable Stack:** Outdated dependencies + No HTTPS
- **Defense Gaps:** Config exposure + Missing security headers

---

## Deep Scan Endpoints (Coming Soon)

### 1. Deep GitHub Repository Scan
**Endpoint:** `POST /scan/deep/github`

**Status:** 🚧 Coming Soon (Q1 2025)

**Description:** Advanced GitHub repository scanning with Nuclei vulnerability detection.

**Response:**
```json
{
  "success": false,
  "message": "Deep Scan feature coming soon! This will include advanced vulnerability scanning with Nuclei.",
  "feature": "Deep GitHub Scan",
  "status": "coming_soon",
  "estimated_release": "Q1 2025"
}
```

### 2. Deep Web Application Scan
**Endpoint:** `POST /scan/deep/web`

**Status:** 🚧 Coming Soon (Q1 2025)

**Description:** Advanced web application scanning with Nuclei vulnerability detection.

### 3. Deep Full Application Scan
**Endpoint:** `POST /scan/deep/full`

**Status:** 🚧 Coming Soon (Q1 2025)

**Description:** Comprehensive security scanning with Nuclei and correlation analysis.

---

## Rate Limits
- **Quick Scan:** 2 scans per minute per IP
- **Deep Scan:** Coming with paid tier

---

## Support
For questions or issues, contact: [Your Contact Info]

---

## Changelog

### v1.2.0 (Current)
- ✅ Reorganized API structure: Quick Scan (Free) vs Deep Scan (Paid)
- ✅ Moved Nuclei to Deep Scan (coming soon)
- ✅ Updated all endpoints to `/scan/quick/*` and `/scan/deep/*`
- ✅ Added "Coming Soon" responses for Deep Scan features
- ✅ Improved scan speed by removing Nuclei from Quick Scan

### v1.1.0
- ✅ Added `/scan/full` endpoint for combined GitHub + Web scanning
- ✅ Implemented correlated security issue detection
- ✅ Added smart recommendations system
- ✅ Unified scoring across code and web layers

### v1.0.0
- ✅ Initial release with `/scan/github` and `/scan/web` endpoints
- ✅ Plain-English security explanations
- ✅ Security scoring system

