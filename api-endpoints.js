/**
 * API Endpoint Specifications
 * 
 * This document outlines the API endpoints for the backend services
 * of the Psychological Anime Recommendation System.
 */

/**
 * BASE URL: /api/v1
 */

/**
 * User Session Management
 */

/**
 * GET /session
 * 
 * Initialize or retrieve a user session
 * 
 * Request:
 * - Headers:
 *   - Authorization: Bearer <token> (optional)
 * 
 * Response:
 * - 200 OK
 *   {
 *     "sessionId": "string",
 *     "isNewUser": boolean,
 *     "profileConfidence": number, // 0-1 indicating overall profile confidence
 *     "interactionCount": number   // Number of previous interactions
 *   }
 */

/**
 * Questions API
 */

/**
 * GET /questions
 * 
 * Get personalized questions for the user
 * 
 * Request:
 * - Headers:
 *   - Authorization: Bearer <token>
 * - Query Parameters:
 *   - count: number (default: 3) - Number of questions to return
 *   - stage: number (optional) - Specific stage to retrieve questions from
 * 
 * Response:
 * - 200 OK
 *   {
 *     "questions": [
 *       {
 *         "id": "string",
 *         "type": "text|image|color|scenario|preference",
 *         "text": "string",
 *         "description": "string" (optional),
 *         "imageUrl": "string" (optional),
 *         "options": [
 *           {
 *             "id": "string",
 *             "text": "string",
 *             "imageUrl": "string" (optional)
 *           }
 *         ]
 *       }
 *     ]
 *   }
 * 
 * - 401 Unauthorized
 * - 500 Internal Server Error
 */

/**
 * POST /questions/{questionId}/answer
 * 
 * Submit an answer to a question
 * 
 * Request:
 * - Headers:
 *   - Authorization: Bearer <token>
 * - Path Parameters:
 *   - questionId: string
 * - Body:
 *   {
 *     "optionId": "string"
 *   }
 * 
 * Response:
 * - 200 OK
 *   {
 *     "success": true,
 *     "profileUpdated": true,
 *     "nextAction": "more_questions|show_samples|show_recommendations"
 *   }
 * 
 * - 400 Bad Request - Invalid option
 * - 401 Unauthorized
 * - 404 Not Found - Question not found
 * - 500 Internal Server Error
 */

/**
 * GET /questions/visual-samples
 * 
 * Get visual samples for user feedback
 * 
 * Request:
 * - Headers:
 *   - Authorization: Bearer <token>
 * - Query Parameters:
 *   - type: string (default: "art_style") - Type of samples: art_style, color_palette, scene_type
 *   - count: number (default: 4) - Number of samples to return
 * 
 * Response:
 * - 200 OK
 *   {
 *     "samples": [
 *       {
 *         "id": "string",
 *         "imageUrl": "string",
 *         "description": "string",
 *         "attributes": {
 *           // Psychological attributes this sample represents
 *           "dimension1": number,
 *           "dimension2": number
 *         }
 *       }
 *     ]
 *   }
 * 
 * - 401 Unauthorized
 * - 500 Internal Server Error
 */

/**
 * POST /questions/visual-samples/feedback
 * 
 * Submit feedback on visual samples
 * 
 * Request:
 * - Headers:
 *   - Authorization: Bearer <token>
 * - Body:
 *   {
 *     "sampleId": "string",
 *     "rating": number, // 1-5 scale
 *     "feedback": "string" (optional)
 *   }
 * 
 * Response:
 * - 200 OK
 *   {
 *     "success": true,
 *     "profileUpdated": true
 *   }
 * 
 * - 400 Bad Request - Invalid sample or rating
 * - 401 Unauthorized
 * - 500 Internal Server Error
 */

/**
 * Psychological Profile API
 */

/**
 * GET /profile
 * 
 * Get user's current psychological profile
 * 
 * Request:
 * - Headers:
 *   - Authorization: Bearer <token>
 * - Query Parameters:
 *   - includeConfidence: boolean (default: false) - Include confidence values
 *   - includeHistory: boolean (default: false) - Include profile history
 * 
 * Response:
 * - 200 OK
 *   {
 *     "dimensions": {
 *       "dimension1": number,
 *       "dimension2": number,
 *       // ...
 *     },
 *     "confidences": { // Only if includeConfidence=true
 *       "dimension1": number,
 *       "dimension2": number,
 *       // ...
 *     },
 *     "interactionCount": number,
 *     "lastUpdated": "string" (ISO date),
 *     "history": [ // Only if includeHistory=true
 *       {
 *         "timestamp": "string" (ISO date),
 *         "dimensions": {
 *           "dimension1": number,
 *           "dimension2": number
 *         }
 *       }
 *     ]
 *   }
 * 
 * - 401 Unauthorized
 * - 500 Internal Server Error
 */

/**
 * Recommendations API
 */

/**
 * GET /recommendations
 * 
 * Get personalized anime recommendations
 * 
 * Request:
 * - Headers:
 *   - Authorization: Bearer <token>
 * - Query Parameters:
 *   - count: number (default: 10) - Number of recommendations to return
 *   - includeReasons: boolean (default: true) - Include match reasons
 *   - includeAttributes: boolean (default: false) - Include psychological attributes
 * 
 * Response:
 * - 200 OK
 *   {
 *     "recommendations": [
 *       {
 *         "id": "string",
 *         "title": "string",
 *         "synopsis": "string",
 *         "genres": ["string"],
 *         "imageUrls": {
 *           "poster": "string",
 *           "banner": "string"
 *         },
 *         "score": number, // Match score (0-10)
 *         "externalIds": {
 *           "malId": number,
 *           "anilistId": number,
 *           "tmdbId": number,
 *           "youtubeTrailerId": "string"
 *         },
 *         "matchReasons": [ // Only if includeReasons=true
 *           {
 *             "dimension": "string",
 *             "strength": number,
 *             "explanation": "string"
 *           }
 *         ],
 *         "attributes": { // Only if includeAttributes=true
 *           "dimension1": number,
 *           "dimension2": number
 *         }
 *       }
 *     ]
 *   }
 * 
 * - 401 Unauthorized
 * - 500 Internal Server Error
 */

/**
 * GET /recommendations/{animeId}
 * 
 * Get detailed information about a specific anime
 * 
 * Request:
 * - Headers:
 *   - Authorization: Bearer <token>
 * - Path Parameters:
 *   - animeId: string
 * 
 * Response:
 * - 200 OK
 *   {
 *     "id": "string",
 *     "title": "string",
 *     "alternativeTitles": ["string"],
 *     "synopsis": "string",
 *     "genres": ["string"],
 *     "year": number,
 *     "season": "string",
 *     "episodeCount": number,
 *     "rating": number,
 *     "popularity": number,
 *     "imageUrls": {
 *       "poster": "string",
 *       "banner": "string",
 *       "thumbnail": "string"
 *     },
 *     "externalIds": {
 *       "malId": number,
 *       "anilistId": number,
 *       "tmdbId": number,
 *       "youtubeTrailerId": "string"
 *     },
 *     "matchScore": number, // Match score for current user
 *     "matchReasons": [
 *       {
 *         "dimension": "string",
 *         "strength": number,
 *         "explanation": "string"
 *       }
 *     ],
 *     "similarTitles": [
 *       {
 *         "id": "string",
 *         "title": "string",
 *         "imageUrl": "string"
 *       }
 *     ]
 *   }
 * 
 * - 401 Unauthorized
 * - 404 Not Found - Anime not found
 * - 500 Internal Server Error
 */

/**
 * POST /recommendations/{animeId}/feedback
 * 
 * Submit feedback on a recommendation
 * 
 * Request:
 * - Headers:
 *   - Authorization: Bearer <token>
 * - Path Parameters:
 *   - animeId: string
 * - Body:
 *   {
 *     "interactionType": "viewed|selected|watched|rated",
 *     "rating": number, // 1-10 scale, only if interactionType=rated
 *     "feedback": "string" (optional)
 *   }
 * 
 * Response:
 * - 200 OK
 *   {
 *     "success": true,
 *     "profileUpdated": boolean
 *   }
 * 
 * - 400 Bad Request - Invalid interaction type or rating
 * - 401 Unauthorized
 * - 404 Not Found - Anime not found
 * - 500 Internal Server Error
 */

/**
 * External API Integration
 */

/**
 * GET /anime/search
 * 
 * Search for anime by title (admin/development endpoint)
 * 
 * Request:
 * - Headers:
 *   - Authorization: Bearer <token> (admin)
 * - Query Parameters:
 *   - query: string - Search query
 *   - limit: number (default: 10) - Number of results to return
 * 
 * Response:
 * - 200 OK
 *   {
 *     "results": [
 *       {
 *         "id": "string",
 *         "title": "string",
 *         "synopsis": "string",
 *         "imageUrl": "string",
 *         "source": "string" // mal|anilist|tmdb
 *       }
 *     ]
 *   }
 * 
 * - 401 Unauthorized
 * - 403 Forbidden - Not an admin
 * - 500 Internal Server Error
 */

/**
 * MCP Management (Development/Testing)
 */

/**
 * GET /mcp/status
 * 
 * Check MCP context status
 * 
 * Request:
 * - Headers:
 *   - Authorization: Bearer <token> (admin)
 * 
 * Response:
 * - 200 OK
 *   {
 *     "connected": boolean,
 *     "userCount": number,
 *     "status": "string"
 *   }
 * 
 * - 401 Unauthorized
 * - 403 Forbidden - Not an admin
 * - 500 Internal Server Error
 */

/**
 * POST /mcp/reset
 * 
 * Reset current user's MCP context (testing)
 * 
 * Request:
 * - Headers:
 *   - Authorization: Bearer <token>
 * 
 * Response:
 * - 200 OK
 *   {
 *     "success": boolean,
 *     "newSessionId": "string"
 *   }
 * 
 * - 401 Unauthorized
 * - 500 Internal Server Error
 */

/**
 * Error Responses
 * 
 * All endpoints may return these error responses:
 * 
 * - 400 Bad Request
 *   {
 *     "error": "string",
 *     "message": "string",
 *     "details": {} (optional)
 *   }
 * 
 * - 401 Unauthorized
 *   {
 *     "error": "unauthorized",
 *     "message": "Authentication required"
 *   }
 * 
 * - 403 Forbidden
 *   {
 *     "error": "forbidden",
 *     "message": "Insufficient permissions"
 *   }
 * 
 * - 404 Not Found
 *   {
 *     "error": "not_found",
 *     "message": "Resource not found",
 *     "resourceType": "string" (optional)
 *   }
 * 
 * - 429 Too Many Requests
 *   {
 *     "error": "rate_limited",
 *     "message": "Too many requests",
 *     "retryAfter": number (seconds)
 *   }
 * 
 * - 500 Internal Server Error
 *   {
 *     "error": "server_error",
 *     "message": "An unexpected error occurred",
 *     "requestId": "string" (for tracking)
 *   }
 */
