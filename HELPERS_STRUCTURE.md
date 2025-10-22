# 📁 Helpers Folder Structure

## New Organized Structure

```
src/helpers/
├── scanners/              # All security scanning tools
│   ├── configScanner.js      # Configuration exposure detection
│   ├── dependencyScanner.js  # npm audit integration
│   ├── runScans.js          # TruffleHog + Gitleaks runners
│   └── webScanner.js        # Web security + Nuclei scanner
│
├── repo/                  # Repository handling utilities
│   ├── zipRepo.js           # Download GitHub repo as ZIP
│   ├── unzipRepo.js         # Extract ZIP archives
│   └── verifyRepo.js        # Validate repo URLs
│
├── queue/                 # Request management
│   ├── scanQueue.js         # Concurrent scan queue (max 2)
│   └── rateLimiter.js       # Rate limiting (1/min per IP)
│
└── formatters/            # Output formatting
    └── formatter.js         # Plain-English result formatting
```

## Import Paths

### Scanners:
```javascript
import { runGitleaks, runTruffleHog } from "../helpers/scanners/runScans.js"
import { scanConfigExposure } from "../helpers/scanners/configScanner.js"
import { scanDependencies } from "../helpers/scanners/dependencyScanner.js"
import { scanWebUrl, runNuclei } from "../helpers/scanners/webScanner.js"
```

### Repository:
```javascript
import { axiosURLverifier } from "../helpers/repo/verifyRepo.js"
import { zipDownloader } from "../helpers/repo/zipRepo.js"
import { unzipRepo } from "../helpers/repo/unzipRepo.js"
```

### Queue:
```javascript
import { scanQueue } from "../helpers/queue/scanQueue.js"
import { scanRateLimiter } from "../helpers/queue/rateLimiter.js"
```

### Formatters:
```javascript
import { formatScanResults } from "../helpers/formatters/formatter.js"
```

## Benefits

✅ **Better Organization** - Related files grouped together  
✅ **Easier Navigation** - Find files by purpose  
✅ **Scalability** - Easy to add new scanners/helpers  
✅ **Maintainability** - Clear separation of concerns  

---

Generated: October 22, 2025

