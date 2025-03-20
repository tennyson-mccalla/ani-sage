// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  res.status(200).json({ 
    name: 'Ani-Sage API',
    version: '1.0.0',
    message: 'Hello from the API',
    timestamp: new Date().toISOString(),
   })
}