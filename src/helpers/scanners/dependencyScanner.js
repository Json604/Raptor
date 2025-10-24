import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { glob } from "glob";

const execAsync = promisify(exec);

// Enhanced Dependency Scanner - Scans ALL package managers and subdirectories
export const scanDependencies = async (repoPath) => {
  console.log('🔍 Scanning dependencies for vulnerabilities across entire repository...');
  
  const results = {
    projectStructure: {
      type: 'unknown',
      packageManagers: [],
      subProjects: [],
      totalPackageFiles: 0
    },
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
    securityAdvisories: [],
    licenseIssues: [],
    deprecatedPackages: []
  };

  try {
    // 1. Detect project structure
    results.projectStructure = await detectProjectStructure(repoPath);
    console.log(`📦 Detected ${results.projectStructure.type} with ${results.projectStructure.packageManagers.join(', ')}`);

    // 2. Find ALL package files recursively
    const packageFiles = await findAllPackageFiles(repoPath);
    results.projectStructure.totalPackageFiles = packageFiles.length;
    console.log(`📁 Found ${packageFiles.length} package files across the repository`);

    // 3. Scan each package file
    for (const packageInfo of packageFiles) {
      console.log(`🔍 Scanning ${packageInfo.relativePath}...`);
      const scanResult = await scanPackageFile(packageInfo);
      
      // Merge results
      results.vulnerabilities.push(...scanResult.vulnerabilities);
      results.outdated.push(...scanResult.outdated);
      results.securityAdvisories.push(...scanResult.securityAdvisories);
      results.licenseIssues.push(...scanResult.licenseIssues);
      results.deprecatedPackages.push(...scanResult.deprecatedPackages);
    }

    // 4. Calculate combined summary
    results.summary = calculateCombinedSummary(results.vulnerabilities);

    // 5. Check for cross-project vulnerabilities
    const crossProjectIssues = findCrossProjectIssues(packageFiles, results.vulnerabilities);
    results.crossProjectIssues = crossProjectIssues;

    console.log(`📊 Found ${results.summary.total} total vulnerabilities across all projects`);
    console.log(`📊 Critical: ${results.summary.critical}, High: ${results.summary.high}, Moderate: ${results.summary.moderate}`);

  } catch (error) {
    console.error('❌ Error in dependency scan:', error.message);
  }

  return results;
};

// Detect project structure and package managers
const detectProjectStructure = async (repoPath) => {
  const structure = {
    type: 'single',
    packageManagers: [],
    subProjects: [],
    totalPackageFiles: 0
  };

  // Find all package files
  const packageFiles = await findAllPackageFiles(repoPath);
  structure.totalPackageFiles = packageFiles.length;

  // Detect package managers
  const packageManagerFiles = await glob([
    '**/package-lock.json',
    '**/yarn.lock',
    '**/pnpm-lock.yaml',
    '**/bun.lockb',
    '**/requirements.txt',
    '**/Pipfile',
    '**/poetry.lock',
    '**/composer.json',
    '**/composer.lock',
    '**/Gemfile',
    '**/Gemfile.lock',
    '**/Cargo.toml',
    '**/Cargo.lock',
    '**/go.mod',
    '**/go.sum',
    '**/pom.xml',
    '**/build.gradle',
    '**/gradle.lockfile'
  ], { cwd: repoPath });

  // Detect package managers based on lock files
  if (packageManagerFiles.some(f => f.includes('package-lock.json'))) structure.packageManagers.push('npm');
  if (packageManagerFiles.some(f => f.includes('yarn.lock'))) structure.packageManagers.push('yarn');
  if (packageManagerFiles.some(f => f.includes('pnpm-lock.yaml'))) structure.packageManagers.push('pnpm');
  if (packageManagerFiles.some(f => f.includes('bun.lockb'))) structure.packageManagers.push('bun');
  if (packageManagerFiles.some(f => f.includes('requirements.txt'))) structure.packageManagers.push('pip');
  if (packageManagerFiles.some(f => f.includes('Pipfile'))) structure.packageManagers.push('pipenv');
  if (packageManagerFiles.some(f => f.includes('poetry.lock'))) structure.packageManagers.push('poetry');
  if (packageManagerFiles.some(f => f.includes('composer.json'))) structure.packageManagers.push('composer');
  if (packageManagerFiles.some(f => f.includes('Gemfile'))) structure.packageManagers.push('bundler');
  if (packageManagerFiles.some(f => f.includes('Cargo.toml'))) structure.packageManagers.push('cargo');
  if (packageManagerFiles.some(f => f.includes('go.mod'))) structure.packageManagers.push('go');
  if (packageManagerFiles.some(f => f.includes('pom.xml'))) structure.packageManagers.push('maven');
  if (packageManagerFiles.some(f => f.includes('build.gradle'))) structure.packageManagers.push('gradle');

  // Detect project type
  if (packageFiles.length > 1) {
    structure.type = 'monorepo';
  } else if (packageFiles.length === 1) {
    structure.type = 'single';
  } else {
    structure.type = 'unknown';
  }

  // Detect monorepo tools
  const monorepoTools = await glob([
    '**/lerna.json',
    '**/nx.json',
    '**/rush.json',
    '**/workspace.json',
    '**/.nxrc',
    '**/turbo.json'
  ], { cwd: repoPath });

  if (monorepoTools.length > 0) {
    structure.type = 'monorepo';
    structure.monorepoTool = monorepoTools[0].split('/').pop();
  }

  return structure;
};

// Find all package files recursively
const findAllPackageFiles = async (repoPath) => {
  const packageFiles = [];
  
  const patterns = [
    '**/package.json',
    '**/requirements.txt',
    '**/Pipfile',
    '**/poetry.lock',
    '**/composer.json',
    '**/Gemfile',
    '**/Cargo.toml',
    '**/go.mod',
    '**/pom.xml',
    '**/build.gradle',
    '**/package.xml',
    '**/setup.py',
    '**/pyproject.toml',
    '**/mix.exs',
    '**/pubspec.yaml',
    '**/Podfile',
    '**/Cartfile',
    '**/Package.swift'
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
      '**/.pytest_cache/**'
    ]
  });

  for (const file of files) {
    const fullPath = path.join(repoPath, file);
    const dir = path.dirname(fullPath);
    const relativeDir = path.relative(repoPath, dir);
    
    packageFiles.push({
      fullPath,
      relativePath: file,
      directory: relativeDir,
      packageManager: detectPackageManagerFromFile(file)
    });
  }

  return packageFiles;
};

// Detect package manager from filename
const detectPackageManagerFromFile = (filename) => {
  if (filename.includes('package.json')) return 'npm';
  if (filename.includes('requirements.txt')) return 'pip';
  if (filename.includes('Pipfile')) return 'pipenv';
  if (filename.includes('poetry.lock')) return 'poetry';
  if (filename.includes('composer.json')) return 'composer';
  if (filename.includes('Gemfile')) return 'bundler';
  if (filename.includes('Cargo.toml')) return 'cargo';
  if (filename.includes('go.mod')) return 'go';
  if (filename.includes('pom.xml')) return 'maven';
  if (filename.includes('build.gradle')) return 'gradle';
  return 'unknown';
};

// Scan individual package file
const scanPackageFile = async (packageInfo) => {
  const result = {
    vulnerabilities: [],
    outdated: [],
    securityAdvisories: [],
    licenseIssues: [],
    deprecatedPackages: []
  };

  try {
    switch (packageInfo.packageManager) {
      case 'npm':
        await scanNpmPackage(packageInfo, result);
        break;
      case 'pip':
        await scanPipPackage(packageInfo, result);
        break;
      case 'composer':
        await scanComposerPackage(packageInfo, result);
        break;
      case 'bundler':
        await scanBundlerPackage(packageInfo, result);
        break;
      case 'cargo':
        await scanCargoPackage(packageInfo, result);
        break;
      case 'go':
        await scanGoPackage(packageInfo, result);
        break;
      case 'maven':
        await scanMavenPackage(packageInfo, result);
        break;
      case 'gradle':
        await scanGradlePackage(packageInfo, result);
        break;
      default:
        console.log(`⚠️  Unknown package manager: ${packageInfo.packageManager}`);
    }
  } catch (error) {
    console.error(`❌ Error scanning ${packageInfo.relativePath}:`, error.message);
  }

  return result;
};

// Scan npm package
const scanNpmPackage = async (packageInfo, result) => {
  const { fullPath, directory } = packageInfo;
  
  try {
    // Run npm audit
    const { stdout } = await execAsync(
      `cd "${path.dirname(fullPath)}" && npm audit --json --audit-level=moderate || true`,
      { maxBuffer: 10 * 1024 * 1024 }
    );

    const auditData = JSON.parse(stdout);
    
    if (auditData.vulnerabilities) {
      for (const [packageName, vulnData] of Object.entries(auditData.vulnerabilities)) {
        if (vulnData.via && Array.isArray(vulnData.via)) {
          vulnData.via.forEach(via => {
            if (typeof via === 'object' && via.title) {
              result.vulnerabilities.push({
                package: packageName,
                severity: via.severity || 'unknown',
                title: via.title,
                description: via.url || '',
                currentVersion: vulnData.version || 'unknown',
                fixAvailable: vulnData.fixAvailable ? 'Yes' : 'No',
                directory: directory,
                packageManager: 'npm',
                recommendation: getNpmRecommendation(packageName, via.severity, vulnData.fixAvailable),
                cve: via.cve || null,
                url: via.url || null
              });
            }
          });
        }
      }
    }

    // Check for outdated packages
    await checkOutdatedPackages(packageInfo, result);
    
    // Check for deprecated packages
    await checkDeprecatedPackages(packageInfo, result);

  } catch (error) {
    console.error(`❌ Error in npm audit for ${directory}:`, error.message);
  }
};

// Scan pip package
const scanPipPackage = async (packageInfo, result) => {
  const { fullPath, directory } = packageInfo;
  
  try {
    // Run safety check
    const { stdout } = await execAsync(
      `cd "${path.dirname(fullPath)}" && safety check --json || true`,
      { maxBuffer: 10 * 1024 * 1024 }
    );

    const safetyData = JSON.parse(stdout);
    
    if (safetyData.vulnerabilities) {
      safetyData.vulnerabilities.forEach(vuln => {
        result.vulnerabilities.push({
          package: vuln.package_name,
          severity: vuln.severity || 'unknown',
          title: vuln.advisory || 'Security vulnerability',
          description: vuln.description || '',
          currentVersion: vuln.installed_version || 'unknown',
          fixAvailable: vuln.fixed_versions ? 'Yes' : 'No',
          directory: directory,
          packageManager: 'pip',
          recommendation: `Update to version ${vuln.fixed_versions || 'latest'}`,
          cve: vuln.cve || null,
          url: vuln.url || null
        });
      });
    }
  } catch (error) {
    console.error(`❌ Error in safety check for ${directory}:`, error.message);
  }
};

// Check for outdated packages
const checkOutdatedPackages = async (packageInfo, result) => {
  const { fullPath, directory } = packageInfo;
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Known vulnerable/outdated packages
    const riskyPackages = {
      'react': { minVersion: '18.0.0', reason: 'Old versions have known XSS vulnerabilities' },
      'express': { minVersion: '4.18.0', reason: 'Security improvements in newer versions' },
      'axios': { minVersion: '1.0.0', reason: 'Security fixes in v1+' },
      'lodash': { minVersion: '4.17.21', reason: 'Prototype pollution fixes' },
      'moment': { minVersion: null, reason: 'Deprecated - consider date-fns or dayjs' },
      'request': { minVersion: null, reason: 'Deprecated - use axios or fetch' },
      'jquery': { minVersion: '3.6.0', reason: 'Old versions have XSS vulnerabilities' },
      'webpack': { minVersion: '5.0.0', reason: 'Security improvements in v5+' },
      'babel-core': { minVersion: null, reason: 'Deprecated - use @babel/core' },
      'gulp': { minVersion: '4.0.0', reason: 'Security improvements in v4+' }
    };

    for (const [pkg, metadata] of Object.entries(riskyPackages)) {
      if (deps[pkg]) {
        result.outdated.push({
          package: pkg,
          currentVersion: deps[pkg],
          directory: directory,
          packageManager: 'npm',
          recommendation: metadata.reason,
          severity: metadata.minVersion ? 'medium' : 'high'
        });
      }
    }
  } catch (error) {
    // Ignore errors reading package.json
  }
};

// Check for deprecated packages
const checkDeprecatedPackages = async (packageInfo, result) => {
  const { fullPath, directory } = packageInfo;
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const deprecatedPackages = [
      'moment', 'request', 'babel-core', 'gulp-util', 'node-uuid',
      'hawk', 'boom', 'hoek', 'cryptiles', 'sntp'
    ];

    for (const pkg of deprecatedPackages) {
      if (deps[pkg]) {
        result.deprecatedPackages.push({
          package: pkg,
          currentVersion: deps[pkg],
          directory: directory,
          packageManager: 'npm',
          recommendation: `Replace ${pkg} with a modern alternative`,
          severity: 'medium'
        });
      }
    }
  } catch (error) {
    // Ignore errors reading package.json
  }
};

// Calculate combined summary
const calculateCombinedSummary = (vulnerabilities) => {
  const summary = {
    total: 0,
    critical: 0,
    high: 0,
    moderate: 0,
    low: 0,
    info: 0
  };

  vulnerabilities.forEach(vuln => {
    summary.total++;
    const severity = vuln.severity || 'info';
    if (summary[severity] !== undefined) {
      summary[severity]++;
    }
  });

  return summary;
};

// Find cross-project vulnerabilities
const findCrossProjectIssues = (packageFiles, vulnerabilities) => {
  const issues = [];
  
  // Group vulnerabilities by package name
  const packageVulns = {};
  vulnerabilities.forEach(vuln => {
    if (!packageVulns[vuln.package]) {
      packageVulns[vuln.package] = [];
    }
    packageVulns[vuln.package].push(vuln);
  });

  // Find packages with vulnerabilities in multiple projects
  for (const [packageName, vulns] of Object.entries(packageVulns)) {
    if (vulns.length > 1) {
      const directories = [...new Set(vulns.map(v => v.directory))];
      if (directories.length > 1) {
        issues.push({
          type: 'cross-project',
          package: packageName,
          severity: vulns[0].severity,
          directories: directories,
          description: `${packageName} has vulnerabilities in multiple projects`,
          recommendation: `Update ${packageName} in all projects: ${directories.join(', ')}`
        });
      }
    }
  }

  return issues;
};

// Get npm recommendation
const getNpmRecommendation = (packageName, severity, fixAvailable) => {
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

// Placeholder functions for other package managers
const scanComposerPackage = async (packageInfo, result) => {
  // Implement PHP Composer scanning
  console.log(`📦 Composer scanning not yet implemented for ${packageInfo.relativePath}`);
};

const scanBundlerPackage = async (packageInfo, result) => {
  // Implement Ruby Bundler scanning
  console.log(`📦 Bundler scanning not yet implemented for ${packageInfo.relativePath}`);
};

const scanCargoPackage = async (packageInfo, result) => {
  // Implement Rust Cargo scanning
  console.log(`📦 Cargo scanning not yet implemented for ${packageInfo.relativePath}`);
};

const scanGoPackage = async (packageInfo, result) => {
  // Implement Go module scanning
  console.log(`📦 Go module scanning not yet implemented for ${packageInfo.relativePath}`);
};

const scanMavenPackage = async (packageInfo, result) => {
  // Implement Maven scanning
  console.log(`📦 Maven scanning not yet implemented for ${packageInfo.relativePath}`);
};

const scanGradlePackage = async (packageInfo, result) => {
  // Implement Gradle scanning
  console.log(`📦 Gradle scanning not yet implemented for ${packageInfo.relativePath}`);
};