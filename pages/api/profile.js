// Legacy profile endpoint from Pages Router

export default async function handler(req, res) {
  const { sessionId } = req.query;
  
  if (!sessionId) {
    return res.status(400).json({
      error: 'bad_request',
      message: 'Missing sessionId'
    });
  }
  
  console.log(`[Legacy API] /api/profile accessed for session: ${sessionId}`);
  
  try {
    // Handle the request based on method
    if (req.method === 'GET') {
      // Forward to the App Router endpoint
      try {
        const appRouterUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/v1/profile?sessionId=${sessionId}`;
        const response = await fetch(appRouterUrl);
        const data = await response.json();
        return res.status(response.status).json(data);
      } catch (err) {
        console.error(`[Legacy API] Error forwarding to App Router:`, err);
        
        // Return mock data on error
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
            answeredQuestions: []
          }
        });
      }
    } else if (req.method === 'POST') {
      // Handle profile update
      const { answers } = req.body;
      
      console.log(`[Legacy API] POST /api/profile received answers for session ${sessionId}:`, answers);
      
      // Forward to the App Router endpoint
      try {
        const appRouterUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/v1/profile?sessionId=${sessionId}`;
        const response = await fetch(appRouterUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ answers })
        });
        const data = await response.json();
        return res.status(response.status).json(data);
      } catch (err) {
        console.error(`[Legacy API] Error forwarding to App Router:`, err);
        
        // Return mock data on error
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
      }
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error(`[Legacy API] Error in /api/profile:`, error);
    return res.status(500).json({
      error: 'server_error',
      message: 'Error processing profile request',
      details: String(error)
    });
  }
}