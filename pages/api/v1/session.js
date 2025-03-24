// v1 Session API endpoint that creates and manages sessions

import { v4 as uuidv4 } from 'uuid';

export default function handler(req, res) {
  console.log(`[Fallback API] /api/v1/session accessed with method: ${req.method}`);
  
  if (req.method === 'POST') {
    // Generate a new session ID
    const sessionId = req.body.sessionId || uuidv4();
    const createdAt = new Date().toISOString();
    
    console.log(`[Fallback API] Created new session: ${sessionId}`);
    
    return res.status(200).json({
      sessionId,
      createdAt,
      message: 'Session created successfully'
    });
  } else if (req.method === 'GET') {
    // Check an existing session
    const { sessionId } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'Missing sessionId parameter'
      });
    }
    
    console.log(`[Fallback API] Validated existing session: ${sessionId}`);
    
    return res.status(200).json({
      sessionId,
      isValid: true,
      message: 'Session is valid'
    });
  } else {
    return res.status(405).json({
      error: 'method_not_allowed',
      message: `Method ${req.method} not allowed`
    });
  }
}