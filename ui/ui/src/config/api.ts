/**
 * API Configuration
 *
 * This file contains configuration for the API service.
 */

interface ApiConfig {
  baseUrl: string;
  enableMockApi: boolean;
  timeouts: {
    default: number;
    recommendations: number;
  };
  sessionStorage: {
    authTokenKey: string;
    sessionIdKey: string;
  };
}

// Default configuration
export const apiConfig: ApiConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  enableMockApi: import.meta.env.VITE_ENABLE_MOCK_API === 'true' || !import.meta.env.VITE_API_BASE_URL,
  timeouts: {
    default: 15000, // 15 seconds
    recommendations: 30000 // 30 seconds
  },
  sessionStorage: {
    authTokenKey: 'ani_sage_auth_token',
    sessionIdKey: 'ani_sage_session_id'
  }
};
