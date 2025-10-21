import { exec } from "child_process";
import fs from "fs"

// TruffleHog
export const runTruffleHog = async (repoPath) => {
  return new Promise((resolve, reject) => {
    exec(
      `docker run --rm -v ${repoPath}:/src trufflesecurity/trufflehog:latest filesystem /src --json`,
      (err, stdout, stderr) => {
        if (err) return reject(stderr || err.message);

        // Defensive parse!
        try {
          if (!stdout || !stdout.trim()) {
            resolve([]); // No findings
          } else {
            resolve(JSON.parse(stdout));
          }
        } catch (parseErr) {
          reject(`Failed to parse TruffleHog output: ${parseErr}\nOutput was: ${stdout}`);
        }
      }
    );
  });
}


// Gitleaks
export const runGitleaks = async (repoPath) => {
  return new Promise((resolve, reject) => {
    exec(
      `docker run --rm -v ${repoPath}:/repo zricethezav/gitleaks:latest detect --source=/repo --report=/repo/gitleaks.json --no-banner`,
      (err, stdout, stderr) => {
        if (err) return reject(stderr || err.message);
        try {
          const reportJson = fs.readFileSync(`${repoPath}/gitleaks.json`, "utf8");
          resolve(JSON.parse(reportJson));
        } catch (readErr) {
          reject(readErr);
        }
      }
    );
  });
}
