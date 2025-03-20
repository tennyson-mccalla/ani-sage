// Session API endpoint

export default function handler(req, res) {
  if (req.method === 'POST') {
    // Create a new session
    const sessionId = `mock-session-${Date.now()}`;
    const profileId = `mock-profile-${Date.now()}`;
    
    console.log('Created mock session:', sessionId);
    console.log('With profile ID:', profileId);
    
    return res.status(200).json({
      sessionId: sessionId,
      profileId: profileId,
      success: true
    });
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}