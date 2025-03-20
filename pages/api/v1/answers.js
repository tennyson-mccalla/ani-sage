// Answers API endpoint

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { questionId, optionId, sessionId } = req.body;
    
    if (!questionId || !optionId || !sessionId) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'Missing required fields'
      });
    }
    
    console.log(`Recording answer for session ${sessionId}: ${questionId} = ${optionId}`);
    
    return res.status(200).json({
      success: true,
      message: 'Answer recorded successfully'
    });
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}