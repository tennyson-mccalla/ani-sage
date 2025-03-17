import { Env, AnimeRecommendation, ApiResponse } from '../types';

// Mock anime details for development
const mockAnimeDetails: Record<string, AnimeRecommendation> = {
  'attack-on-titan': {
    id: 'attack-on-titan',
    title: 'Attack on Titan',
    image: 'https://example.com/aot.jpg',
    genres: ['Action', 'Drama', 'Fantasy'],
    score: 8.5,
    synopsis: 'Humanity lives inside cities surrounded by enormous walls due to the Titans, gigantic humanoid creatures who devour humans seemingly without reason.',
    match: 0.85,
    reasons: ['Matches your preference for complex storylines', 'High action content'],
    trailer: 'https://example.com/aot-trailer.mp4'
  },
  'your-name': {
    id: 'your-name',
    title: 'Your Name',
    image: 'https://example.com/your-name.jpg',
    genres: ['Romance', 'Drama', 'Supernatural'],
    score: 8.8,
    synopsis: 'Two teenagers share a profound, magical connection upon discovering they are swapping bodies.',
    match: 0.82,
    reasons: ['Beautiful visual style', 'Emotional storytelling'],
    trailer: 'https://example.com/your-name-trailer.mp4'
  }
};

export async function handleAnimeDetails(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const match = pathname.match(/\/recommendations\/([^\/]+)$/);

    if (!match) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'invalid_request',
          message: 'Invalid anime ID format'
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

    const animeId = match[1];

    // For now, return mock anime details
    // In a real implementation, you would fetch this from a database or external API
    const animeDetails = mockAnimeDetails[animeId];

    if (!animeDetails) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'not_found',
          message: 'Anime not found'
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

    return new Response(
      JSON.stringify({
        success: true,
        data: animeDetails
      } as ApiResponse<AnimeRecommendation>),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    console.error('Error handling anime details:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'server_error',
        message: 'Error handling anime details',
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
