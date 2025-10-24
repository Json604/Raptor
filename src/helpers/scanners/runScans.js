import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { glob } from "glob";

// Environment detection: Use Docker locally, native binaries on Railway/production
const USE_DOCKER = process.env.USE_DOCKER === 'true';

console.log(`🔧 Scan mode: ${USE_DOCKER ? 'Docker' : 'Native Binaries'}`);

// Enhanced TruffleHog - Scans ALL files for secrets with comprehensive patterns
export const runTruffleHog = async (repoPath) => {
  console.log('🔍 Running comprehensive TruffleHog scan on entire repository...');
  
  const results = {
    findings: [],
    summary: {
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    },
    detectors: {},
    fileTypes: {},
    directories: {},
    confidence: {
      high: 0,
      medium: 0,
      low: 0
    }
  };

  try {
    // 1. Find all files to scan (exclude binary files and large files)
    const filesToScan = await findScannableFiles(repoPath);
    console.log(`📁 Found ${filesToScan.length} files to scan`);

    // 2. Run TruffleHog with enhanced configuration
    const truffleHogResults = await runTruffleHogScan(repoPath);
    
    // 3. Run additional custom secret detection
    const customResults = await runCustomSecretDetection(filesToScan, repoPath);
    
    // 4. Merge and analyze results
    results.findings = [...truffleHogResults, ...customResults];
    results.summary = calculateSecretSummary(results.findings);
    results.detectors = analyzeByDetector(results.findings);
    results.fileTypes = analyzeByFileType(results.findings);
    results.directories = analyzeByDirectory(results.findings);
    results.confidence = analyzeByConfidence(results.findings);

    console.log(`📊 TruffleHog found ${results.summary.total} potential secrets`);
    console.log(`📊 Critical: ${results.summary.critical}, High: ${results.summary.high}, Medium: ${results.summary.medium}`);

  } catch (error) {
    console.error('❌ Error in TruffleHog scan:', error.message);
  }

  return results;
};

// Enhanced Gitleaks - Scans ALL files for secrets with comprehensive rules
export const runGitleaks = async (repoPath) => {
  console.log('🔍 Running comprehensive Gitleaks scan on entire repository...');
  
  const results = {
    findings: [],
    summary: {
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    },
    rules: {},
    fileTypes: {},
    directories: {},
    confidence: {
      high: 0,
      medium: 0,
      low: 0
    }
  };

  try {
    // 1. Find all files to scan
    const filesToScan = await findScannableFiles(repoPath);
    console.log(`📁 Found ${filesToScan.length} files to scan`);

    // 2. Run Gitleaks with enhanced configuration
    const gitleaksResults = await runGitleaksScan(repoPath);
    
    // 3. Run additional custom secret detection
    const customResults = await runCustomSecretDetection(filesToScan, repoPath);
    
    // 4. Merge and analyze results
    results.findings = [...gitleaksResults, ...customResults];
    results.summary = calculateSecretSummary(results.findings);
    results.rules = analyzeByRule(results.findings);
    results.fileTypes = analyzeByFileType(results.findings);
    results.directories = analyzeByDirectory(results.findings);
    results.confidence = analyzeByConfidence(results.findings);

    console.log(`📊 Gitleaks found ${results.summary.total} potential secrets`);
    console.log(`📊 Critical: ${results.summary.critical}, High: ${results.summary.high}, Medium: ${results.summary.medium}`);

  } catch (error) {
    console.error('❌ Error in Gitleaks scan:', error.message);
  }

  return results;
};

// Find all scannable files (exclude binary files, large files, etc.)
const findScannableFiles = async (repoPath) => {
  const patterns = [
    '**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx',
    '**/*.py', '**/*.java', '**/*.php', '**/*.rb',
    '**/*.go', '**/*.rs', '**/*.cpp', '**/*.c',
    '**/*.h', '**/*.cs', '**/*.swift', '**/*.kt',
    '**/*.scala', '**/*.sh', '**/*.bash', '**/*.zsh',
    '**/*.fish', '**/*.ps1', '**/*.bat', '**/*.cmd',
    '**/*.json', '**/*.yaml', '**/*.yml', '**/*.toml',
    '**/*.ini', '**/*.conf', '**/*.cfg', '**/*.xml',
    '**/*.properties', '**/*.env*', '**/*.config*',
    '**/*.settings*', '**/*.secrets*', '**/*.credentials*',
    '**/*.auth*', '**/*.key*', '**/*.cert*', '**/*.pem',
    '**/*.p12', '**/*.pfx', '**/*.jks', '**/*.keystore',
    '**/*.truststore', '**/*.sql', '**/*.md', '**/*.txt',
    '**/*.log', '**/*.dockerfile*', '**/*.Dockerfile*',
    '**/*.tf', '**/*.tfvars', '**/*.hcl', '**/*.nomad',
    '**/*.consul', '**/*.vault'
  ];

  const files = await glob(patterns, { 
    cwd: repoPath,
    ignore: [
      '**/node_modules/**', '**/dist/**', '**/build/**',
      '**/.git/**', '**/target/**', '**/venv/**',
      '**/env/**', '**/.venv/**', '**/vendor/**',
      '**/__pycache__/**', '**/.pytest_cache/**',
      '**/coverage/**', '**/.nyc_output/**',
      '**/logs/**', '**/tmp/**', '**/temp/**',
      '**/.cache/**', '**/.next/**', '**/.nuxt/**',
      '**/.vuepress/**', '**/.docusaurus/**',
      '**/out/**', '**/.output/**', '**/.vercel/**',
      '**/.netlify/**', '**/bin/**', '**/obj/**',
      '**/packages/**', '**/libs/**', '**/lib/**'
    ]
  });

  // Filter out large files and binary files
  const scannableFiles = [];
  for (const file of files) {
    const fullPath = path.join(repoPath, file);
    try {
      const stats = fs.statSync(fullPath);
      // Skip files larger than 10MB
      if (stats.size > 10 * 1024 * 1024) {
        continue;
      }
      // Skip binary files
      if (isBinaryFile(fullPath)) {
        continue;
      }
      scannableFiles.push(fullPath);
    } catch (error) {
      // Skip files that can't be read
      continue;
    }
  }

  return scannableFiles;
};

// Check if file is binary
const isBinaryFile = (filePath) => {
  const binaryExtensions = [
    '.exe', '.dll', '.so', '.dylib', '.bin', '.dat',
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff',
    '.mp3', '.mp4', '.avi', '.mov', '.wmv', '.flv',
    '.zip', '.tar', '.gz', '.rar', '.7z', '.bz2',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt',
    '.pptx', '.odt', '.ods', '.odp', '.rtf',
    '.ico', '.cur', '.ani', '.bmp', '.tga', '.tiff',
    '.woff', '.woff2', '.ttf', '.eot', '.otf',
    '.class', '.jar', '.war', '.ear', '.apk', '.ipa',
    '.deb', '.rpm', '.msi', '.dmg', '.pkg'
  ];
  
  const ext = path.extname(filePath).toLowerCase();
  return binaryExtensions.includes(ext);
};

// Run TruffleHog scan with enhanced configuration
const runTruffleHogScan = async (repoPath) => {
  console.log('🔍 Running TruffleHog with enhanced configuration...');
  
  // Fixed TruffleHog command
const command = USE_DOCKER
  ? `docker run --rm -v ${repoPath}:/src trufflesecurity/trufflehog:latest filesystem /src --json --no-update`
  : `trufflehog filesystem ${repoPath} --json --no-update`;

  return new Promise((resolve, reject) => {
    exec(
      command,
      { maxBuffer: 1024 * 1024 * 100 }, // 100MB buffer for large scan results
      (err, stdout, stderr) => {
        if (err) {
          console.error('❌ TruffleHog error:', err.message);
          console.error('Stderr:', stderr);
          return reject(stderr || err.message);
        }

        console.log('✅ TruffleHog scan completed');
        console.log('Output length:', stdout?.length || 0);
        
        try {
          if (!stdout || !stdout.trim()) {
            console.log('📊 TruffleHog: No findings');
            resolve([]);
          } else {
            const lines = stdout.trim().split('\n').filter(line => line.trim());
            const results = [];
            
            for (const line of lines) {
              try {
                const parsed = JSON.parse(line);
                if (parsed.DetectorType !== undefined && !parsed.level) {
                  results.push({
                    detector: parsed.DetectorType,
                    severity: getSeverityFromDetector(parsed.DetectorType),
                    description: parsed.Description || 'Secret detected',
                    file: parsed.SourceMetadata?.Data?.Filesystem?.file || 'unknown',
                    line: parsed.SourceMetadata?.Data?.Filesystem?.line || 0,
                    match: parsed.Raw || '',
                    confidence: parsed.Verified ? 'high' : 'medium',
                    category: getCategoryFromDetector(parsed.DetectorType),
                    recommendation: getRecommendationFromDetector(parsed.DetectorType)
                  });
                }
              } catch (e) {
                console.warn('Skipping unparseable line:', line.substring(0, 100));
              }
            }
            
            console.log(`📊 TruffleHog found ${results.length} potential secrets`);
            resolve(results);
          }
        } catch (parseErr) {
          console.error('❌ Failed to parse TruffleHog output:', parseErr);
          reject(`Failed to parse TruffleHog output: ${parseErr}\nOutput was: ${stdout}`);
        }
      }
    );
  });
};

// Run Gitleaks scan with enhanced configuration
const runGitleaksScan = async (repoPath) => {
  console.log('🔍 Running Gitleaks with enhanced configuration...');
  
  const reportPath = `${repoPath}/gitleaks.json`;
  const command = USE_DOCKER
  ? `docker run --rm -v ${repoPath}:/repo zricethezav/gitleaks:latest detect --source=/repo --report-path=/repo/gitleaks.json --no-banner --no-git`
  : `gitleaks detect --source=${repoPath} --report-path=${reportPath} --no-banner --no-git`;

  return new Promise((resolve, reject) => {
    exec(
      command,
      { maxBuffer: 1024 * 1024 * 100 }, // 100MB buffer for large scan results
      (err, stdout, stderr) => {
        console.log('✅ Gitleaks scan completed');
        if (err) {
          console.log('⚠️  Gitleaks exit code:', err.code, '(code 1 means secrets found)');
        }
        
        try {
          if (fs.existsSync(`${repoPath}/gitleaks.json`)) {
            const reportJson = fs.readFileSync(`${repoPath}/gitleaks.json`, "utf8");
            const results = JSON.parse(reportJson);
            const findings = Array.isArray(results) ? results : [];
            
            const processedFindings = findings.map(finding => ({
              rule: finding.RuleID,
              severity: getSeverityFromRule(finding.RuleID),
              description: finding.Description || 'Secret detected',
              file: finding.File || 'unknown',
              line: finding.StartLine || 0,
              match: finding.Secret || '',
              confidence: finding.Verified ? 'high' : 'medium',
              category: getCategoryFromRule(finding.RuleID),
              recommendation: getRecommendationFromRule(finding.RuleID)
            }));
            
            console.log(`📊 Gitleaks found ${processedFindings.length} potential secrets`);
            resolve(processedFindings);
          } else {
            console.log('📊 Gitleaks: No findings (no report file)');
            resolve([]);
          }
        } catch (readErr) {
          console.error('❌ Failed to read Gitleaks report:', readErr);
          reject(`Failed to read Gitleaks report: ${readErr.message}`);
        }
      }
    );
  });
};

// Custom secret detection for additional patterns
const runCustomSecretDetection = async (files, repoPath) => {
  console.log('🔍 Running custom secret detection...');
  
  const findings = [];
  const customPatterns = {
    // Additional patterns not covered by TruffleHog/Gitleaks
    slack_webhook: {
      regex: /https:\/\/hooks\.slack\.com\/services\/[A-Z0-9]+\/[A-Z0-9]+\/[a-zA-Z0-9]+/g,
      name: "Slack Webhook URL",
      severity: "medium",
      description: "Slack webhook URL exposed"
    },
    discord_webhook: {
      regex: /https:\/\/discord\.com\/api\/webhooks\/[0-9]+\/[a-zA-Z0-9_-]+/g,
      name: "Discord Webhook URL",
      severity: "medium",
      description: "Discord webhook URL exposed"
    },
    github_webhook: {
      regex: /https:\/\/api\.github\.com\/repos\/[^\/]+\/[^\/]+\/hooks\/[0-9]+/g,
      name: "GitHub Webhook URL",
      severity: "low",
      description: "GitHub webhook URL exposed"
    },
    // Add more custom patterns as needed
  };

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(repoPath, file);
      
      for (const [key, pattern] of Object.entries(customPatterns)) {
        const matches = content.matchAll(pattern.regex);
        
        for (const match of matches) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          
          findings.push({
            detector: pattern.name,
            severity: pattern.severity,
            description: pattern.description,
            file: relativePath,
            line: lineNumber,
            match: match[0],
            confidence: 'medium',
            category: 'Webhook',
            recommendation: `Remove or secure this webhook URL`
          });
        }
      }
    } catch (error) {
      // Skip files that can't be read
      continue;
    }
  }

  console.log(`📊 Custom detection found ${findings.length} additional secrets`);
  return findings;
};

// Helper functions for severity mapping
const getSeverityFromDetector = (detector) => {
  const criticalDetectors = ['AWS', 'GCP', 'Azure', 'Stripe', 'GitHub', 'MongoDB', 'PostgreSQL'];
  const highDetectors = ['Firebase', 'OpenAI', 'Slack', 'Discord', 'JWT'];
  const mediumDetectors = ['Generic', 'API', 'Webhook'];
  
  if (criticalDetectors.some(d => detector.includes(d))) return 'critical';
  if (highDetectors.some(d => detector.includes(d))) return 'high';
  if (mediumDetectors.some(d => detector.includes(d))) return 'medium';
  return 'low';
};

const getSeverityFromRule = (rule) => {
  const criticalRules = ['aws-access-key', 'aws-secret-key', 'stripe-secret-key', 'github-token'];
  const highRules = ['firebase-api-key', 'openai-api-key', 'slack-token', 'discord-token'];
  const mediumRules = ['generic-api-key', 'webhook-url'];
  
  if (criticalRules.some(r => rule.includes(r))) return 'critical';
  if (highRules.some(r => rule.includes(r))) return 'high';
  if (mediumRules.some(r => rule.includes(r))) return 'medium';
  return 'low';
};

const getCategoryFromDetector = (detector) => {
  if (detector.includes('AWS') || detector.includes('GCP') || detector.includes('Azure')) return 'Cloud Provider';
  if (detector.includes('Stripe') || detector.includes('PayPal')) return 'Payment';
  if (detector.includes('GitHub') || detector.includes('GitLab')) return 'Version Control';
  if (detector.includes('MongoDB') || detector.includes('PostgreSQL') || detector.includes('MySQL')) return 'Database';
  if (detector.includes('JWT') || detector.includes('OAuth')) return 'Authentication';
  return 'Other';
};

const getCategoryFromRule = (rule) => {
  if (rule.includes('aws') || rule.includes('gcp') || rule.includes('azure')) return 'Cloud Provider';
  if (rule.includes('stripe') || rule.includes('paypal')) return 'Payment';
  if (rule.includes('github') || rule.includes('gitlab')) return 'Version Control';
  if (rule.includes('mongodb') || rule.includes('postgres') || rule.includes('mysql')) return 'Database';
  if (rule.includes('jwt') || rule.includes('oauth')) return 'Authentication';
  return 'Other';
};

const getRecommendationFromDetector = (detector) => {
  const recommendations = {
    'AWS': 'Remove AWS credentials immediately and rotate them in AWS IAM',
    'GCP': 'Remove GCP credentials immediately and rotate them in Google Cloud Console',
    'Stripe': 'Remove Stripe keys immediately and rotate them in Stripe Dashboard',
    'GitHub': 'Revoke GitHub token immediately and create a new one with minimal permissions',
    'MongoDB': 'Remove MongoDB connection string and use environment variables',
    'PostgreSQL': 'Remove PostgreSQL connection string and use environment variables'
  };
  
  return recommendations[detector] || 'Remove this secret and use environment variables';
};

const getRecommendationFromRule = (rule) => {
  const recommendations = {
    'aws-access-key': 'Remove AWS access key immediately and rotate it in AWS IAM',
    'aws-secret-key': 'Remove AWS secret key immediately and rotate it in AWS IAM',
    'stripe-secret-key': 'Remove Stripe secret key immediately and rotate it in Stripe Dashboard',
    'github-token': 'Revoke GitHub token immediately and create a new one with minimal permissions',
    'mongodb-uri': 'Remove MongoDB URI and use environment variables',
    'postgres-uri': 'Remove PostgreSQL URI and use environment variables'
  };
  
  return recommendations[rule] || 'Remove this secret and use environment variables';
};

// Analysis functions
const calculateSecretSummary = (findings) => {
  const summary = { total: 0, critical: 0, high: 0, medium: 0, low: 0 };
  
  findings.forEach(finding => {
    summary.total++;
    summary[finding.severity]++;
  });
  
  return summary;
};

const analyzeByDetector = (findings) => {
  const detectors = {};
  
  findings.forEach(finding => {
    const detector = finding.detector || finding.rule || 'Unknown';
    if (!detectors[detector]) {
      detectors[detector] = { count: 0, severity: {} };
    }
    detectors[detector].count++;
    detectors[detector].severity[finding.severity] = (detectors[detector].severity[finding.severity] || 0) + 1;
  });
  
  return detectors;
};

const analyzeByRule = (findings) => {
  const rules = {};
  
  findings.forEach(finding => {
    const rule = finding.rule || finding.detector || 'Unknown';
    if (!rules[rule]) {
      rules[rule] = { count: 0, severity: {} };
    }
    rules[rule].count++;
    rules[rule].severity[finding.severity] = (rules[rule].severity[finding.severity] || 0) + 1;
  });
  
  return rules;
};

const analyzeByFileType = (findings) => {
  const fileTypes = {};
  
  findings.forEach(finding => {
    const ext = path.extname(finding.file);
    if (!fileTypes[ext]) {
      fileTypes[ext] = { count: 0, severity: {} };
    }
    fileTypes[ext].count++;
    fileTypes[ext].severity[finding.severity] = (fileTypes[ext].severity[finding.severity] || 0) + 1;
  });
  
  return fileTypes;
};

const analyzeByDirectory = (findings) => {
  const directories = {};
  
  findings.forEach(finding => {
    const dir = path.dirname(finding.file);
    if (!directories[dir]) {
      directories[dir] = { count: 0, severity: {} };
    }
    directories[dir].count++;
    directories[dir].severity[finding.severity] = (directories[dir].severity[finding.severity] || 0) + 1;
  });
  
  return directories;
};

const analyzeByConfidence = (findings) => {
  const confidence = { high: 0, medium: 0, low: 0 };
  
  findings.forEach(finding => {
    confidence[finding.confidence]++;
  });
  
  return confidence;
};