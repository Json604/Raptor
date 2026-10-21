# 🦅 Raptor - AI-Enhanced Security Scanner for Modern Apps

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1.7-646CFF.svg)](https://vitejs.dev/)

> **Make app security accessible for non-tech builders and solo developers through AI-enhanced, plain-English vulnerability scanning.**

## 🎯 Mission

Raptor democratizes application security by providing instant, AI-powered vulnerability scanning with plain-English explanations. Built specifically for the new wave of app creators using no-code/low-code platforms, AI tools, and modern development frameworks.

## 🚀 Live Demo

- **Frontend**: [raptor.support](https://raptor.support) (React + TypeScript)
- **Backend API**: Production-ready Node.js/Express API
- **No Login Required**: Start scanning immediately

## ✨ Key Features

### 🔍 **Multi-Layer Security Scanning**
- **Secrets & API Keys**: Detects 100+ secret types (AWS, GitHub, Stripe, etc.)
- **Dependencies & CVEs**: Scans for vulnerable packages and known security flaws
- **Web Security Headers**: Analyzes 7 critical security headers
- **Advanced Vulnerabilities**: Nuclei integration for comprehensive web app scanning

### 🤖 **AI-Powered Explanations**
- **Plain-English Descriptions**: "Like forgetting to lock a door" instead of "CSP violation"
- **Contextual Recommendations**: AI understands your app type and provides relevant fixes
- **Step-by-Step Instructions**: Copy-paste solutions for immediate implementation

### ⚡ **Instant & Accessible**
- **No Setup Required**: Just paste your app URL and scan
- **Fast Results**: 0.64-2 seconds for web scans, 7-40 seconds for GitHub repos
- **Mobile-Responsive**: Works perfectly on all devices
- **Export Capabilities**: Download detailed reports in JSON format

## 🛠️ Tech Stack

### Frontend
- **React 19.1.1** with TypeScript
- **Vite** for fast development and building
- **React Router** for navigation
- **Lucide React** for beautiful icons
- **Motion** for smooth animations
- **CSS3** with modern styling

### Backend (Production Ready)
- **Node.js** with ES6 modules
- **Express.js** framework
- **TruffleHog** & **Gitleaks** for secret detection
- **Nuclei** for advanced vulnerability scanning
- **Docker** for security tool isolation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/raptor-frontend.git
cd raptor-frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Setup

Create a `.env` file in the root directory:

```env
VITE_BASE_URL=https://your-api-endpoint.com/api/v1
```

## 📱 Usage

### 1. **Web Application Scanning**
1. Visit the homepage
2. Paste your live app URL (e.g., https://myapp.vercel.app)
3. Click "Quick scan"
4. Get instant security report with AI explanations Content creators launching simple apps

### Secondary: Solo Developers
- Independent developers without security expertise
- English learners needing clear explanations
- Small teams without dedicated security resources

## 🔒 Security Features

### **4-Layer Scanning Architecture**

1. **Secrets & API Keys**
   - TruffleHog: 100+ secret types detection
   - Gitleaks: Hardcoded credentials scanning
   - Regex patterns for config files

2. **Dependencies & CVEs**
   - npm audit for Node.js packages
   - CVE database integration
   - Version vulnerability analysis

3. **Web Security Headers**
   - Content-Security-Policy (CSP)
   - X-Frame-Options
   - Strict-Transport-Security
   - X-Content-Type-Options
   - CORS configuration

4. **Advanced Vulnerabilities**
   - Nuclei integration (1000+ templates)
   - XSS, SQLi, misconfiguration detection
   - Server technology identification

### **Smart Scoring System**
- **Scale**: 0-100 points with letter grades (A-F)
- **Weights**: Critical (-25), High (-15), Medium (-5), Low (-1)
- **Grading**: A(90+), B(80+), C(70+), D(60+), F(<60)

## 🎨 UI/UX Features

### **Modern Design**
- Clean, intuitive interface
- Mobile-first responsive design
- Smooth animations and transitions
- Dark/light theme support

### **User Experience**
- **No Registration Required**: Start scanning immediately
- **Real-time Validation**: Instant URL validation with helpful error messages
- **Loading States**: Beautiful skeleton screens during scans
- **Error Handling**: User-friendly error messages with retry options

### **Results Display**
- **Visual Score Display**: Circular progress indicator with grade
- **Categorized Findings**: Organized by severity and category
- **AI Analysis Tabs**: Switch between friendly and technical explanations
- **Export Functionality**: Download detailed reports



This is the complete README file in markdown format that you can copy and save as `README.md` in your repository root. It includes all the sections with proper formatting, badges, code blocks, and emojis to make it visually appealing and professional.
