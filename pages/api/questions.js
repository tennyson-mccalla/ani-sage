// Questions API endpoint with real questions support
import { mockQuestions } from '../../app/lib/mock-data';

// Import the real question bank
// Note: For compatibility with both JS and TS, we use a try/catch
let realQuestions = [];
try {
  // Try to import from the question bank
  const questionBank = require('../../app/api/question-bank/index');
  if (questionBank && questionBank.questions) {
    realQuestions = questionBank.questions;
    console.log('Successfully loaded real questions from question bank');
  }
} catch (error) {
  console.error('Error loading real questions:', error);
}

export default function handler(req, res) {
  // Get session ID and count from query params
  const { sessionId, count } = req.query;
  const useRealApi = process.env.NEXT_PUBLIC_USE_REAL_API === 'true';
  
  if (!sessionId) {
    return res.status(400).json({ 
      error: 'bad_request',
      message: 'Missing sessionId' 
    });
  }
  
  // Log what we're using
  console.log(`Using ${useRealApi && realQuestions.length > 0 ? 'REAL' : 'MOCK'} questions API for sessionId: ${sessionId}`);
  
  // Determine which questions to use
  const questionsToUse = (useRealApi && realQuestions.length > 0) 
    ? realQuestions
    : mockQuestions;
  
  // Get the requested number of questions
  const limitedQuestions = questionsToUse.slice(0, count ? parseInt(count, 10) : 5);
  
  // Return the questions
  return res.status(200).json({
    questions: limitedQuestions,
    source: (useRealApi && realQuestions.length > 0) ? 'real' : 'mock'
  });
}