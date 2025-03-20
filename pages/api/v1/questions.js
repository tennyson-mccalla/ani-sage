// Simple questions API endpoint that returns mock data
import { mockQuestions } from '../../../app/lib/mock-data';

export default function handler(req, res) {
  // Get session ID from query params
  const { sessionId, count } = req.query;
  
  if (!sessionId) {
    return res.status(400).json({ 
      error: 'bad_request',
      message: 'Missing sessionId' 
    });
  }
  
  // Log that we're using the fallback API
  console.log('Using Pages API for questions with sessionId:', sessionId);
  
  // Return mock questions directly
  return res.status(200).json({
    questions: mockQuestions.slice(0, count ? parseInt(count, 10) : 5)
  });
}