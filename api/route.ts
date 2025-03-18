import { NextRequest, NextResponse } from 'next/server';
import { AnimeApiAdapter, ApiProvider } from './anime-api-adapter.js';
import { createApiAdapter } from './index.js';
import { questions } from '../question-bank.js';
import { db, initDatabase } from './db.js';

// Initialize API adapter with configuration
const apiAdapter = createApiAdapter();

// Initialize database
initDatabase().catch(console.error);

// Helper function to handle CORS
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// Handle session initialization/retrieval
async function handleSession() {
  const sessionId = `session_${Date.now()}`;
  const profileId = `profile_${Date.now()}`;

  // Create a new profile
  const profile = {
    id: profileId,
    dimensions: {
      visualComplexity: 5,
      colorSaturation: 5,
      visualPace: 5,
      narrativeComplexity: 5,
      narrativePace: 5,
      plotPredictability: 5,
      characterComplexity: 5,
      characterGrowth: 5,
      emotionalIntensity: 5,
      emotionalValence: 0,
      moralAmbiguity: 5,
      fantasyRealism: 0,
      intellectualEmotional: 0,
      noveltyFamiliarity: 0,
    },
    confidences: {
      visualComplexity: 0.1,
      colorSaturation: 0.1,
      visualPace: 0.1,
      narrativeComplexity: 0.1,
      narrativePace: 0.1,
      plotPredictability: 0.1,
      characterComplexity: 0.1,
      characterGrowth: 0.1,
      emotionalIntensity: 0.1,
      emotionalValence: 0.1,
      moralAmbiguity: 0.1,
      fantasyRealism: 0.1,
      intellectualEmotional: 0.1,
      noveltyFamiliarity: 0.1,
    },
    answeredQuestions: []
  };

  await db.createProfile(profile);
  await db.createSession(sessionId, profileId);

  return NextResponse.json({
    sessionId,
    isNewUser: true,
    profileConfidence: 0,
    interactionCount: 0
  }, { headers: corsHeaders() });
}

// Handle getting questions
async function handleGetQuestions(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const count = searchParams.get('count') || '5';
    const stage = searchParams.get('stage');
    const sessionId = searchParams.get('sessionId');

    console.log(`Getting questions for session ${sessionId}, stage ${stage}, count ${count}`);

    if (!sessionId) {
      return NextResponse.json({
        error: 'bad_request',
        message: 'Missing sessionId'
      }, {
        status: 400,
        headers: corsHeaders()
      });
    }

    // Get session and profile
    const session = await db.getSession(sessionId);
    if (!session) {
      return NextResponse.json({
        error: 'not_found',
        message: 'Session not found'
      }, {
        status: 404,
        headers: corsHeaders()
      });
    }

    const profile = await db.getProfile(session.profileId);
    if (!profile) {
      return NextResponse.json({
        error: 'not_found',
        message: 'Profile not found'
      }, {
        status: 404,
        headers: corsHeaders()
      });
    }

    // Filter questions by stage if specified
    let availableQuestions: any[] = questions;
    if (stage) {
      const stageNum = parseInt(stage, 10);
      availableQuestions = questions.filter((q: any) => q.stage === stageNum);
      console.log(`Filtered to ${availableQuestions.length} questions for stage ${stageNum}`);
    }

    // Filter out questions that have already been answered
    availableQuestions = availableQuestions.filter((q: any) => !profile.answeredQuestions.includes(q.id));
    console.log(`${availableQuestions.length} questions available after filtering answered questions`);

    // If we have a user profile with dimensions and confidences, we can use it to select questions
    let selectedQuestions: any[] = [];

    if (profile.confidences) {
      // Sort dimensions by confidence ascending
      const sortedDimensions = Object.entries(profile.confidences)
        .map(([dimension, confidence]) => ({
          dimension,
          confidence: confidence as number
        }))
        .sort((a, b) => (a.confidence as number) - (b.confidence as number));

      // Target the dimensions with lowest confidence
      const targetDimensions = sortedDimensions
        .slice(0, 3)
        .map(d => d.dimension);

      console.log(`Targeting dimensions with lowest confidence: ${targetDimensions.join(', ')}`);

      // Find questions that target these dimensions
      const targetingQuestions = availableQuestions.filter((q: any) =>
        q.targetDimensions && q.targetDimensions.some((d: string) => targetDimensions.includes(d))
      );

      if (targetingQuestions.length > 0) {
        while (selectedQuestions.length < Math.min(Number(count), targetingQuestions.length)) {
          const randomIndex = Math.floor(Math.random() * targetingQuestions.length);
          const question = targetingQuestions[randomIndex];

          if (!selectedQuestions.find(q => q.id === question.id)) {
            selectedQuestions.push(question);
          }

          targetingQuestions.splice(randomIndex, 1);
        }
      }
    }

    // If we don't have enough questions yet, add random ones
    while (selectedQuestions.length < Math.min(Number(count), availableQuestions.length)) {
      const randomIndex = Math.floor(Math.random() * availableQuestions.length);
      const question = availableQuestions[randomIndex];

      if (!selectedQuestions.find((q: any) => q.id === question.id)) {
        selectedQuestions.push(question);
      }

      availableQuestions.splice(randomIndex, 1);
    }

    console.log(`Selected ${selectedQuestions.length} questions`);

    // Format questions for the frontend
    const formattedQuestions = selectedQuestions.map((q: any) => ({
      id: q.id,
      type: q.type || 'text',
      text: q.text,
      description: q.description,
      imageUrl: q.imageUrl,
      options: q.options.map((opt: any) => ({
        id: opt.id,
        text: opt.text,
        imageUrl: opt.imageUrl
      })),
      stage: q.stage
    }));

    return NextResponse.json({ questions: formattedQuestions }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error getting questions:', error);
    return NextResponse.json({
      error: 'server_error',
      message: 'Error retrieving questions',
      details: String(error)
    }, {
      status: 500,
      headers: corsHeaders()
    });
  }
}

// Handle submitting an answer
async function handleSubmitAnswer(req: NextRequest) {
  try {
    const data = await req.json();
    const { optionId, sessionId } = data;
    const questionId = req.nextUrl.pathname.split('/').slice(-2)[0];

    if (!sessionId || !optionId) {
      return NextResponse.json({
        error: 'bad_request',
        message: 'Missing required fields'
      }, {
        status: 400,
        headers: corsHeaders()
      });
    }

    // Get session and profile
    const session = await db.getSession(sessionId);
    if (!session) {
      return NextResponse.json({
        error: 'not_found',
        message: 'Session not found'
      }, {
        status: 404,
        headers: corsHeaders()
      });
    }

    const profile = await db.getProfile(session.profileId);
    if (!profile) {
      return NextResponse.json({
        error: 'not_found',
        message: 'Profile not found'
      }, {
        status: 404,
        headers: corsHeaders()
      });
    }

    // Get the question and selected option
    const question = questions.find(q => q.id === questionId);
    if (!question) {
      return NextResponse.json({
        error: 'not_found',
        message: 'Question not found'
      }, {
        status: 404,
        headers: corsHeaders()
      });
    }

    const option = question.options.find(opt => opt.id === optionId);
    if (!option) {
      return NextResponse.json({
        error: 'bad_request',
        message: 'Invalid option selected'
      }, {
        status: 400,
        headers: corsHeaders()
      });
    }

    // Update profile
    const updatedProfile = { ...profile };
    updatedProfile.answeredQuestions.push(questionId);

    // Update dimensions based on the answer
    if (option.dimensionUpdates) {
      Object.entries(option.dimensionUpdates).forEach(([dimension, update]) => {
        if (updatedProfile.dimensions[dimension] !== undefined) {
          updatedProfile.dimensions[dimension] = Math.max(0, Math.min(10,
            updatedProfile.dimensions[dimension] + (update as number)
          ));
        }
      });
    }

    // Update confidences
    if (option.confidenceUpdates) {
      Object.entries(option.confidenceUpdates).forEach(([dimension, update]) => {
        if (updatedProfile.confidences[dimension] !== undefined) {
          updatedProfile.confidences[dimension] = Math.max(0, Math.min(1,
            updatedProfile.confidences[dimension] + (update as number)
          ));
        }
      });
    }

    // Save updated profile
    await db.updateProfile(session.profileId, updatedProfile);

    return NextResponse.json({
      success: true,
      profile: {
        dimensions: updatedProfile.dimensions,
        confidences: updatedProfile.confidences
      }
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error submitting answer:', error);
    return NextResponse.json({
      error: 'server_error',
      message: 'Error processing answer',
      details: String(error)
    }, {
      status: 500,
      headers: corsHeaders()
    });
  }
}

// Handle getting user profile
async function handleGetProfile(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({
        error: 'bad_request',
        message: 'Missing sessionId'
      }, {
        status: 400,
        headers: corsHeaders()
      });
    }

    const session = await db.getSession(sessionId);
    if (!session) {
      return NextResponse.json({
        error: 'not_found',
        message: 'Session not found'
      }, {
        status: 404,
        headers: corsHeaders()
      });
    }

    const profile = await db.getProfile(session.profileId);
    if (!profile) {
      return NextResponse.json({
        error: 'not_found',
        message: 'Profile not found'
      }, {
        status: 404,
        headers: corsHeaders()
      });
    }

    return NextResponse.json({
      profile: {
        dimensions: profile.dimensions,
        confidences: profile.confidences,
        answeredQuestions: profile.answeredQuestions
      }
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error getting profile:', error);
    return NextResponse.json({
      error: 'server_error',
      message: 'Error retrieving profile',
      details: String(error)
    }, {
      status: 500,
      headers: corsHeaders()
    });
  }
}

// Handle getting recommendations
async function handleGetRecommendations(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId');
    const count = req.nextUrl.searchParams.get('count') || '10';

    if (!sessionId) {
      return NextResponse.json({
        error: 'bad_request',
        message: 'Missing sessionId'
      }, {
        status: 400,
        headers: corsHeaders()
      });
    }

    const session = await db.getSession(sessionId);
    if (!session) {
      return NextResponse.json({
        error: 'not_found',
        message: 'Session not found'
      }, {
        status: 404,
        headers: corsHeaders()
      });
    }

    const profile = await db.getProfile(session.profileId);
    if (!profile) {
      return NextResponse.json({
        error: 'not_found',
        message: 'Profile not found'
      }, {
        status: 404,
        headers: corsHeaders()
      });
    }

    // Get recommendations from the API adapter
    const recommendations = await apiAdapter.getRecommendations({
      dimensions: profile.dimensions,
      count: parseInt(count, 10)
    });

    return NextResponse.json({ recommendations }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return NextResponse.json({
      error: 'server_error',
      message: 'Error retrieving recommendations',
      details: String(error)
    }, {
      status: 500,
      headers: corsHeaders()
    });
  }
}

// Handle getting specific anime details
async function handleGetAnimeDetails(req: NextRequest) {
  try {
    const animeId = req.nextUrl.pathname.split('/').pop();
    const sessionId = req.nextUrl.searchParams.get('sessionId');

    if (!animeId) {
      return NextResponse.json({
        error: 'bad_request',
        message: 'Missing anime ID'
      }, {
        status: 400,
        headers: corsHeaders()
      });
    }

    // Get anime details from the API adapter
    const details = await apiAdapter.getAnimeDetails(animeId);

    return NextResponse.json({ anime: details }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error getting anime details:', error);
    return NextResponse.json({
      error: 'server_error',
      message: 'Error retrieving anime details',
      details: String(error)
    }, {
      status: 500,
      headers: corsHeaders()
    });
  }
}

// Main handler for all API routes
export async function GET(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders()
    });
  }

  // API routing
  if (pathname === '/api/v1/session') {
    return handleSession();
  } else if (pathname === '/api/v1/questions') {
    return handleGetQuestions(req);
  } else if (pathname.match(/^\/api\/v1\/questions\/[\w-]+\/answer$/)) {
    return handleSubmitAnswer(req);
  } else if (pathname === '/api/v1/profile') {
    return handleGetProfile(req);
  } else if (pathname === '/api/v1/recommendations') {
    return handleGetRecommendations(req);
  } else if (pathname.match(/^\/api\/v1\/recommendations\/[\w-]+$/)) {
    return handleGetAnimeDetails(req);
  } else {
    return NextResponse.json({
      error: 'not_found',
      message: 'Endpoint not found'
    }, {
      status: 404,
      headers: corsHeaders()
    });
  }
}

export async function POST(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders()
    });
  }

  if (pathname.match(/^\/api\/v1\/questions\/[\w-]+\/answer$/)) {
    return handleSubmitAnswer(req);
  }

  return NextResponse.json({
    error: 'not_found',
    message: 'Endpoint not found'
  }, {
    status: 404,
    headers: corsHeaders()
  });
}
