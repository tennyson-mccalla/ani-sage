import { Env, Profile, ApiResponse } from '../types';

export async function handleProfile(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'invalid_request',
          message: 'Missing sessionId parameter'
        } as ApiResponse<null>),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    // Verify session exists
    const sessionStr = await env.SESSIONS.get(sessionId);
    if (!sessionStr) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'not_found',
          message: 'Session not found'
        } as ApiResponse<null>),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    if (request.method === 'GET') {
      // Get profile
      const profileStr = await env.PROFILES.get(sessionId);
      if (!profileStr) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'not_found',
            message: 'Profile not found'
          } as ApiResponse<null>),
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        );
      }

      const profile: Profile = JSON.parse(profileStr);

      return new Response(
        JSON.stringify({
          success: true,
          data: profile
        } as ApiResponse<Profile>),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    } else if (request.method === 'POST') {
      // Update profile
      const body = await request.json();
      const { dimensions, confidences } = body;

      if (!dimensions || !confidences) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'invalid_request',
            message: 'Missing required fields: dimensions or confidences'
          } as ApiResponse<null>),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        );
      }

      // Get existing profile or create new one
      const profileStr = await env.PROFILES.get(sessionId);
      const profile: Profile = profileStr ? JSON.parse(profileStr) : {
        dimensions: {},
        confidences: {},
        answeredQuestions: [],
        suggestedAdjustments: []
      };

      // Update profile
      profile.dimensions = dimensions;
      profile.confidences = confidences;

      // Store updated profile
      await env.PROFILES.put(sessionId, JSON.stringify(profile));

      return new Response(
        JSON.stringify({
          success: true,
          data: profile
        } as ApiResponse<Profile>),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'method_not_allowed',
          message: 'Only GET and POST methods are allowed'
        } as ApiResponse<null>),
        {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }
  } catch (error) {
    console.error('Error handling profile:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'server_error',
        message: 'Error handling profile',
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
