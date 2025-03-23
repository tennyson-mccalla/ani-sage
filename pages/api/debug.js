// Debug API endpoint that redirects to the v1 version

export default function handler(req, res) {
  // Log that we're using the debug endpoint
  console.log('Debug API endpoint accessed');
  
  // Return simple debug information
  return res.status(200).json({
    message: "Debug endpoint accessible",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    v1ApiAvailable: true,
    redirectPath: "/api/v1/debug"
  });
}