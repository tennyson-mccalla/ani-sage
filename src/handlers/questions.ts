import { Env, ApiResponse } from '../types';

interface Question {
  id: string;
  type: 'text' | 'scenario';
  text: string;
  options: Array<{
    id: string;
    text: string;
  }>;
}

// Mock questions for development
const mockQuestions: Question[] = [
  {
    id: 'visual-style',
    type: 'text',
    text: 'Which visual style do you prefer in anime?',
    options: [
      { id: 'clean-simple', text: 'Clean and simple visuals, with emphasis on character expressions' },
      { id: 'balanced', text: 'Balanced visuals with moderate detail' },
      { id: 'detailed', text: 'Highly detailed and intricate visuals' },
      { id: 'dynamic', text: 'Dynamic and energetic visuals with lots of movement' }
    ]
  },
  {
    id: 'narrative-complexity',
    type: 'text',
    text: 'How do you feel about complex storylines?',
    options: [
      { id: 'low-complexity', text: 'I prefer straightforward stories that are easy to follow' },
      { id: 'medium-complexity', text: 'I enjoy some complexity but don\'t want to feel lost' },
      { id: 'high-complexity', text: 'I love intricate plots with multiple layers and twists' }
    ]
  }
];

export async function handleQuestions(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const isAnswerEndpoint = pathname.match(/\/answer$/);

    if (isAnswerEndpoint) {
      // Handle submitting an answer
      if (request.method !== 'POST') {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'method_not_allowed',
            message: 'Only POST method is allowed for submitting answers'
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

      const body = await request.json();
      const { sessionId, questionId, optionId } = body;

      if (!sessionId || !questionId || !optionId) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'invalid_request',
            message: 'Missing required fields: sessionId, questionId, or optionId'
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

      // Get the session
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

      // Get or create profile
      let profileStr = await env.PROFILES.get(sessionId);
      let profile = profileStr ? JSON.parse(profileStr) : {
        dimensions: {},
        confidences: {},
        answeredQuestions: [],
        suggestedAdjustments: []
      };

      // Update profile based on answer
      profile.answeredQuestions.push(questionId);
      // Here you would typically update dimensions and confidences based on the answer
      // For now, we'll just return success

      // Store updated profile
      await env.PROFILES.put(sessionId, JSON.stringify(profile));

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            profileUpdated: true,
            nextAction: profile.answeredQuestions.length >= 5 ? 'get_recommendations' : 'more_questions'
          }
        } as ApiResponse<{ profileUpdated: boolean; nextAction: string }>),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    } else {
      // Handle getting questions
      if (request.method !== 'GET') {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'method_not_allowed',
            message: 'Only GET method is allowed for getting questions'
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

      // Get session ID from query params
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

      // Get profile to check answered questions
      const profileStr = await env.PROFILES.get(sessionId);
      const profile = profileStr ? JSON.parse(profileStr) : { answeredQuestions: [] };

      // Filter out already answered questions
      const unansweredQuestions = mockQuestions.filter(
        q => !profile.answeredQuestions.includes(q.id)
      );

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            questions: unansweredQuestions.slice(0, 2) // Return up to 2 questions at a time
          }
        } as ApiResponse<{ questions: Question[] }>),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }
  } catch (error) {
    console.error('Error handling questions:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'server_error',
        message: 'Error handling questions',
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
