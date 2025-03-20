// Simple serverless API endpoint
export default function handler(req, res) {
  res.status(200).json({
    message: 'Hello from Ani-Sage API',
    timestamp: new Date().toISOString()
  });
}