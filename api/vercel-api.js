// A minimal serverless function for Vercel compatibility
// This follows Vercel's serverless function format

export default function handler(req, res) {
  res.status(200).json({
    message: 'This is a serverless function to help with Vercel deployment',
    timestamp: new Date().toISOString(),
    success: true
  });
}