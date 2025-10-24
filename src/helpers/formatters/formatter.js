// Response Formatter - Makes scan results non-tech friendly with scoring

export const formatScanResults = (scanData) => {
  const { type, results } = scanData;

  if (type === 'github') {
    return formatGitHubScan(results);
  } else if (type === 'expert-github') {
    return formatExpertGitHubScan(results);
  } else if (type === 'web') {
    return formatWebScan(results);
  }

  return results;
};

const formatExpertGitHubScan = (results) => {
  const allFindings = [];
  const summary = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };

  // Process Secrets
  if (results.secrets && results.secrets.length > 0) {
    results.secrets.forEach(secret => {
      const severity = secret.verified ? 'critical' : 'high';
      const formatted = {
        category: 'Secrets',
        severity: severity,
        title: `${secret.type} Secret Found`,
        description: secret.verified ? 'Verified secret detected' : 'Potential secret detected',
        file: secret.file,
        line: secret.line,
        plainEnglish: secret.verified 
          ? `🚨 CRITICAL: You have a verified ${secret.type} secret in your code. This is ACTIVE and working - hackers could use it right now!`
          : `⚠️ You have a potential ${secret.type} secret in your code. This needs immediate attention.`,
        risk: secret.verified 
          ? 'This secret is ACTIVE and working. Hackers could use it right now!'
          : 'This looks like a real secret that could be exploited.',
        fix: `1. Delete this secret from ${secret.file}\n2. Rotate/change it in ${secret.type}\n3. Use environment variables instead\n4. Add the file to .gitignore`,
        verified: secret.verified,
        confidence: secret.confidence
      };
      
      allFindings.push(formatted);
      summary[severity]++;
    });
  }

  // Process Vulnerabilities (SAST)
  if (results.vulnerabilities && results.vulnerabilities.length > 0) {
    results.vulnerabilities.forEach(vuln => {
      const formatted = {
        category: 'Code Vulnerabilities',
        severity: vuln.severity,
        title: vuln.title,
        description: vuln.description,
        file: vuln.file,
        line: vuln.line,
        plainEnglish: `Security scanner found: ${vuln.title}. This is a known vulnerability that needs attention.`,
        risk: 'Could be exploited by attackers to compromise your application',
        fix: vuln.fix || 'Review the code and apply recommended security practices',
        cwe: vuln.cwe,
        owasp: vuln.owasp,
        confidence: vuln.confidence
      };
      
      allFindings.push(formatted);
      summary[vuln.severity]++;
    });
  }

  // Process Dependencies
  if (results.dependencies && results.dependencies.length > 0) {
    results.dependencies.forEach(dep => {
      const formatted = {
        category: 'Dependencies',
        severity: dep.severity,
        title: `Vulnerable Package: ${dep.package}`,
        description: dep.vulnerability || 'Known vulnerability in dependency',
        file: dep.file || 'package files',
        line: dep.line || 0,
        plainEnglish: `You're using an outdated version of ${dep.package} that has known security problems. It's like using a lock with a known weakness.`,
        risk: 'Attackers could exploit this vulnerability to hack your app.',
        fix: dep.fixAvailable 
          ? `Update this package as soon as possible. Run: ${dep.packageManager} update ${dep.package}`
          : 'Review dependency tree and consider alternatives',
        package: dep.package,
        currentVersion: dep.version,
        packageManager: dep.packageManager,
        cve: dep.cve,
        url: dep.url
      };
      
      allFindings.push(formatted);
      summary[dep.severity]++;
    });
  }

  // Process Code Issues
  if (results.codeIssues && results.codeIssues.length > 0) {
    results.codeIssues.forEach(issue => {
      const formatted = {
        category: 'Code Quality',
        severity: issue.severity,
        title: issue.message,
        description: issue.message,
        file: issue.file,
        line: issue.line,
        plainEnglish: `Code quality issue: ${issue.message}. This could lead to security problems.`,
        risk: 'This code pattern could lead to security vulnerabilities',
        fix: getCodeIssueFix(issue.category, issue.message),
        code: issue.code,
        category: issue.category
      };
      
      allFindings.push(formatted);
      summary[issue.severity]++;
    });
  }

  // Process Licenses
  if (results.licenses && results.licenses.length > 0) {
    results.licenses.forEach(license => {
      const formatted = {
        category: 'Licenses',
        severity: 'low',
        title: `License: ${license.type}`,
        description: `License information found in ${license.file}`,
        file: license.file,
        line: 0,
        plainEnglish: `Your project uses the ${license.type} license. Make sure you understand the legal implications.`,
        risk: 'License compliance issues could have legal consequences',
        fix: 'Review license terms and ensure compliance with your use case',
        licenseType: license.type,
        scope: license.scope
      };
      
      allFindings.push(formatted);
      summary.low++;
    });
  }

  // Calculate security score using expert's risk scoring
  const score = calculateExpertSecurityScore(results.summary, allFindings.length);

  return {
    score,
    grade: getGrade(score),
    summary: {
      total: allFindings.length,
      critical: summary.critical,
      high: summary.high,
      medium: summary.medium,
      low: summary.low
    },
    message: getExpertOverallMessage(score, results.summary),
    findings: allFindings.sort((a, b) => getSeverityWeight(b.severity) - getSeverityWeight(a.severity)),
    scannedAt: new Date().toISOString(),
    expertInsights: {
      verifiedSecrets: results.summary.verifiedSecrets,
      criticalVulnerabilities: results.summary.criticalVulnerabilities,
      riskScore: results.summary.riskScore,
      totalSecrets: results.summary.totalSecrets,
      totalVulnerabilities: results.summary.totalVulnerabilities,
      dependencyIssues: results.summary.dependencyIssues,
      codeIssues: results.summary.codeIssues,
      licenses: results.summary.licenses
    }
  };
};

const formatGitHubScan = (results) => {
  const allFindings = [];
  const summary = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };

  // Process TruffleHog results
  if (results.trufflehog.findings && results.trufflehog.findings.length > 0) {
    results.trufflehog.findings.forEach(finding => {
      const formatted = {
        category: 'Secrets',
        severity: finding.Verified ? 'critical' : 'high',
        title: `${finding.DetectorName} Secret Found`,
        description: `Found a ${finding.DetectorName} secret in your code`,
        file: finding.SourceMetadata?.Data?.Filesystem?.file || 'Unknown',
        line: finding.SourceMetadata?.Data?.Filesystem?.line || 0,
        plainEnglish: `You have a ${finding.DetectorName} API key or password in your code. This is like leaving your house key under the doormat - anyone can find it!`,
        risk: finding.Verified ? 'This secret is ACTIVE and working. Hackers could use it right now!' : 'This looks like a real secret that could be exploited.',
        fix: `1. Delete this secret from the file\n2. Rotate/change it in ${finding.DetectorName}\n3. Use environment variables instead\n4. Add the file to .gitignore`,
        verified: finding.Verified
      };
      
      allFindings.push(formatted);
      summary[formatted.severity]++;
    });
  }

// Process Gitleaks results  
if (results.gitleaks && results.gitleaks.findings && results.gitleaks.findings.length > 0) {
  results.gitleaks.findings.forEach(finding => {
    const formatted = {
      category: 'Secrets',
      severity: getSeverityFromGitleaks(finding.rule), // Changed from finding.RuleID
      title: `Exposed Secret: ${finding.rule}`, // Changed from finding.RuleID
      description: finding.description || 'Secret detected in code',
      file: finding.file, // Changed from finding.File
      line: finding.line, // Changed from finding.StartLine
      plainEnglish: `There's a password or API key visible in your ${finding.file} file. Think of it like writing your bank password on a sticky note!`,
      risk: 'Anyone with access to this code can steal and misuse this secret.',
      fix: `1. Remove the secret from ${finding.file}\n2. Generate a new secret/key\n3. Store it in environment variables (.env file)\n4. Never commit secrets to code again`
    };
    
    allFindings.push(formatted);
    summary[formatted.severity]++;
  });
}

  // Process Config Exposure results
  if (results.config.findings && results.config.findings.length > 0) {
    results.config.findings.forEach(finding => {
      const formatted = {
        category: 'Configuration',
        severity: finding.severity,
        title: finding.type,
        description: finding.description,
        file: finding.file,
        line: finding.line,
        plainEnglish: translateConfigToPlainEnglish(finding.type),
        risk: finding.description,
        fix: finding.recommendation
      };
      
      allFindings.push(formatted);
      summary[finding.severity]++;
    });
  }

  // Process Dependency results
  if (results.dependencies && results.dependencies.vulnerabilities.length > 0) {
    results.dependencies.vulnerabilities.forEach(vuln => {
      const formatted = {
        category: 'Dependencies',
        severity: vuln.severity,
        title: `Vulnerable Package: ${vuln.package}`,
        description: vuln.title,
        plainEnglish: `You're using an outdated version of ${vuln.package} that has known security problems. It's like using a lock with a known weakness.`,
        risk: 'Attackers could exploit this vulnerability to hack your app.',
        fix: vuln.recommendation,
        package: vuln.package,
        currentVersion: vuln.currentVersion
      };
      
      allFindings.push(formatted);
      summary[vuln.severity]++;
    });
  }

  // Calculate security score (0-100)
  const score = calculateSecurityScore(summary, allFindings.length);

  return {
    score,
    grade: getGrade(score),
    summary: {
      total: allFindings.length,
      critical: summary.critical,
      high: summary.high,
      medium: summary.medium,
      low: summary.low
    },
    message: getOverallMessage(score, summary),
    findings: allFindings.sort((a, b) => getSeverityWeight(b.severity) - getSeverityWeight(a.severity)),
    scannedAt: new Date().toISOString()
  };
};

const formatWebScan = (results) => {
  const allFindings = [];
  const summary = {
    critical: results.summary?.critical || 0,
    high: results.summary?.high || 0,
    medium: results.summary?.medium || 0,
    low: results.summary?.low || 0
  };

  // Combine all web scan findings
  const categories = [
    { key: 'securityHeaders', category: 'Security Headers' },
    { key: 'cors', category: 'CORS Configuration' },
    { key: 'ssl', category: 'SSL/TLS' },
    { key: 'cookies', category: 'Cookie Security' },
    { key: 'misconfiguration', category: 'Misconfiguration' }
  ];

  categories.forEach(({ key, category }) => {
    if (results[key] && results[key].length > 0) {
      results[key].forEach(finding => {
        allFindings.push({
          category,
          severity: finding.severity,
          title: finding.name,
          description: finding.description,
          plainEnglish: translateWebFindingToPlainEnglish(finding, category),
          risk: finding.risk,
          fix: finding.recommendation
        });
      });
    }
  });

  // Add Nuclei findings if available
  if (results.nuclei && results.nuclei.length > 0) {
    results.nuclei.forEach(finding => {
      allFindings.push({
        category: 'Vulnerabilities',
        severity: finding.severity,
        title: finding.name,
        description: finding.description,
        plainEnglish: `Security scanner found: ${finding.name}. This is a known vulnerability that needs attention.`,
        risk: 'Could be exploited by attackers',
        fix: finding.recommendation
      });
      
      summary[finding.severity] = (summary[finding.severity] || 0) + 1;
    });
  }

  const score = calculateSecurityScore(summary, allFindings.length);

  return {
    score,
    grade: getGrade(score),
    url: results.url,
    summary: {
      total: allFindings.length,
      critical: summary.critical,
      high: summary.high,
      medium: summary.medium,
      low: summary.low
    },
    message: getOverallMessage(score, summary),
    findings: allFindings.sort((a, b) => getSeverityWeight(b.severity) - getSeverityWeight(a.severity)),
    scannedAt: results.timestamp || new Date().toISOString()
  };
};

const calculateSecurityScore = (summary, totalFindings) => {
  if (totalFindings === 0) return 100;

  // Weight different severities
  const weights = {
    critical: 25,
    high: 15,
    medium: 5,
    low: 1
  };

  const totalPenalty = 
    (summary.critical * weights.critical) +
    (summary.high * weights.high) +
    (summary.medium * weights.medium) +
    (summary.low * weights.low);

  const score = Math.max(0, 100 - totalPenalty);
  return Math.round(score);
};

const getGrade = (score) => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

const getSeverityWeight = (severity) => {
  const weights = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
  return weights[severity] || 0;
};

const getSeverityFromGitleaks = (ruleId) => {
  // Add null/undefined check
  if (!ruleId || typeof ruleId !== 'string') {
    return 'medium'; // Default to medium if ruleId is invalid
  }
  
  const criticalPatterns = ['aws', 'stripe-secret', 'private-key', 'mongodb', 'postgres'];
  const highPatterns = ['api-key', 'firebase', 'github', 'openai'];
  
  const rule = ruleId.toLowerCase();
  if (criticalPatterns.some(p => rule.includes(p))) return 'critical';
  if (highPatterns.some(p => rule.includes(p))) return 'high';
  return 'medium';
};

const getOverallMessage = (score, summary) => {
  if (score >= 90) {
    return "Great job! Your app is pretty secure. Just a few minor things to improve.";
  } else if (score >= 70) {
    return "Good start, but there are some security issues to fix. Let's make your app safer!";
  } else if (score >= 50) {
    return "Your app has several security problems. Don't worry - they're fixable! Let's tackle them.";
  } else if (summary.critical > 0) {
    return "⚠️ URGENT: Your app has critical security issues that need immediate attention!";
  } else {
    return "Your app needs security improvements. Let's fix these issues to keep you safe.";
  }
};

const translateConfigToPlainEnglish = (type) => {
  const translations = {
    'AWS Access Key': 'Your Amazon Web Services password is visible in the code',
    'Firebase API Key': 'Your Firebase (Google) database key is exposed',
    'Stripe Secret Key': 'Your payment processing key is visible - this is VERY dangerous!',
    'MongoDB Connection String': 'Your database login information is exposed',
    'GitHub Token': 'Your GitHub password/token is visible',
    'OpenAI API Key': 'Your AI API key is exposed'
  };
  
  return translations[type] || `A secret ${type} was found in your code`;
};

const translateWebFindingToPlainEnglish = (finding, category) => {
  if (category === 'Security Headers') {
    return `Your website is missing a security setting (${finding.name}) that protects against attacks. Think of it like forgetting to lock a door.`;
  } else if (category === 'CORS Configuration') {
    return `Your website allows ANY other website to access it. This is like leaving your front door wide open for anyone to walk in.`;
  } else if (category === 'SSL/TLS') {
    return `Your website doesn't use HTTPS encryption. Everything sent between users and your site can be seen by hackers. It's like sending postcards instead of sealed letters.`;
  } else if (category === 'Cookie Security') {
    return `Your cookies (user login data) aren't properly protected. Hackers could steal them and impersonate users.`;
  } else if (category === 'Misconfiguration') {
    return `Your website has some settings that could help hackers understand how to attack it.`;
  }
  
  return finding.description;
};

// Expert formatter helper functions
const calculateExpertSecurityScore = (summary, totalFindings) => {
  if (totalFindings === 0) return 100;

  // Use the expert's risk scoring system
  const riskScore = summary.riskScore || 0;
  const score = Math.max(0, 100 - riskScore);
  return Math.round(score);
};

const getExpertOverallMessage = (score, summary) => {
  if (score >= 90) {
    return "🛡️ Excellent! Your code is very secure. Just a few minor improvements needed.";
  } else if (score >= 80) {
    return "✅ Good security posture! Some issues to address but you're on the right track.";
  } else if (score >= 70) {
    return "⚠️ Your code has several security issues that need attention. Let's fix them!";
  } else if (score >= 50) {
    return "🚨 Multiple security problems detected. Immediate action required!";
  } else if (summary.verifiedSecrets > 0) {
    return "🔥 CRITICAL: Verified secrets found! Your app is compromised - fix immediately!";
  } else {
    return "💀 Your code has serious security vulnerabilities. Immediate professional help needed!";
  }
};

const getCodeIssueFix = (category, message) => {
  const fixes = {
    'Code Injection': 'Use safe alternatives to eval() and exec(). Validate all inputs.',
    'Command Injection': 'Use parameterized commands and validate all inputs.',
    'XSS': 'Use textContent instead of innerHTML. Validate and sanitize all user inputs.',
    'SQL Injection': 'Use parameterized queries or prepared statements.',
    'Weak Cryptography': 'Use strong cryptographic algorithms like SHA-256 or better.',
    'Information Disclosure': 'Remove debug code and sensitive information from production.',
    'Hardcoded Secrets': 'Use environment variables and secure secret management.'
  };
  
  return fixes[category] || 'Review the code and apply security best practices.';
};


