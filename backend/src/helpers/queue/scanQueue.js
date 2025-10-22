// Simple Scan Queue System - Prevents server crashes from concurrent scans
// Limits concurrent scans to prevent RAM overload on Railway

class ScanQueue {
  constructor(maxConcurrent = 2) {
    this.maxConcurrent = maxConcurrent;
    this.currentScans = 0;
    this.queue = [];
    this.totalProcessed = 0;
    this.totalQueued = 0;
  }

  /**
   * Add a scan to the queue
   * @param {Function} scanFunction - The async function to execute
   * @param {Object} metadata - Optional metadata for tracking
   * @returns {Promise} - Resolves with scan result
   */
  async add(scanFunction, metadata = {}) {
    this.totalQueued++;
    const queuePosition = this.queue.length + 1;
    
    console.log(`📋 Scan queued. Position: ${queuePosition}, Current scans: ${this.currentScans}/${this.maxConcurrent}`);

    // If under limit, run immediately
    if (this.currentScans < this.maxConcurrent) {
      return this.execute(scanFunction, metadata);
    }

    // Otherwise, wait in queue
    return new Promise((resolve, reject) => {
      this.queue.push({ 
        scanFunction, 
        resolve, 
        reject, 
        metadata,
        queuedAt: Date.now()
      });
    });
  }

  /**
   * Execute a scan function
   * @private
   */
  async execute(scanFunction, metadata = {}) {
    this.currentScans++;
    const startTime = Date.now();
    
    console.log(`🚀 Scan started. Active scans: ${this.currentScans}/${this.maxConcurrent}`);

    try {
      const result = await scanFunction();
      this.totalProcessed++;
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Scan completed in ${duration}s. Processed: ${this.totalProcessed}`);
      
      return result;
    } catch (error) {
      console.error(`❌ Scan failed:`, error.message);
      throw error;
    } finally {
      this.currentScans--;
      this.processNext();
    }
  }

  /**
   * Process next scan in queue
   * @private
   */
  processNext() {
    if (this.queue.length > 0 && this.currentScans < this.maxConcurrent) {
      const { scanFunction, resolve, reject, metadata, queuedAt } = this.queue.shift();
      const waitTime = ((Date.now() - queuedAt) / 1000).toFixed(2);
      
      console.log(`⏭️  Processing queued scan (waited ${waitTime}s). Queue remaining: ${this.queue.length}`);
      
      this.execute(scanFunction, metadata)
        .then(resolve)
        .catch(reject);
    }
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      currentScans: this.currentScans,
      maxConcurrent: this.maxConcurrent,
      queueLength: this.queue.length,
      totalProcessed: this.totalProcessed,
      totalQueued: this.totalQueued,
      available: this.currentScans < this.maxConcurrent
    };
  }

  /**
   * Get queue position for display to users
   */
  getQueuePosition() {
    return {
      position: this.queue.length + 1,
      estimatedWait: this.queue.length * 30 // Rough estimate: 30s per scan
    };
  }
}

// Create singleton instance
// Max 2 concurrent scans for Railway $5 plan (512MB RAM)
// Each scan uses ~150MB, so 2 scans = ~300MB, leaving ~200MB for Node.js
export const scanQueue = new ScanQueue(2);

// Export class for testing
export { ScanQueue };

