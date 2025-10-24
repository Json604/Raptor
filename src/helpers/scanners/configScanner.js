import fs from "fs";
import path from "path";
import { glob } from "glob";

// Enhanced Config Exposure Scanner - Finds ALL secrets across entire repository
export const scanConfigExposure = async (repoPath) => {
  console.log('🔍 Scanning for exposed configs and API keys across entire repository...');
  
  const results = {
    findings: [],
    summary: {
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    },
    fileTypes: {},
    directories: {},
    secretTypes: {},
    recommendations: []
  };

  try {
    // 1. Find ALL potential config files using glob patterns
    const configFiles = await findAllConfigFiles(repoPath);
    console.log(`📁 Found ${configFiles.length} potential config files to scan`);

    // 2. Scan each file for secrets
    for (const filePath of configFiles) {
      const findings = await scanFileForSecrets(filePath, repoPath);
      results.findings.push(...findings);
    }

    // 3. Analyze results and generate insights
    results.summary = calculateSecretSummary(results.findings);
    results.fileTypes = analyzeByFileType(results.findings);
    results.directories = analyzeByDirectory(results.findings);
    results.secretTypes = analyzeBySecretType(results.findings);
    results.recommendations = generateSecretRecommendations(results.findings);

    console.log(`📊 Found ${results.summary.total} potential secrets`);
    console.log(`📊 Critical: ${results.summary.critical}, High: ${results.summary.high}, Medium: ${results.summary.medium}`);

  } catch (error) {
    console.error('❌ Error in config scan:', error.message);
  }

  return results;
};

// Find ALL potential config files using powerful glob patterns
const findAllConfigFiles = async (repoPath) => {
  const patterns = [
    // Environment files
    '**/.env*',
    '**/.environment*',
    '**/environment*',
    '**/.env.local',
    '**/.env.development',
    '**/.env.production',
    '**/.env.staging',
    '**/.env.test',
    
    // Config files
    '**/config.*',
    '**/configuration.*',
    '**/settings.*',
    '**/secrets.*',
    '**/credentials.*',
    '**/auth.*',
    '**/database.*',
    '**/db.*',
    
    // Framework specific configs
    '**/firebase.*',
    '**/firebaseConfig.*',
    '**/next.config.*',
    '**/nuxt.config.*',
    '**/vite.config.*',
    '**/webpack.config.*',
    '**/rollup.config.*',
    '**/babel.config.*',
    '**/tailwind.config.*',
    '**/postcss.config.*',
    '**/eslint.config.*',
    '**/prettier.config.*',
    '**/jest.config.*',
    '**/cypress.config.*',
    '**/playwright.config.*',
    
    // Cloud provider configs
    '**/.aws/**',
    '**/aws.*',
    '**/.azure/**',
    '**/azure.*',
    '**/.gcp/**',
    '**/gcp.*',
    '**/.config/**',
    '**/cloud.*',
    
    // Database configs
    '**/database.*',
    '**/db.*',
    '**/mongo.*',
    '**/postgres.*',
    '**/mysql.*',
    '**/redis.*',
    
    // API configs
    '**/api.*',
    '**/endpoints.*',
    '**/routes.*',
    '**/services.*',
    
    // Docker and deployment
    '**/docker-compose.*',
    '**/Dockerfile*',
    '**/dockerfile*',
    '**/.dockerignore',
    '**/deploy.*',
    '**/deployment.*',
    '**/k8s.*',
    '**/kubernetes.*',
    '**/helm.*',
    
    // CI/CD configs
    '**/.github/**',
    '**/.gitlab-ci.*',
    '**/Jenkinsfile*',
    '**/azure-pipelines.*',
    '**/bitbucket-pipelines.*',
    '**/circle.*',
    '**/travis.*',
    '**/appveyor.*',
    
    // Mobile app configs
    '**/android.*',
    '**/ios.*',
    '**/app.json',
    '**/app.config.*',
    '**/expo.*',
    '**/react-native.*',
    
    // Source code files that might contain secrets
    '**/src/**/*.js',
    '**/src/**/*.ts',
    '**/src/**/*.jsx',
    '**/src/**/*.tsx',
    '**/app/**/*.js',
    '**/app/**/*.ts',
    '**/lib/**/*.js',
    '**/lib/**/*.ts',
    '**/utils/**/*.js',
    '**/utils/**/*.ts',
    '**/helpers/**/*.js',
    '**/helpers/**/*.ts',
    '**/services/**/*.js',
    '**/services/**/*.ts',
    '**/api/**/*.js',
    '**/api/**/*.ts',
    '**/routes/**/*.js',
    '**/routes/**/*.ts',
    '**/controllers/**/*.js',
    '**/controllers/**/*.ts',
    '**/middleware/**/*.js',
    '**/middleware/**/*.ts',
    
    // Python files
    '**/*.py',
    '**/requirements.txt',
    '**/Pipfile',
    '**/poetry.lock',
    
    // Java files
    '**/*.java',
    '**/*.properties',
    '**/application.*',
    '**/application.yml',
    '**/application.yaml',
    
    // PHP files
    '**/*.php',
    '**/composer.json',
    '**/composer.lock',
    
    // Ruby files
    '**/*.rb',
    '**/Gemfile',
    '**/Gemfile.lock',
    '**/config.ru',
    
    // Go files
    '**/*.go',
    '**/go.mod',
    '**/go.sum',
    
    // Rust files
    '**/*.rs',
    '**/Cargo.toml',
    '**/Cargo.lock',
    
    // Shell scripts
    '**/*.sh',
    '**/*.bash',
    '**/*.zsh',
    '**/*.fish',
    
    // Other common config files
    '**/*.json',
    '**/*.yaml',
    '**/*.yml',
    '**/*.toml',
    '**/*.ini',
    '**/*.conf',
    '**/*.cfg',
    '**/*.xml',
    '**/*.properties',
    '**/*.env',
    '**/*.rc',
    '**/*.config'
  ];

  const files = await glob(patterns, { 
    cwd: repoPath,
    ignore: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
      '**/target/**',
      '**/venv/**',
      '**/env/**',
      '**/.venv/**',
      '**/vendor/**',
      '**/__pycache__/**',
      '**/.pytest_cache/**',
      '**/coverage/**',
      '**/.nyc_output/**',
      '**/logs/**',
      '**/tmp/**',
      '**/temp/**',
      '**/.cache/**',
      '**/.next/**',
      '**/.nuxt/**',
      '**/.vuepress/**',
      '**/.docusaurus/**',
      '**/out/**',
      '**/.output/**',
      '**/.vercel/**',
      '**/.netlify/**'
    ]
  });

  return files.map(file => path.join(repoPath, file));
};

// Enhanced secret patterns - much more comprehensive
const getSecretPatterns = () => {
  return {
    // AWS
    aws_access_key: {
      regex: /AKIA[0-9A-Z]{16}/g,
      name: "AWS Access Key ID",
      severity: "critical",
      description: "AWS Access Key ID exposed - provides programmatic access to AWS services"
    },
    aws_secret_key: {
      regex: /aws_secret_access_key\s*[:=]\s*['"]([^'"]{40})['"]/gi,
      name: "AWS Secret Access Key",
      severity: "critical",
      description: "AWS Secret Access Key exposed - full AWS account access"
    },
    aws_session_token: {
      regex: /aws_session_token\s*[:=]\s*['"]([^'"]+)['"]/gi,
      name: "AWS Session Token",
      severity: "critical",
      description: "AWS Session Token exposed - temporary AWS credentials"
    },
    aws_region: {
      regex: /aws_region\s*[:=]\s*['"]([^'"]+)['"]/gi,
      name: "AWS Region",
      severity: "low",
      description: "AWS Region exposed - information disclosure"
    },

    // Google Cloud
    gcp_service_account: {
      regex: /"type":\s*"service_account"/gi,
      name: "GCP Service Account",
      severity: "critical",
      description: "Google Cloud Service Account key file exposed"
    },
    gcp_api_key: {
      regex: /AIza[0-9A-Za-z_\-]{35}/g,
      name: "Google API Key",
      severity: "high",
      description: "Google API Key exposed - may have billing implications"
    },
    gcp_client_id: {
      regex: /[0-9]+-[0-9A-Za-z_\-]{32}\.apps\.googleusercontent\.com/g,
      name: "Google OAuth Client ID",
      severity: "medium",
      description: "Google OAuth Client ID exposed"
    },

    // Azure
    azure_client_id: {
      regex: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      name: "Azure Client ID",
      severity: "medium",
      description: "Azure Client ID exposed"
    },
    azure_tenant_id: {
      regex: /tenant[_-]?id\s*[:=]\s*['"]([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})['"]/gi,
      name: "Azure Tenant ID",
      severity: "low",
      description: "Azure Tenant ID exposed"
    },

    // Firebase
    firebase_api_key: {
      regex: /AIza[0-9A-Za-z_\-]{35}/g,
      name: "Firebase API Key",
      severity: "high",
      description: "Firebase API Key exposed - may have billing implications"
    },
    firebase_config: {
      regex: /firebaseConfig\s*=\s*\{[\s\S]*?apiKey:\s*['"]([^'"]+)['"]/gi,
      name: "Firebase Config",
      severity: "high",
      description: "Firebase configuration exposed"
    },
    firebase_service_account: {
      regex: /"type":\s*"service_account".*"project_id":\s*"([^"]+)"/gi,
      name: "Firebase Service Account",
      severity: "critical",
      description: "Firebase Service Account key exposed"
    },

    // Supabase
    supabase_anon_key: {
      regex: /eyJ[A-Za-z0-9_\-]*\.eyJ[A-Za-z0-9_\-]*\.[A-Za-z0-9_\-]*/g,
      name: "Supabase Anon Key",
      severity: "medium",
      description: "Supabase anon key exposed - may be safe for client-side use"
    },
    supabase_service_key: {
      regex: /supabase[_-]?service[_-]?key\s*[:=]\s*['"]([^'"]+)['"]/gi,
      name: "Supabase Service Key",
      severity: "critical",
      description: "Supabase service key exposed - full database access"
    },

    // Stripe
    stripe_secret_key: {
      regex: /sk_live_[0-9a-zA-Z]{24,}/g,
      name: "Stripe Secret Key (Live)",
      severity: "critical",
      description: "Stripe live secret key exposed - full account access"
    },
    stripe_test_key: {
      regex: /sk_test_[0-9a-zA-Z]{24,}/g,
      name: "Stripe Secret Key (Test)",
      severity: "high",
      description: "Stripe test secret key exposed"
    },
    stripe_publishable_key: {
      regex: /pk_live_[0-9a-zA-Z]{24,}/g,
      name: "Stripe Publishable Key (Live)",
      severity: "medium",
      description: "Stripe live publishable key exposed"
    },
    stripe_webhook_secret: {
      regex: /whsec_[0-9a-zA-Z]{24,}/g,
      name: "Stripe Webhook Secret",
      severity: "high",
      description: "Stripe webhook secret exposed"
    },

    // GitHub
    github_token: {
      regex: /gh[ps]_[0-9a-zA-Z]{36}/g,
      name: "GitHub Personal Access Token",
      severity: "critical",
      description: "GitHub PAT exposed - repository access"
    },
    github_app_token: {
      regex: /ghu_[0-9a-zA-Z]{36}/g,
      name: "GitHub App Token",
      severity: "critical",
      description: "GitHub App token exposed"
    },

    // OpenAI
    openai_api_key: {
      regex: /sk-[a-zA-Z0-9]{48}/g,
      name: "OpenAI API Key",
      severity: "high",
      description: "OpenAI API key exposed - billing implications"
    },

    // Database connections
    mongodb_uri: {
      regex: /mongodb(\+srv)?:\/\/[^\s'"]+/gi,
      name: "MongoDB Connection String",
      severity: "critical",
      description: "MongoDB connection URI exposed - database access"
    },
    postgres_uri: {
      regex: /postgres(ql)?:\/\/[^\s'"]+/gi,
      name: "PostgreSQL Connection String",
      severity: "critical",
      description: "PostgreSQL connection URI exposed - database access"
    },
    mysql_uri: {
      regex: /mysql:\/\/[^\s'"]+/gi,
      name: "MySQL Connection String",
      severity: "critical",
      description: "MySQL connection URI exposed - database access"
    },
    redis_uri: {
      regex: /redis:\/\/[^\s'"]+/gi,
      name: "Redis Connection String",
      severity: "high",
      description: "Redis connection URI exposed"
    },

    // JWT tokens
    jwt_token: {
      regex: /eyJ[A-Za-z0-9_\-]*\.eyJ[A-Za-z0-9_\-]*\.[A-Za-z0-9_\-]*/g,
      name: "JWT Token",
      severity: "high",
      description: "JWT token exposed - authentication bypass possible"
    },

    // API keys
    generic_api_key: {
      regex: /api[_-]?key\s*[:=]\s*['"]([a-zA-Z0-9_\-]{20,})['"]/gi,
      name: "Generic API Key",
      severity: "medium",
      description: "Generic API key pattern detected"
    },
    bearer_token: {
      regex: /bearer\s+[a-zA-Z0-9_\-\.]+/gi,
      name: "Bearer Token",
      severity: "high",
      description: "Bearer token exposed"
    },

    // Private keys
    private_key_rsa: {
      regex: /-----BEGIN RSA PRIVATE KEY-----/g,
      name: "RSA Private Key",
      severity: "critical",
      description: "RSA private key exposed - cryptographic compromise"
    },
    private_key_ec: {
      regex: /-----BEGIN EC PRIVATE KEY-----/g,
      name: "EC Private Key",
      severity: "critical",
      description: "Elliptic Curve private key exposed"
    },
    private_key_generic: {
      regex: /-----BEGIN PRIVATE KEY-----/g,
      name: "Private Key",
      severity: "critical",
      description: "Private key exposed - cryptographic compromise"
    },

    // SSH keys
    ssh_private_key: {
      regex: /-----BEGIN OPENSSH PRIVATE KEY-----/g,
      name: "SSH Private Key",
      severity: "critical",
      description: "SSH private key exposed - server access"
    },

    // Slack
    slack_token: {
      regex: /xox[baprs]-[0-9a-zA-Z]{10,48}/g,
      name: "Slack Token",
      severity: "high",
      description: "Slack token exposed - workspace access"
    },
    slack_webhook: {
      regex: /https:\/\/hooks\.slack\.com\/services\/[A-Z0-9]+\/[A-Z0-9]+\/[a-zA-Z0-9]+/g,
      name: "Slack Webhook URL",
      severity: "medium",
      description: "Slack webhook URL exposed"
    },

    // Discord
    discord_token: {
      regex: /[MN][A-Za-z\d]{23}\.[\w-]{6}\.[\w-]{27}/g,
      name: "Discord Bot Token",
      severity: "high",
      description: "Discord bot token exposed"
    },

    // Twilio
    twilio_sid: {
      regex: /AC[a-f0-9]{32}/g,
      name: "Twilio Account SID",
      severity: "medium",
      description: "Twilio Account SID exposed"
    },
    twilio_auth_token: {
      regex: /[a-f0-9]{32}/g,
      name: "Twilio Auth Token",
      severity: "high",
      description: "Twilio Auth Token exposed"
    },

    // SendGrid
    sendgrid_api_key: {
      regex: /SG\.[a-zA-Z0-9_\-]{22}\.[a-zA-Z0-9_\-]{43}/g,
      name: "SendGrid API Key",
      severity: "high",
      description: "SendGrid API key exposed"
    },

    // Mailgun
    mailgun_api_key: {
      regex: /key-[a-f0-9]{32}/g,
      name: "Mailgun API Key",
      severity: "high",
      description: "Mailgun API key exposed"
    },

    // Cloudinary
    cloudinary_url: {
      regex: /cloudinary:\/\/[0-9]+:[a-zA-Z0-9]+@[a-zA-Z0-9]+/g,
      name: "Cloudinary URL",
      severity: "high",
      description: "Cloudinary URL with credentials exposed"
    },

    // Heroku
    heroku_api_key: {
      regex: /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g,
      name: "Heroku API Key",
      severity: "high",
      description: "Heroku API key exposed"
    },

    // Generic secrets
    password_in_code: {
      regex: /password\s*[:=]\s*['"]([^'"]{8,})['"]/gi,
      name: "Password in Code",
      severity: "high",
      description: "Password hardcoded in source code"
    },
    secret_in_code: {
      regex: /secret\s*[:=]\s*['"]([^'"]{8,})['"]/gi,
      name: "Secret in Code",
      severity: "high",
      description: "Secret hardcoded in source code"
    },
    token_in_code: {
      regex: /token\s*[:=]\s*['"]([^'"]{8,})['"]/gi,
      name: "Token in Code",
      severity: "high",
      description: "Token hardcoded in source code"
    },

    // Environment variables
    env_var_exposure: {
      regex: /process\.env\.[A-Z_]+/g,
      name: "Environment Variable Reference",
      severity: "low",
      description: "Environment variable referenced in code"
    }
  };
};

// Scan individual file for secrets
const scanFileForSecrets = async (filePath, repoPath) => {
  const findings = [];
  const relativePath = path.relative(repoPath, filePath);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const patterns = getSecretPatterns();
    
    // Check against all patterns
    for (const [key, pattern] of Object.entries(patterns)) {
      const matches = content.matchAll(pattern.regex);
      
      for (const match of matches) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const matchText = match[0];
        
        // Skip if it's a comment or documentation
        if (isInComment(content, match.index) || isInDocumentation(content, match.index)) {
          continue;
        }
        
        findings.push({
          type: pattern.name,
          severity: pattern.severity,
          description: pattern.description,
          file: relativePath,
          line: lineNumber,
          match: sanitizeMatch(matchText),
          recommendation: getSecretRecommendation(key, relativePath, pattern.severity),
          category: getSecretCategory(key),
          confidence: calculateConfidence(matchText, key),
          context: getContextAroundMatch(content, match.index, 3)
        });
      }
    }
  } catch (error) {
    // Ignore file read errors (permissions, binary files, etc.)
    console.warn(`⚠️  Could not read file: ${relativePath}`);
  }
  
  return findings;
};

// Helper functions
const isInComment = (content, index) => {
  const beforeMatch = content.substring(0, index);
  const lines = beforeMatch.split('\n');
  const currentLine = lines[lines.length - 1];
  
  // Check for various comment styles
  return currentLine.includes('//') || 
         currentLine.includes('#') || 
         currentLine.includes('/*') ||
         currentLine.includes('<!--');
};

const isInDocumentation = (content, index) => {
  const beforeMatch = content.substring(0, index);
  const afterMatch = content.substring(index);
  
  // Check if surrounded by documentation markers
  return beforeMatch.includes('```') || 
         beforeMatch.includes('<!--') ||
         afterMatch.includes('```') ||
         afterMatch.includes('-->');
};

const sanitizeMatch = (match) => {
  // Truncate long matches and mask sensitive parts
  if (match.length > 50) {
    return match.substring(0, 20) + '...' + match.substring(match.length - 10);
  }
  return match;
};

const getSecretCategory = (key) => {
  const categories = {
    aws_access_key: 'Cloud Provider',
    aws_secret_key: 'Cloud Provider',
    gcp_service_account: 'Cloud Provider',
    firebase_api_key: 'Cloud Provider',
    stripe_secret_key: 'Payment',
    stripe_test_key: 'Payment',
    github_token: 'Version Control',
    openai_api_key: 'AI Service',
    mongodb_uri: 'Database',
    postgres_uri: 'Database',
    jwt_token: 'Authentication',
    private_key_rsa: 'Cryptography',
    slack_token: 'Communication',
    discord_token: 'Communication'
  };
  
  return categories[key] || 'Other';
};

const calculateConfidence = (match, key) => {
  // High confidence for well-known patterns
  const highConfidence = ['aws_access_key', 'stripe_secret_key', 'github_token', 'openai_api_key'];
  if (highConfidence.includes(key)) return 'high';
  
  // Medium confidence for generic patterns
  const mediumConfidence = ['generic_api_key', 'password_in_code', 'secret_in_code'];
  if (mediumConfidence.includes(key)) return 'medium';
  
  return 'low';
};

const getContextAroundMatch = (content, index, lines) => {
  const contentLines = content.split('\n');
  const matchLine = content.substring(0, index).split('\n').length - 1;
  
  const start = Math.max(0, matchLine - lines);
  const end = Math.min(contentLines.length, matchLine + lines + 1);
  
  return contentLines.slice(start, end).map((line, i) => ({
    lineNumber: start + i + 1,
    content: line,
    isMatch: start + i === matchLine
  }));
};

const getSecretRecommendation = (key, filePath, severity) => {
  const recommendations = {
    aws_access_key: "CRITICAL: Remove immediately and rotate in AWS IAM. Use environment variables or AWS Secrets Manager.",
    aws_secret_key: "CRITICAL: Remove immediately and rotate in AWS IAM. Never commit secrets to code.",
    firebase_api_key: "Move to environment variables. For web apps, restrict API key usage in Firebase Console.",
    stripe_secret_key: "CRITICAL: Remove immediately and rotate in Stripe Dashboard. This gives full account access.",
    github_token: "Revoke this token in GitHub settings and create a new one with minimal permissions.",
    openai_api_key: "Remove and rotate this key. Store in environment variables on the server only.",
    mongodb_uri: "Move to environment variables. Ensure database has authentication enabled.",
    postgres_uri: "Move to environment variables. Use connection pooling and secure credentials.",
    jwt_token: "Rotate this JWT token immediately. Check if it's still valid and revoke if necessary.",
    private_key_rsa: "Remove private keys from repository. Use key management services or environment variables.",
    slack_token: "Revoke this token in Slack workspace settings and create a new one with minimal permissions."
  };
  
  return recommendations[key] || "Move this secret to environment variables and add the file to .gitignore";
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

const analyzeBySecretType = (findings) => {
  const secretTypes = {};
  
  findings.forEach(finding => {
    if (!secretTypes[finding.type]) {
      secretTypes[finding.type] = { count: 0, severity: {} };
    }
    secretTypes[finding.type].count++;
    secretTypes[finding.type].severity[finding.severity] = (secretTypes[finding.type].severity[finding.severity] || 0) + 1;
  });
  
  return secretTypes;
};

const generateSecretRecommendations = (findings) => {
  const recommendations = [];
  
  // Critical secrets
  const criticalSecrets = findings.filter(f => f.severity === 'critical');
  if (criticalSecrets.length > 0) {
    recommendations.push({
      priority: 'URGENT',
      action: `Remove ${criticalSecrets.length} critical secrets immediately`,
      reason: 'Critical secrets provide full account access and must be rotated',
      secrets: criticalSecrets.map(s => s.type)
    });
  }
  
  // High severity secrets
  const highSecrets = findings.filter(f => f.severity === 'high');
  if (highSecrets.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      action: `Secure ${highSecrets.length} high-risk secrets`,
      reason: 'High-risk secrets can lead to data breaches',
      secrets: highSecrets.map(s => s.type)
    });
  }
  
  // Environment variables
  const envFiles = findings.filter(f => f.file.includes('.env'));
  if (envFiles.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      action: 'Add .env files to .gitignore',
      reason: 'Environment files should never be committed to version control'
    });
  }
  
  // Database credentials
  const dbSecrets = findings.filter(f => f.category === 'Database');
  if (dbSecrets.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      action: 'Secure database credentials',
      reason: 'Database credentials provide direct data access'
    });
  }
  
  return recommendations;
};