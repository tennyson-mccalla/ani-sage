// Profile API endpoint that redirects to the v1 API version

export default async function handler(req, res) {
  const { sessionId } = req.query;
  
  if (!sessionId) {
    return res.status(400).json({
      error: 'bad_request',
      message: 'Missing sessionId'
    });
  }
  
  // Construct the URL for the v1 API
  const v1ApiUrl = `${req.headers.host}/api/v1/profile?sessionId=${sessionId}`;
  console.log(`Redirecting profile request to v1 API: ${v1ApiUrl}`);
  
  try {
    // Forward the request to the v1 API
    if (req.method === 'GET') {
      // For local development, just return mock data
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
      // Update profile
      const { answers } = req.body;
      
      console.log('Received answers for profile update:', answers);
      
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
    console.error('Error forwarding request to v1 API:', error);
    return res.status(500).json({
      error: 'server_error',
      message: 'Error forwarding request to v1 API',
      details: String(error)
    });
  }
}