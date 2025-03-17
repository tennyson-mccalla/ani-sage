import { Env } from './types';
import { handleSession } from './handlers/session';
import { handleQuestions } from './handlers/questions';
import { handleProfile } from './handlers/profile';
import { handleRecommendations } from './handlers/recommendations';
import { handleAnimeDetails } from './handlers/anime-details';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Set CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    // Parse the URL
    const url = new URL(request.url);
    const pathname = url.pathname;
    const apiVersion = env.API_VERSION;

    try {
      // API routing
      if (pathname === `/api/${apiVersion}/session`) {
        return handleSession(request, env, corsHeaders);
      } else if (pathname === `/api/${apiVersion}/questions`) {
        return handleQuestions(request, env, corsHeaders);
      } else if (pathname.match(new RegExp(`^/api/${apiVersion}/questions/[\\w-]+/answer$`))) {
        return handleQuestions(request, env, corsHeaders);
      } else if (pathname === `/api/${apiVersion}/profile`) {
        return handleProfile(request, env, corsHeaders);
      } else if (pathname === `/api/${apiVersion}/recommendations`) {
        return handleRecommendations(request, env, corsHeaders);
      } else if (pathname.match(new RegExp(`^/api/${apiVersion}/recommendations/[\\w-]+$`))) {
        return handleAnimeDetails(request, env, corsHeaders);
      } else {
        return new Response(
          JSON.stringify({ error: 'not_found', message: 'Endpoint not found' }),
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }
    } catch (error) {
      console.error('Error handling request:', error);
      return new Response(
        JSON.stringify({
          error: 'server_error',
          message: 'Internal server error',
          details: String(error),
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
  },
};
