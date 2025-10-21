import fs from "fs";
import path from "path";

// Config Exposure Scanner - Finds exposed API keys and secrets in config files
export const scanConfigExposure = (repoPath) => {
  console.log('🔍 Scanning for exposed configs and API keys...');
  
  const findings = [];
  
  // Sensitive patterns to detect
  const patterns = {
    aws_access_key: {
      regex: /AKIA[0-9A-Z]{16}/g,
      name: "AWS Access Key",
      severity: "critical",
      description: "AWS Access Key ID exposed"
    },
    aws_secret_key: {
      regex: /aws_secret_access_key\s*=\s*['"]([^'"]+)['"]/gi,
      name: "AWS Secret Key",
      severity: "critical",
      description: "AWS Secret Access Key exposed"
    },
    firebase_api_key: {
      regex: /AIza[0-9A-Za-z_\-]{35}/g,
      name: "Firebase API Key",
      severity: "high",
      description: "Firebase API Key exposed"
    },
    firebase_config: {
      regex: /firebaseConfig\s*=\s*\{[\s\S]*?apiKey:\s*['"]([^'"]+)['"]/gi,
      name: "Firebase Config",
      severity: "high",
      description: "Firebase configuration exposed"
    },
    supabase_key: {
      regex: /eyJ[A-Za-z0-9_\-]*\.eyJ[A-Za-z0-9_\-]*\.[A-Za-z0-9_\-]*/g,
      name: "Supabase/JWT Token",
      severity: "high",
      description: "Supabase anon key or JWT token exposed"
    },
    stripe_secret: {
      regex: /sk_live_[0-9a-zA-Z]{24,}/g,
      name: "Stripe Secret Key",
      severity: "critical",
      description: "Stripe live secret key exposed"
    },
    stripe_publishable: {
      regex: /pk_live_[0-9a-zA-Z]{24,}/g,
      name: "Stripe Publishable Key",
      severity: "medium",
      description: "Stripe live publishable key exposed"
    },
    github_token: {
      regex: /gh[ps]_[0-9a-zA-Z]{36}/g,
      name: "GitHub Token",
      severity: "critical",
      description: "GitHub personal access token exposed"
    },
    openai_key: {
      regex: /sk-[a-zA-Z0-9]{48}/g,
      name: "OpenAI API Key",
      severity: "high",
      description: "OpenAI API key exposed"
    },
    mongodb_uri: {
      regex: /mongodb(\+srv)?:\/\/[^\s'"]+/gi,
      name: "MongoDB Connection String",
      severity: "critical",
      description: "MongoDB connection URI exposed"
    },
    postgres_uri: {
      regex: /postgres(ql)?:\/\/[^\s'"]+/gi,
      name: "PostgreSQL Connection String",
      severity: "critical",
      description: "PostgreSQL connection URI exposed"
    },
    generic_api_key: {
      regex: /api[_-]?key\s*[:=]\s*['"]([a-zA-Z0-9_\-]{20,})['"]/gi,
      name: "Generic API Key",
      severity: "medium",
      description: "Generic API key pattern detected"
    },
    private_key_header: {
      regex: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/g,
      name: "Private Key",
      severity: "critical",
      description: "Private key detected"
    }
  };

  // High-risk files to scan
  const filePatterns = [
    '**/.env*',
    '**/config.js',
    '**/config.json',
    '**/settings.js',
    '**/settings.json',
    '**/firebase.json',
    '**/firebaseConfig.js',
    '**/.config.js',
    '**/credentials.json',
    '**/secrets.json',
    '**/app.config.js',
    '**/next.config.js',
    '**/nuxt.config.js'
  ];

  // Recursively scan directory
  const scanDir = (dir) => {
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip node_modules, .git, etc.
          if (!item.startsWith('.') && item !== 'node_modules' && item !== 'dist' && item !== 'build') {
            scanDir(fullPath);
          }
        } else if (stat.isFile()) {
          // Check if file matches our patterns
          const fileName = item.toLowerCase();
          const shouldScan = 
            fileName.startsWith('.env') ||
            fileName.includes('config') ||
            fileName.includes('settings') ||
            fileName.includes('credentials') ||
            fileName.includes('secrets') ||
            fileName.includes('firebase');
          
          if (shouldScan) {
            scanFile(fullPath);
          }
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
  };

  const scanFile = (filePath) => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(repoPath, filePath);
      
      // Check against all patterns
      for (const [key, pattern] of Object.entries(patterns)) {
        const matches = content.matchAll(pattern.regex);
        
        for (const match of matches) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          
          findings.push({
            type: pattern.name,
            severity: pattern.severity,
            description: pattern.description,
            file: relativePath,
            line: lineNumber,
            match: match[0].substring(0, 50) + (match[0].length > 50 ? '...' : ''), // Truncate for safety
            recommendation: getRecommendation(key, relativePath)
          });
        }
      }
    } catch (error) {
      // Ignore file read errors
    }
  };

  const getRecommendation = (keyType, filePath) => {
    const recommendations = {
      aws_access_key: "Remove this key immediately and rotate it in AWS IAM. Use environment variables or AWS Secrets Manager.",
      aws_secret_key: "Remove this secret immediately and rotate it in AWS IAM. Never commit secrets to code.",
      firebase_api_key: "Move to environment variables. For web apps, restrict API key usage in Firebase Console.",
      firebase_config: "Move Firebase config to environment variables or a secure config service.",
      supabase_key: "If this is an anon key, it's safe for client-side. If service role key, move to server environment variables.",
      stripe_secret: "CRITICAL: Remove immediately and rotate in Stripe Dashboard. This gives full account access.",
      stripe_publishable: "Move to environment variables, though less critical than secret keys.",
      github_token: "Revoke this token in GitHub settings and create a new one with minimal permissions.",
      openai_key: "Remove and rotate this key. Store in environment variables on the server only.",
      mongodb_uri: "Move to environment variables. Ensure database has authentication enabled.",
      postgres_uri: "Move to environment variables. Use connection pooling and secure credentials.",
      generic_api_key: "Move to environment variables or a secrets management service.",
      private_key_header: "Remove private keys from repository. Use key management services or environment variables."
    };
    
    return recommendations[keyType] || "Move this secret to environment variables and add the file to .gitignore";
  };

  // Start scanning
  scanDir(repoPath);

  console.log(`📊 Config scan found ${findings.length} exposed secrets/keys`);

  return findings;
};


