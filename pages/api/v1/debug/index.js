// Debug API endpoint for v1 API

export default function handler(req, res) {
  // Log that we're using the debug endpoint
  console.log('[Fallback API] Debug API endpoint accessed via pages/api/v1/debug');
  
  // Return simple debug information
  return res.status(200).json({
    message: "Debug endpoint accessible",
    environment: process.env.NODE_ENV || 'unknown',
    timestamp: new Date().toISOString(),
    v1ApiAvailable: true,
    apiVersion: 'v1 (fallback)',
    isRunningFromPages: true,
    availableEndpoints: [
      '/api/v1/profile',
      '/api/v1/recommendations',
      '/api/v1/session',
      '/api/v1/debug'
    ]
  });
}