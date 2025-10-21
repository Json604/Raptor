import { exec } from "child_process";
import fs from "fs"

// TruffleHog - Scans current files for secrets (optimized for Raptor)
export const runTruffleHog = async (repoPath) => {
  console.log('🔍 Running TruffleHog scan on:', repoPath);
  return new Promise((resolve, reject) => {
    exec(
      `docker run --rm -v ${repoPath}:/src trufflesecurity/trufflehog:latest filesystem /src --json --no-update`,
      { maxBuffer: 1024 * 1024 * 50 }, // 50MB buffer for large scan results
      (err, stdout, stderr) => {
        if (err) {
          console.error('❌ TruffleHog error:', err.message);
          console.error('Stderr:', stderr);
          return reject(stderr || err.message);
        }

        console.log('✅ TruffleHog scan completed');
        console.log('Output length:', stdout?.length || 0);
        
        // TruffleHog outputs NDJSON (newline-delimited JSON), not a single JSON array
        try {
          if (!stdout || !stdout.trim()) {
            console.log('📊 TruffleHog: No findings');
            resolve([]); // No findings
          } else {
            // Split by newlines and parse each line as separate JSON
            const lines = stdout.trim().split('\n').filter(line => line.trim());
            const results = [];
            
            for (const line of lines) {
              try {
                const parsed = JSON.parse(line);
                // Filter out log messages - only keep actual findings
                // Findings have SourceMetadata and DetectorType, logs have "level" field
                if (parsed.DetectorType !== undefined && !parsed.level) {
                  results.push(parsed);
                }
              } catch (e) {
                // Skip lines that can't be parsed
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
}


// Gitleaks - Scans current files for secrets (optimized for Raptor)
export const runGitleaks = async (repoPath) => {
  console.log('🔍 Running Gitleaks scan on:', repoPath);
  return new Promise((resolve, reject) => {
    exec(
      `docker run --rm -v ${repoPath}:/repo zricethezav/gitleaks:latest detect --source=/repo --report-path=/repo/gitleaks.json --no-banner --no-git`,
      { maxBuffer: 1024 * 1024 * 50 }, // 50MB buffer for large scan results
      (err, stdout, stderr) => {
        console.log('✅ Gitleaks scan completed');
        if (err) {
          console.log('⚠️  Gitleaks exit code:', err.code, '(code 1 means secrets found)');
        }
        
        // Gitleaks exits with code 1 when it finds leaks, so don't reject on error
        // Only reject if we can't read the report file
        try {
          // Check if report file exists
          if (fs.existsSync(`${repoPath}/gitleaks.json`)) {
            const reportJson = fs.readFileSync(`${repoPath}/gitleaks.json`, "utf8");
            const results = JSON.parse(reportJson);
            // Gitleaks returns an array of findings, or empty array if none found
            const findings = Array.isArray(results) ? results : [];
            console.log(`📊 Gitleaks found ${findings.length} potential secrets`);
            resolve(findings);
          } else {
            // No report file means no secrets found
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
}
