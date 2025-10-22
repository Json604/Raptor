// Rate Limiter - Prevents spam and abuse
// Limits scans per user/IP to prevent queue flooding

class RateLimiter {
  constructor(windowMs = 60000, maxRequests = 2) {
    this.windowMs = windowMs; // Time window in milliseconds
    this.maxRequests = maxRequests; // Max requests per window
    this.requests = new Map(); // Store: key -> [timestamps]
  }

  /**
   * Check if request is allowed
   * @param {string} key - Unique identifier (IP, user ID, etc.)
   * @returns {Object} - { allowed: boolean, retryAfter: number }
   */
  check(key) {
    const now = Date.now();
    const userRequests = this.requests.get(key) || [];
    
    // Remove old requests outside the time window
    const validRequests = userRequests.filter(timestamp => now - timestamp < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...validRequests);
      const retryAfter = Math.ceil((this.windowMs - (now - oldestRequest)) / 1000);
      
      return {
        allowed: false,
        retryAfter,
        message: `Rate limit exceeded. Please wait ${retryAfter} seconds before scanning again.`
      };
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    // Cleanup old entries periodically
    if (this.requests.size > 1000) {
      this.cleanup();
    }
    
    return {
      allowed: true,
      remaining: this.maxRequests - validRequests.length,
      resetAt: now + this.windowMs
    };
  }

  /**
   * Clean up old entries to prevent memory leaks
   * @private
   */
  cleanup() {
    const now = Date.now();
    for (const [key, timestamps] of this.requests.entries()) {
      const validRequests = timestamps.filter(t => now - t < this.windowMs);
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key) {
    this.requests.delete(key);
  }

  /**
   * Get current status for a key
   */
  getStatus(key) {
    const userRequests = this.requests.get(key) || [];
    const now = Date.now();
    const validRequests = userRequests.filter(t => now - t < this.windowMs);
    
    return {
      requestCount: validRequests.length,
      maxRequests: this.maxRequests,
      remaining: Math.max(0, this.maxRequests - validRequests.length),
      windowMs: this.windowMs
    };
  }
}

// Create rate limiter instances
// 1 scan per minute per IP (prevents spam)
export const scanRateLimiter = new RateLimiter(60000, 2);

// Export class for custom limiters
export { RateLimiter };

