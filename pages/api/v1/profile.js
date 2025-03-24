// v1 Profile API endpoint to directly serve fallback data

export default async function handler(req, res) {
  const { sessionId } = req.query;
  
  if (!sessionId) {
    return res.status(400).json({
      error: 'bad_request',
      message: 'Missing sessionId'
    });
  }
  
  console.log(`[Fallback API] /api/v1/profile accessed for session: ${sessionId}`);
  
  try {
    // Handle the request based on method
    if (req.method === 'GET') {
      // Return mock profile data
      console.log(`[Fallback API] GET /api/v1/profile serving mock data for session: ${sessionId}`);
      
      return res.status(200).json({
        profile: {
          dimensions: [
            {
              name: 'visualComplexity',
              value: 7.5,
              min: 1,
              max: 10,
              lowLabel: 'Simple, Clean',
              highLabel: 'Detailed, Complex'
            },
            {
              name: 'narrativeComplexity',
              value: 8.2,
              min: 1,
              max: 10,
              lowLabel: 'Straightforward',
              highLabel: 'Multi-layered'
            },
            {
              name: 'emotionalIntensity',
              value: 6.8,
              min: 1,
              max: 10,
              lowLabel: 'Gentle',
              highLabel: 'Intense'
            },
            {
              name: 'characterComplexity',
              value: 8.5,
              min: 1,
              max: 10,
              lowLabel: 'Archetypal',
              highLabel: 'Nuanced'
            },
            {
              name: 'moralAmbiguity',
              value: 7.9,
              min: 1,
              max: 10,
              lowLabel: 'Clear Morals',
              highLabel: 'Ambiguous'
            }
          ],
          confidences: {},
          answeredQuestions: [],
          suggestedAdjustments: [
            {
              dimension: 'Narrative Complexity',
              explanation: 'Based on your answers, we suggest adjusting this value.',
              currentValue: 8.2,
              suggestedValue: 9.1
            }
          ]
        }
      });
    } else if (req.method === 'POST') {
      // Handle profile update
      const { answers } = req.body;
      
      console.log(`[Fallback API] POST /api/v1/profile received answers for session ${sessionId}:`, answers);
      
      return res.status(200).json({
        success: true,
        profile: {
          dimensions: [
            {
              name: 'visualComplexity',
              value: 7.5,
              min: 1,
              max: 10,
              lowLabel: 'Simple, Clean',
              highLabel: 'Detailed, Complex'
            },
            {
              name: 'narrativeComplexity',
              value: 8.2,
              min: 1,
              max: 10,
              lowLabel: 'Straightforward',
              highLabel: 'Multi-layered'
            },
            {
              name: 'emotionalIntensity',
              value: 6.8,
              min: 1,
              max: 10,
              lowLabel: 'Gentle',
              highLabel: 'Intense'
            },
            {
              name: 'characterComplexity',
              value: 8.5,
              min: 1,
              max: 10,
              lowLabel: 'Archetypal',
              highLabel: 'Nuanced'
            },
            {
              name: 'moralAmbiguity',
              value: 7.9,
              min: 1,
              max: 10,
              lowLabel: 'Clear Morals',
              highLabel: 'Ambiguous'
            }
          ],
          confidences: {},
          answeredQuestions: []
        }
      });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error(`[Fallback API] Error in /api/v1/profile:`, error);
    return res.status(500).json({
      error: 'server_error',
      message: 'Error processing profile request',
      details: String(error)
    });
  }
}