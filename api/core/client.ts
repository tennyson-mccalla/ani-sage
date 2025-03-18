/**
 * Base API client with common functionality for anime API integrations.
 *
 * Implements core features:
 * - Request handling with fetch API
 * - Response caching
 * - Automatic retry with exponential backoff
 * - Rate limiting with provider-specific limits
 * - Queue/delay mechanism to prevent hitting rate limits
 */

import { rateLimitManager } from './rate-limits.js';

// Response model
export interface APIResponse<T = any> {
  statusCode: number;
  data?: T;
  error?: string;
  headers: Record<string, string>;
}

// Request options
export interface RequestOptions {
  method: string;
  endpoint: string;
  params?: Record<string, any>;
  data?: Record<string, any> | string;
  headers?: Record<string, string>;
  useCache?: boolean;
}

// Cache key
interface CacheKey {
  url: string;
  params?: Record<string, any>;
}

// Cache item
interface CacheItem<T = any> {
  response: APIResponse<T>;
  timestamp: number;
}

export class BaseAPIClient {
  private baseUrl: string;
  private cacheEnabled: boolean;
  private rateLimitEnabled: boolean;
  private cache: Map<string, CacheItem>;
  private maxRetries: number;
  private retryBaseDelay: number;
  private retryMaxDelay: number;
  private retryableStatusCodes: Set<number>;
  private cacheTTL: number; // Time to live in milliseconds
  private providerName: string; // API provider name for rate limiting

  /**
   * Initialize the API client with reliability features.
   *
   * @param baseUrl Base URL for all API requests
   * @param options Options for the client behavior
   */
  constructor(baseUrl: string, options?: {
    enableCache?: boolean;
    enableRateLimit?: boolean;
    maxRetries?: number;
    retryBaseDelay?: number;
    retryMaxDelay?: number;
    retryableStatusCodes?: number[];
    cacheTTL?: number; // In seconds
    providerName?: string; // API provider name for rate limiting
  }) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.cacheEnabled = options?.enableCache ?? true;
    this.rateLimitEnabled = options?.enableRateLimit ?? true;
    this.maxRetries = options?.maxRetries ?? 3;
    this.retryBaseDelay = options?.retryBaseDelay ?? 1.0;
    this.retryMaxDelay = options?.retryMaxDelay ?? 60.0;
    this.retryableStatusCodes = new Set(options?.retryableStatusCodes ?? [408, 429, 500, 502, 503, 504]);
    this.cacheTTL = (options?.cacheTTL ?? 300) * 1000; // Convert to milliseconds
    this.cache = new Map();

    // Determine provider name from base URL if not explicitly provided
    this.providerName = options?.providerName || this.detectProviderFromUrl(baseUrl);
  }

  /**
   * Try to detect the provider name from the API URL
   *
   * @param url API base URL
   * @returns Provider name or 'unknown'
   */
  private detectProviderFromUrl(url: string): string {
    const urlLower = url.toLowerCase();

    if (urlLower.includes('youtube') || urlLower.includes('googleapis')) {
      return 'youtube';
    } else if (urlLower.includes('themoviedb') || urlLower.includes('tmdb')) {
      return 'tmdb';
    } else if (urlLower.includes('anilist')) {
      return 'anilist';
    } else if (urlLower.includes('myanimelist') || urlLower.includes('mal-api')) {
      return 'mal';
    }

    return 'unknown';
  }

  /**
   * Calculate delay for exponential backoff with jitter.
   *
   * @param attempt Current attempt number (0-based)
   * @param retryAfter Server provided retry-after time in seconds
   * @returns Delay time in milliseconds
   */
  private calculateBackoffDelay(attempt: number, retryAfter?: number): number {
    // If server provided a retry-after header, use that for the first retry
    if (retryAfter !== undefined) {
      return Math.min(retryAfter * 1000, this.retryMaxDelay * 1000);
    }

    // Calculate exponential backoff with full jitter
    // Formula: random between 0 and min(cap, base * 2 ^ attempt)
    const expBackoff = this.retryBaseDelay * Math.pow(2, attempt);
    const maxDelay = Math.min(this.retryMaxDelay, expBackoff);
    return Math.random() * maxDelay * 1000; // Convert to milliseconds
  }

  /**
   * Generate a cache key from a URL and params.
   *
   * @param cacheKey The URL and params to use as a cache key
   * @returns A string cache key
   */
  private generateCacheKey(cacheKey: CacheKey): string {
    const { url, params } = cacheKey;

    if (!params || Object.keys(params).length === 0) {
      return url;
    }

    // Sort params by key to ensure consistent cache keys
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');

    return `${url}?${sortedParams}`;
  }

  /**
   * Get a cached response if available and not expired.
   *
   * @param url The request URL
   * @param params The request parameters
   * @returns Cached response or undefined if not in cache or expired
   */
  private getCachedResponse<T>(url: string, params?: Record<string, any>): APIResponse<T> | undefined {
    if (!this.cacheEnabled) return undefined;

    const cacheKey = this.generateCacheKey({ url, params });
    const cachedItem = this.cache.get(cacheKey);

    if (!cachedItem) return undefined;

    // Check if cache is expired
    const now = Date.now();
    if (now - cachedItem.timestamp > this.cacheTTL) {
      this.cache.delete(cacheKey);
      return undefined;
    }

    return cachedItem.response as APIResponse<T>;
  }

  /**
   * Store a response in the cache.
   *
   * @param url The request URL
   * @param params The request parameters
   * @param response The response to cache
   */
  private cacheResponse<T>(url: string, params: Record<string, any> | undefined, response: APIResponse<T>): void {
    if (!this.cacheEnabled) return;

    const cacheKey = this.generateCacheKey({ url, params });
    this.cache.set(cacheKey, {
      response,
      timestamp: Date.now()
    });
  }

  /**
   * Execute a single HTTP request without retries.
   *
   * @param method HTTP method
   * @param url Request URL
   * @param params Query parameters
   * @param data Request body data
   * @param headers Custom request headers
   * @returns Response data, status, and headers
   * @throws Error if the request fails
   */
  private async executeRequest(
    method: string,
    url: string,
    params?: Record<string, any>,
    data?: Record<string, any> | string,
    headers?: Record<string, string>
  ): Promise<{
    statusCode: number;
    data: any;
    headers: Record<string, string>;
  }> {
    // Build URL with query parameters
    const urlObj = new URL(url);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          urlObj.searchParams.append(key, String(value));
        }
      });
    }

    const finalUrl = urlObj.toString();

    // Build request options
    const requestOptions: RequestInit = {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(headers || {})
      }
    };

    // Add body data if provided
    if (data) {
      if (typeof data === 'string') {
        requestOptions.body = data;
      } else {
        requestOptions.body = JSON.stringify(data);
      }
    }

    // Make the request
    const response = await fetch(finalUrl, requestOptions);

    // Extract headers into a plain object
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key.toLowerCase()] = value;
    });

    // Parse response
    let responseData;
    const contentType = response.headers.get('Content-Type') || '';
    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    // Check status code
    if (response.status >= 400) {
      let errorMsg = `API request failed: ${response.status}`;

      // Extract error details if available
      if (typeof responseData === 'object' && responseData !== null) {
        if (responseData.error || responseData.message) {
          const errorDetails = responseData.error ? `${responseData.error}: ` : '';
          const errorMessage = responseData.message || '';
          errorMsg = `${errorMsg} - ${errorDetails}${errorMessage}`;
        }
      } else if (responseData) {
        errorMsg = `${errorMsg} - ${responseData}`;
      }

      // Create error with extra properties
      const error = new Error(errorMsg) as Error & {
        statusCode: number;
        details?: Record<string, any>;
        retryAfter?: number;
      };

      error.statusCode = response.status;

      // Add retry-after if available
      if (response.status === 429 && responseHeaders['retry-after']) {
        const retryAfter = parseInt(responseHeaders['retry-after'], 10) || undefined;
        error.retryAfter = retryAfter;
      }

      throw error;
    }

    // Return successful response
    return {
      statusCode: response.status,
      data: responseData,
      headers: responseHeaders
    };
  }

  /**
   * Make an HTTP request with caching, rate limiting, retries, and backoff.
   *
   * @param options Request options (method, endpoint, params, data, headers)
   * @returns Promise resolving to the API response
   * @throws Error if all retry attempts fail or rate limited
   */
  public async request<T = any>(options: RequestOptions): Promise<APIResponse<T>> {
    const {
      method,
      endpoint,
      params,
      data,
      headers,
      useCache = true
    } = options;

    const url = `${this.baseUrl}/${endpoint.replace(/^\/+/, '')}`;

    // Check cache for GET requests
    if (useCache && method.toUpperCase() === 'GET') {
      const cachedResponse = this.getCachedResponse<T>(url, params);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    // Rate limiting check
    if (this.rateLimitEnabled) {
      // Check if we're allowed to make this request
      if (!rateLimitManager.checkLimit(this.providerName)) {
        // Calculate delay before we can try again
        const waitTime = rateLimitManager.getTimeUntilNextRequest(this.providerName);

        if (waitTime <= 0) {
          // Something is wrong with the rate limiter, proceed with caution
          console.warn(`Rate limiter reported limit exceeded but gave invalid wait time for ${this.providerName}`);
        } else if (waitTime < 10000) {
          // If wait time is reasonable, actually wait
          console.log(`Rate limit reached for ${this.providerName}, waiting ${waitTime}ms before retrying`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          // If wait time is too long, throw rate limit error
          const errorMsg = `Rate limit exceeded for ${this.providerName}. Try again in ${Math.ceil(waitTime / 1000)} seconds.`;
          const error = new Error(errorMsg) as Error & { statusCode: number };
          error.statusCode = 429;
          throw error;
        }
      }
    }

    // Initialize retry tracking
    let attempt = 0;
    let lastError: Error & { statusCode?: number; retryAfter?: number } | null = null;

    // Retry loop with exponential backoff
    while (attempt <= this.maxRetries) {
      try {
        // Record this request attempt for rate limiting
        if (this.rateLimitEnabled) {
          rateLimitManager.recordRequest(this.providerName);
        }

        // Execute the request
        const result = await this.executeRequest(method, url, params, data, headers);

        // Create successful response
        const apiResponse: APIResponse<T> = {
          statusCode: result.statusCode,
          data: result.data as T,
          headers: result.headers
        };

        // Cache successful GET responses
        if (useCache && method.toUpperCase() === 'GET') {
          this.cacheResponse<T>(url, params, apiResponse);
        }

        return apiResponse;
      } catch (err: any) {
        lastError = err;

        // Handle rate limiting errors specifically
        if (err.statusCode === 429) {
          // Extract retry-after if available
          let retryAfter: number | undefined;
          if (err.headers && err.headers['retry-after']) {
            retryAfter = parseInt(err.headers['retry-after'], 10);
          } else if (err.retryAfter) {
            retryAfter = err.retryAfter;
          }

          // Update rate limiter with the 429 response
          if (this.rateLimitEnabled) {
            rateLimitManager.handleRateLimitResponse(this.providerName, retryAfter);
          }
        }

        // Determine if we should retry based on the error
        let shouldRetry = false;
        let retryAfter: number | undefined;

        // Check for network errors (TypeErrors or failed to fetch)
        if (err instanceof TypeError) {
          shouldRetry = true;
        }
        // Check if status code is retryable
        else if (err.statusCode && this.retryableStatusCodes.has(err.statusCode)) {
          shouldRetry = true;
          // Get retry-after header if available
          if (err.statusCode === 429 && err.retryAfter) {
            retryAfter = err.retryAfter;
          }
        }

        // If we shouldn't retry or hit max retries, throw the error
        if (!shouldRetry || attempt >= this.maxRetries) {
          throw err;
        }

        // Calculate backoff delay with jitter
        const delay = this.calculateBackoffDelay(attempt, retryAfter);

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      }
    }

    // Re-throw the last error
    if (lastError) {
      throw lastError;
    }

    // This should never happen, but just in case
    throw new Error("Request failed after retries, but no error was thrown.");
  }

  /**
   * Clear the response cache.
   */
  public clearCache(): void {
    this.cache.clear();
  }
}
