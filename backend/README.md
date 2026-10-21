# 🦅 Raptor - Security Scanner for Vibe-Coded Apps

> Making app security accessible for solo developers and non-tech builders

[![MVP](https://img.shields.io/badge/Status-MVP%20Complete-success)]()
[![API](https://img.shields.io/badge/API-v1-blue)]()
[![License](https://img.shields.io/badge/License-ISC-green)]()

## 🎯 What is Raptor?

Raptor is an AI-enhanced vulnerability scanner designed for **vibe-coders** - solo developers, new builders, and non-tech entrepreneurs who build apps quickly with AI/no-code tools.

**The Problem:** Traditional security tools are complex, jargon-heavy, and built for enterprise teams.

**Raptor's Solution:** Plain-English security scanning with one-click fixes.

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+ 
- Docker Desktop (running)
- npm or yarn

### Installation

```bash
# Clone the repo
git clone https://github.com/yourname/raptor.git
cd raptor

# Install dependencies
npm install

# Create environment file
echo "PORT=3000" > .env.local

# Start the server
npm start
```

Server runs at `http://localhost:3000`

---

## 🔥 Features

### **GitHub Repository Scanning**
- 🔍 Secret detection (API keys, passwords, tokens)
- 📦 Dependency vulnerabilities (CVEs)
- ⚙️ Config exposure (AWS, Firebase, Stripe)
- 🎯 Auto-detects main/master branch
- ⚡ Fast (7-40 seconds)

### **Web Application Scanning**
- 🛡️ Security headers analysis
- 🌐 CORS misconfiguration detection
- 🔒 SSL/TLS validation
- 🍪 Cookie security
- 🚨 Advanced vulnerability detection (Nuclei)

### **User-Friendly Output**
- 📊 Security score (0-100)
- 🎓 Letter grades (A-F)
- 💬 Plain English explanations
- 🔧 Copy-paste fixes
- ⚠️ Severity-based sorting

---

## 📡 API Reference

### Scan GitHub Repository

```http
POST /api/v1/scan/github
Content-Type: application/json

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
      "total": 3,
      "critical": 0,
      "high": 1,
      "medium": 2,
      "low": 0
    },
    "message": "Good start, but there are some security issues to fix.",
    "findings": [
      {
        "category": "Secrets",
        "severity": "high",
        "title": "Firebase API Key Exposed",
        "plainEnglish": "Your Firebase (Google) database key is visible in the code",
        "risk": "Anyone can access your database",
        "fix": "Move to environment variables and regenerate the key",
        "file": "config.js",
        "line": 45
      }
    ],
    "scanDuration": "7.24"
  }
}
```

### Scan Web Application

```http
POST /api/v1/scan/web
Content-Type: application/json

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
    "score": 57,
    "grade": "F",
    "summary": {
      "total": 7,
      "critical": 0,
      "high": 2,
      "medium": 2,
      "low": 3
    },
    "findings": [...],
    "scanDuration": "74.30"
  }
}
```

---

## 🧪 Testing

### Using curl:

```bash
# Test GitHub scanner
curl -X POST http://localhost:3000/api/v1/scan/github \
  -H "Content-Type: application/json" \
  -d '{"url":"https://github.com/json604/lockyourmoney"}'

# Test Web scanner
curl -X POST http://localhost:3000/api/v1/scan/web \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

### Using Postman:
Import the collection (coming soon) or manually test the endpoints above.

---

## 🏗️ Architecture

### Tech Stack
- **Backend:** Node.js, Express 5
- **Scanners:** TruffleHog, Gitleaks, Nuclei, npm audit
- **Format:** ES6 Modules
- **Deployment:** Vercel-ready

### Project Structure
```
raptor/
├── src/
│   ├── app.js              # Express app
│   ├── config/             # Environment config
│   ├── controllers/        # Request handlers
│   ├── services/           # Business logic
│   ├── helpers/            # Scanner integrations
│   ├── routes/             # API routes
│   └── middlewares/        # Error handling
├── .env.local              # Environment variables
├── package.json
└── README.md
```

---

## 🔐 Security Scanners Used

| Tool | Purpose | Integration |
|------|---------|-------------|
| **TruffleHog** | Find secrets in code | Docker container |
| **Gitleaks** | Detect hardcoded credentials | Docker container |
| **Nuclei** | Web vulnerability scanning | Docker container |
| **npm audit** | Dependency vulnerabilities | Native npm |
| **Custom** | Config exposure, headers | Built-in |

---

## 📊 Performance

| Scan Type | Average Time | Status |
|-----------|--------------|--------|
| Small GitHub repo | 7-10 seconds | ✅ Fast |
| Large GitHub repo | 30-40 seconds | ✅ Good |
| Web (basic checks) | 1-2 seconds | ✅ Very fast |
| Web (with Nuclei) | 60-90 seconds | ⚠️ Thorough |

---

## 🎯 Raptor vs. Others

| Feature | Raptor | Snyk | SecureVibing |
|---------|--------|------|--------------|
| Plain English | ✅ | ❌ | ⚠️ Partial |
| Non-tech friendly | ✅ | ❌ | ✅ |
| Free tier | ✅ | Limited | ✅ |
| Code + Web scanning | ✅ | Code only | Web only |
| One-click fixes | ✅ | ❌ | ❌ |
| Freemium viable | ✅ | ❌ | ✅ |

---

## 🚀 Roadmap

### ✅ MVP (Done)
- [x] GitHub scanning
- [x] Web scanning
- [x] Plain English formatting
- [x] Security scoring
- [x] API endpoints

### 🎨 Next (Week 2)
- [ ] React dashboard
- [ ] Scan history
- [ ] Rate limiting
- [ ] Better error messages

### 🧠 Future (Week 3+)
- [ ] AI-powered explanations (OpenAI/Claude)
- [ ] Multi-language support
- [ ] PDF reports
- [ ] Integrations (Bubble, Vercel, Netlify)
- [ ] Continuous monitoring

---

## 💡 Use Cases

### Solo Developers
"I built a SaaS in a weekend - is it secure?"

### No-Code Builders
"My Bubble app uses Firebase - am I exposed?"

### New Devs
"I'm learning to code - what security mistakes am I making?"

### Agencies
"Quick security audit for client projects"

---

## 🤝 Contributing

This is an MVP for Delta application. Feedback welcome!

1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📝 License

ISC License - See LICENSE file

---

## 👤 Author

**Kartikey** (json604)
- Building security tools for vibe-coders
- Applying to Delta residency
- [@json604](https://x.com/json604)

---

## 🙏 Acknowledgments

- TruffleHog by TruffleSecurity
- Gitleaks by Zach Rice
- Nuclei by ProjectDiscovery
- Inspired by the vibe-coding movement

---

## 📞 Support

- 🐛 Issues: [GitHub Issues](https://github.com/yourname/raptor/issues)
- 💬 Questions: Open an issue
- 🐦 Updates: [@json604](https://x.com/json604)

---

**Built with ❤️ for the vibe-coding community**

🦅 Raptor - Because security shouldn't be scary


