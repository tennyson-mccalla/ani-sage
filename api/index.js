// Root API endpoint
export default function handler(req, res) {
  res.status(200).json({
    name: 'Ani-Sage API',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
}