import { Env, Profile, AnimeRecommendation, ApiResponse } from '../types';

// Mock anime data for development
const mockAnime: AnimeRecommendation[] = [
  {
    id: 'attack-on-titan',
    title: 'Attack on Titan',
    image: 'https://example.com/aot.jpg',
    genres: ['Action', 'Drama', 'Fantasy'],
    score: 8.5,
    synopsis: 'Humanity lives inside cities surrounded by enormous walls due to the Titans, gigantic humanoid creatures who devour humans seemingly without reason.',
    match: 0.85,
    reasons: ['Matches your preference for complex storylines', 'High action content']
  },
  {
    id: 'your-name',
    title: 'Your Name',
    image: 'https://example.com/your-name.jpg',
    genres: ['Romance', 'Drama', 'Supernatural'],
    score: 8.8,
    synopsis: 'Two teenagers share a profound, magical connection upon discovering they are swapping bodies.',
    match: 0.82,
    reasons: ['Beautiful visual style', 'Emotional storytelling']
  }
];

export async function handleRecommendations(
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

    // For now, return mock recommendations
    // In a real implementation, you would use the profile data to generate personalized recommendations
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          recommendations: mockAnime
        }
      } as ApiResponse<{ recommendations: AnimeRecommendation[] }>),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    console.error('Error handling recommendations:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'server_error',
        message: 'Error handling recommendations',
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
