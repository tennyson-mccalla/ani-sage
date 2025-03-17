/**
 * API Rate Limits Configuration
 * 
 * This module defines rate limits for various API providers and implements 
 * a rate limiter to prevent exceeding these limits.
 */

/**
 * Rate limit configuration for an API
 */
export interface RateLimitConfig {
  // Maximum number of requests in the time window
  requestsPerWindow: number;
  
  // Time window in milliseconds
  windowMs: number;
  
  // Reset behavior: 'sliding' means the window slides with each request
  // 'fixed' means the window resets completely after windowMs
  resetBehavior: 'sliding' | 'fixed';
  
  // Optional custom error message
  errorMessage?: string;
}

/**
 * Rate limits by API provider
 * 
 * These values are based on the official documentation for each API
 */
export const API_RATE_LIMITS: Record<string, RateLimitConfig> = {
  // YouTube Data API v3
  // https://developers.google.com/youtube/v3/getting-started#quota
  'youtube': {
    requestsPerWindow: 100, // Daily quota is much higher (10,000), but we'll limit for safety
    windowMs: 60 * 1000, // 1 minute
    resetBehavior: 'sliding',
    errorMessage: 'YouTube API rate limit exceeded. The API has a daily quota, please try again later.'
  },
  
  // TMDb API
  // https://developer.themoviedb.org/docs/rate-limiting
  'tmdb': {
    requestsPerWindow: 40,
    windowMs: 10 * 1000, // 10 seconds
    resetBehavior: 'fixed',
    errorMessage: 'TMDb API rate limit exceeded. Please wait before making more requests.'
  },
  
  // AniList API
  // https://anilist.gitbook.io/anilist-apiv2-docs/overview/rate-limiting
  'anilist': {
    requestsPerWindow: 90,
    windowMs: 60 * 1000, // 1 minute
    resetBehavior: 'fixed',
    errorMessage: 'AniList API rate limit exceeded. Please wait before making more requests.'
  },
  
  // MyAnimeList API
  // Documented at 600 requests/minute for registered apps
  'mal': {
    requestsPerWindow: 30, // Conservative limit to prevent issues
    windowMs: 5 * 1000, // 5 seconds
    resetBehavior: 'sliding',
    errorMessage: 'MyAnimeList API rate limit exceeded. Please wait before making more requests.'
  }
};

/**
 * Rate limiter class that tracks requests and enforces limits
 */
export class RateLimiter {
  private providerName: string;
  private config: RateLimitConfig;
  private requestTimestamps: number[] = [];
  private nextAllowedRequestTime: number = 0;
  
  /**
   * Initialize a rate limiter for a specific API provider
   * 
   * @param providerName API provider name
   * @param customConfig Optional custom rate limit config to override defaults
   */
  constructor(providerName: string, customConfig?: Partial<RateLimitConfig>) {
    this.providerName = providerName;
    
    // Get the default config for this provider or use a conservative default
    const defaultConfig = API_RATE_LIMITS[providerName] || {
      requestsPerWindow: 10,
      windowMs: 1000,
      resetBehavior: 'sliding',
      errorMessage: 'API rate limit exceeded. Please wait before making more requests.'
    };
    
    // Merge custom config with defaults if provided
    this.config = {
      ...defaultConfig,
      ...customConfig
    };
  }
  
  /**
   * Check if a new request is allowed and update the internal state
   * 
   * @param dryRun If true, doesn't update internal state (just checks)
   * @returns True if request is allowed, false if rate limited
   */
  public checkLimit(dryRun = false): boolean {
    const now = Date.now();
    
    // If we've been completely blocked temporarily, check if we can reset
    if (this.nextAllowedRequestTime > 0) {
      if (now < this.nextAllowedRequestTime) {
        return false;
      }
      if (!dryRun) {
        this.nextAllowedRequestTime = 0;
        this.requestTimestamps = [];
      }
    }
    
    // Remove timestamps outside the current window
    const windowStart = now - this.config.windowMs;
    const validTimestamps = this.requestTimestamps.filter(ts => ts >= windowStart);
    
    // Check if we've hit the limit
    if (validTimestamps.length >= this.config.requestsPerWindow) {
      return false;
    }
    
    // Update state if not a dry run
    if (!dryRun) {
      this.requestTimestamps = validTimestamps;
      this.requestTimestamps.push(now);
    }
    
    return true;
  }
  
  /**
   * Record a request and check if rate limited
   * 
   * @returns True if request is allowed, false if rate limited
   */
  public recordRequest(): boolean {
    return this.checkLimit(false);
  }
  
  /**
   * Handle a rate limit response from the API
   * 
   * @param retryAfterSeconds Retry-After header value in seconds if provided
   */
  public handleRateLimitResponse(retryAfterSeconds?: number): void {
    // Clear current window and set a retry time
    const now = Date.now();
    this.requestTimestamps = [];
    
    // Use retry-after header if available, otherwise use our window
    if (retryAfterSeconds) {
      this.nextAllowedRequestTime = now + (retryAfterSeconds * 1000);
    } else {
      this.nextAllowedRequestTime = now + this.config.windowMs;
    }
  }
  
  /**
   * Get estimated time until next request is allowed
   * 
   * @returns Milliseconds until next request is allowed, 0 if requests are allowed now
   */
  public getTimeUntilNextRequest(): number {
    const now = Date.now();
    
    // If explicitly blocked, return time until unblocked
    if (this.nextAllowedRequestTime > now) {
      return this.nextAllowedRequestTime - now;
    }
    
    // If under the limit, return 0
    if (this.requestTimestamps.length < this.config.requestsPerWindow) {
      return 0;
    }
    
    // Calculate when the oldest request in the window will expire
    const oldestTimestamp = this.requestTimestamps[0];
    const timeUntilWindowAdvances = (oldestTimestamp + this.config.windowMs) - now;
    return Math.max(0, timeUntilWindowAdvances);
  }
  
  /**
   * Get the rate limit configuration for this limiter
   * 
   * @returns Rate limit config
   */
  public getConfig(): RateLimitConfig {
    return this.config;
  }
}

/**
 * A manager for rate limiters by API provider
 */
export class RateLimitManager {
  private limiters: Map<string, RateLimiter> = new Map();
  
  /**
   * Get or create a rate limiter for a specific provider
   * 
   * @param providerName API provider name
   * @returns Rate limiter instance
   */
  public getLimiter(providerName: string): RateLimiter {
    let limiter = this.limiters.get(providerName);
    
    if (!limiter) {
      limiter = new RateLimiter(providerName);
      this.limiters.set(providerName, limiter);
    }
    
    return limiter;
  }
  
  /**
   * Check if a request is allowed for a provider
   * 
   * @param providerName API provider name
   * @returns True if request is allowed, false if rate limited
   */
  public checkLimit(providerName: string): boolean {
    return this.getLimiter(providerName).checkLimit();
  }
  
  /**
   * Record a request for a provider and check if rate limited
   * 
   * @param providerName API provider name
   * @returns True if request is allowed, false if rate limited
   */
  public recordRequest(providerName: string): boolean {
    return this.getLimiter(providerName).recordRequest();
  }
  
  /**
   * Handle a rate limit response from a provider
   * 
   * @param providerName API provider name
   * @param retryAfterSeconds Retry-After header value in seconds if provided
   */
  public handleRateLimitResponse(providerName: string, retryAfterSeconds?: number): void {
    this.getLimiter(providerName).handleRateLimitResponse(retryAfterSeconds);
  }
  
  /**
   * Get estimated time until next request is allowed for a provider
   * 
   * @param providerName API provider name
   * @returns Milliseconds until next request is allowed
   */
  public getTimeUntilNextRequest(providerName: string): number {
    return this.getLimiter(providerName).getTimeUntilNextRequest();
  }
}

// Export a singleton instance for app-wide use
export const rateLimitManager = new RateLimitManager();