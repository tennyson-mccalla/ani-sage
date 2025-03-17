import { Env, Session, ApiResponse } from '../types';

export async function handleSession(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // Generate a new session ID
    const sessionId = `session_${Date.now()}`;

    // Create new session
    const session: Session = {
      id: sessionId,
      created: new Date().toISOString(),
      isNewUser: true,
      profileConfidence: 0,
      interactionCount: 0
    };

    // Store session in KV
    await env.SESSIONS.put(sessionId, JSON.stringify(session), {
      expirationTtl: 60 * 60 * 24 * 30 // 30 days
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: session
      } as ApiResponse<Session>),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    console.error('Error creating session:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'server_error',
        message: 'Error creating session',
        details: String(error)
      } as ApiResponse<null>),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
}
