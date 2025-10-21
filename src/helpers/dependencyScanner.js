import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);

// Dependency Scanner - Scans for vulnerable dependencies using npm audit
export const scanDependencies = async (repoPath) => {
  console.log('🔍 Scanning dependencies for vulnerabilities...');
  
  const results = {
    hasPackageJson: false,
    vulnerabilities: [],
    summary: {
      total: 0,
      critical: 0,
      high: 0,
      moderate: 0,
      low: 0,
      info: 0
    },
    outdated: [],
    packageManager: null
  };

  // Check for package.json (Node.js)
  const packageJsonPath = path.join(repoPath, 'package.json');
  const yarnLockPath = path.join(repoPath, 'yarn.lock');
  const packageLockPath = path.join(repoPath, 'package-lock.json');

  if (!fs.existsSync(packageJsonPath)) {
    console.log('📊 No package.json found - skipping dependency scan');
    return results;
  }

  results.hasPackageJson = true;
  
  // Determine package manager
  if (fs.existsSync(yarnLockPath)) {
    results.packageManager = 'yarn';
  } else if (fs.existsSync(packageLockPath)) {
    results.packageManager = 'npm';
  } else {
    results.packageManager = 'npm'; // Default
  }

  console.log(`📦 Detected ${results.packageManager} project`);

  try {
    // Run npm audit (works even without node_modules)
    const { stdout, stderr } = await execAsync(
      `cd "${repoPath}" && npm audit --json || true`, // || true to not fail on vulnerabilities
      { maxBuffer: 10 * 1024 * 1024 }
    );

    let auditData;
    try {
      auditData = JSON.parse(stdout);
    } catch (parseError) {
      console.log('⚠️  Could not parse npm audit output');
      return results;
    }

    // Parse npm audit v7+ format
    if (auditData.vulnerabilities) {
      const vulns = auditData.vulnerabilities;
      
      for (const [packageName, vulnData] of Object.entries(vulns)) {
        if (vulnData.via && Array.isArray(vulnData.via)) {
          vulnData.via.forEach(via => {
            if (typeof via === 'object' && via.title) {
              results.vulnerabilities.push({
                package: packageName,
                severity: via.severity || 'unknown',
                title: via.title,
                description: via.url || '',
                currentVersion: vulnData.version || 'unknown',
                fixAvailable: vulnData.fixAvailable ? 'Yes' : 'No',
                recommendation: getRecommendation(packageName, via.severity, vulnData.fixAvailable)
              });
              
              // Update summary
              const severity = via.severity || 'info';
              if (results.summary[severity] !== undefined) {
                results.summary[severity]++;
              }
              results.summary.total++;
            }
          });
        }
      }
    }
    
    // Also parse metadata if available (npm audit v6 format fallback)
    if (auditData.metadata) {
      const meta = auditData.metadata.vulnerabilities;
      if (meta && results.summary.total === 0) {
        results.summary = {
          total: meta.total || 0,
          critical: meta.critical || 0,
          high: meta.high || 0,
          moderate: meta.moderate || 0,
          low: meta.low || 0,
          info: meta.info || 0
        };
      }
    }

    console.log(`📊 Found ${results.summary.total} vulnerabilities (Critical: ${results.summary.critical}, High: ${results.summary.high})`);

  } catch (error) {
    console.error('❌ Error running npm audit:', error.message);
    // Don't fail the whole scan, just return empty results
  }

  // Optional: Check for outdated packages (quick check)
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Flag some commonly outdated/risky packages
    const riskyPackages = {
      'react': { minVersion: '18.0.0', reason: 'Old versions have known XSS vulnerabilities' },
      'express': { minVersion: '4.18.0', reason: 'Security improvements in newer versions' },
      'axios': { minVersion: '1.0.0', reason: 'Security fixes in v1+' },
      'lodash': { minVersion: '4.17.21', reason: 'Prototype pollution fixes' },
      'moment': { minVersion: null, reason: 'Deprecated - consider date-fns or dayjs' }
    };

    for (const [pkg, metadata] of Object.entries(riskyPackages)) {
      if (deps[pkg]) {
        results.outdated.push({
          package: pkg,
          currentVersion: deps[pkg],
          recommendation: metadata.reason
        });
      }
    }

  } catch (error) {
    // Ignore errors reading package.json
  }

  return results;
};

const getRecommendation = (packageName, severity, fixAvailable) => {
  const severityActions = {
    critical: 'URGENT: Update or remove this package immediately. Consider alternatives if no fix exists.',
    high: 'Update this package as soon as possible. Review your dependency tree.',
    moderate: 'Plan to update this package in your next maintenance cycle.',
    low: 'Update when convenient. Keep monitoring for newer versions.',
    info: 'Informational only. Review the advisory for context.'
  };

  let recommendation = severityActions[severity] || 'Review and update this dependency.';
  
  if (fixAvailable) {
    recommendation += ' Run: npm audit fix';
  } else {
    recommendation += ' Check for alternative packages or manual fixes.';
  }

  return recommendation;
};


