import { NextRequest, NextResponse } from 'next/server';
import { AnimeApiAdapter } from '../../anime-api-adapter';
import { createApiAdapter } from '../../index';
import { questions } from '../../question-bank';
import { db, initDatabase } from '../../db';
import { Question, QuestionOption, Profile, Session } from '../../types';

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
  const profile: Profile = {
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
    answeredQuestions: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const session: Session = {
    id: sessionId,
    profileId,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await db.createProfile(profile);
  await db.createSession(session);

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
    let availableQuestions: Question[] = questions;
    if (stage) {
      const stageNum = parseInt(stage, 10);
      availableQuestions = questions.filter(q => q.stage === stageNum);
      console.log(`Filtered to ${availableQuestions.length} questions for stage ${stageNum}`);
    }

    // Filter out questions that have already been answered
    availableQuestions = availableQuestions.filter(q => !profile.answeredQuestions.includes(q.id));
    console.log(`${availableQuestions.length} questions available after filtering answered questions`);

    // If we have a user profile with dimensions and confidences, we can use it to select questions
    let selectedQuestions: Question[] = [];

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
      const targetingQuestions = availableQuestions.filter(q =>
        q.targetDimensions && q.targetDimensions.some(d => targetDimensions.includes(d))
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

      if (!selectedQuestions.find(q => q.id === question.id)) {
        selectedQuestions.push(question);
      }

      availableQuestions.splice(randomIndex, 1);
    }

    console.log(`Selected ${selectedQuestions.length} questions`);

    // Format questions for the frontend
    const formattedQuestions = selectedQuestions.map(q => ({
      id: q.id,
      type: q.type || 'text',
      text: q.text,
      description: q.description,
      imageUrl: q.imageUrl,
      options: q.options.map((opt: QuestionOption) => ({
        id: opt.id,
        text: opt.text,
        imageUrl: opt.imageUrl,
        dimensionUpdates: opt.dimensionUpdates,
        confidenceUpdates: opt.confidenceUpdates
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
    const updatedProfile = await updateProfileWithAnswer(profile, questionId, optionId);

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
    const details = await apiAdapter.getAnimeDetails(parseInt(animeId, 10));

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

// Get profile for session
async function getProfileForSession(session: Session): Promise<Profile> {
  const profile = await db.getProfile(session.profileId);
  if (!profile) {
    throw new Error(`Profile not found for session: ${session.id}`);
  }
  return profile;
}

// Get next question
async function getNextQuestion(profile: Profile): Promise<Question | null> {
  const unansweredQuestions = questions.filter(q => !profile.answeredQuestions.includes(q.id));
  if (unansweredQuestions.length === 0) {
    return null;
  }

  // Group questions by stage
  const stages = Array.from(new Set(unansweredQuestions.map(q => q.stage))).sort();
  const earliestStage = stages[0];
  const stageQuestions = unansweredQuestions.filter(q => q.stage === earliestStage);

  // Filter questions based on target dimensions
  const targetDimensions = Object.keys(profile.dimensions).filter(d =>
    profile.confidences[d] < 0.7
  );

  const relevantQuestions = stageQuestions.filter(q =>
    q.targetDimensions.some(d => targetDimensions.includes(d))
  );

  if (relevantQuestions.length === 0) {
    return stageQuestions[0];
  }

  // Select a random question from the relevant ones
  const randomIndex = Math.floor(Math.random() * relevantQuestions.length);
  const selectedQuestion = relevantQuestions[randomIndex];

  return {
    id: selectedQuestion.id,
    text: selectedQuestion.text,
    type: selectedQuestion.type,
    stage: selectedQuestion.stage,
    targetDimensions: selectedQuestion.targetDimensions,
    options: selectedQuestion.options.map(opt => ({
      id: opt.id,
      text: opt.text,
      value: opt.value,
      imageUrl: opt.imageUrl,
      mappings: opt.mappings || []
    })),
    description: selectedQuestion.description,
    imageUrl: selectedQuestion.imageUrl
  };
}

// Update profile based on answer
async function updateProfileWithAnswer(profile: Profile, questionId: string, selectedOptionId: string): Promise<Profile> {
  const question = questions.find(q => q.id === questionId);
  if (!question) {
    throw new Error(`Question not found: ${questionId}`);
  }

  const selectedOption = question.options.find(opt => opt.id === selectedOptionId);
  if (!selectedOption) {
    throw new Error(`Option not found: ${selectedOptionId}`);
  }

  const updatedProfile: Profile = {
    ...profile,
    answeredQuestions: [...profile.answeredQuestions, questionId],
    updatedAt: new Date()
  };

  // Update dimensions based on option mappings
  if (selectedOption.mappings) {
    for (const mapping of selectedOption.mappings) {
      const { dimension, value } = mapping;
      updatedProfile.dimensions[dimension] = (updatedProfile.dimensions[dimension] || 0) + value;
    }
  }

  // Update confidences based on option mappings
  if (selectedOption.mappings) {
    for (const mapping of selectedOption.mappings) {
      const { dimension } = mapping;
      updatedProfile.confidences[dimension] = Math.max(0, Math.min(1,
        (updatedProfile.confidences[dimension] || 0) + 0.1
      ));
    }
  }

  // Save updated profile
  await db.updateProfile(updatedProfile);

  return updatedProfile;
}

// Get recommendations based on profile
async function getRecommendations(session: Session, count: number = 10): Promise<any[]> {
  const profile = await getProfileForSession(session);
  const apiAdapter = createApiAdapter();

  const recommendations = await apiAdapter.getRecommendations({
    dimensions: profile.dimensions,
    count
  });

  return recommendations;
}

// Get anime details
async function getAnimeDetails(animeId: string): Promise<any> {
  const apiAdapter = createApiAdapter();
  const details = await apiAdapter.getAnimeDetails(parseInt(animeId, 10));
  return details;
}

// Main handler for all API routes
export async function GET(request: Request) {
  try {
    const sessionId = request.headers.get('x-session-id');
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const session = await db.getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const profile = await db.getProfileForSession(sessionId);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const nextQuestion = await getNextQuestion(profile);
    return NextResponse.json({ profile, nextQuestion }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders() });
  }
}

// Handle POST requests
export async function POST(request: Request) {
  try {
    const sessionId = request.headers.get('x-session-id');
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { questionId, selectedOptionId } = body;

    if (questionId && selectedOptionId) {
      const session = await db.getSession(sessionId);
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      const profile = await db.getProfileForSession(sessionId);
      if (!profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }

      const updatedProfile = await updateProfileWithAnswer(profile, questionId, selectedOptionId);
      await db.updateProfile(updatedProfile);

      const nextQuestion = await getNextQuestion(updatedProfile);
      return NextResponse.json({ profile: updatedProfile, nextQuestion }, { headers: corsHeaders() });
    } else {
      // Create new session and profile
      const profileId = Math.random().toString(36).substring(2);
      const profile: Profile = {
        id: profileId,
        dimensions: {},
        confidences: {},
        answeredQuestions: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const session: Session = {
        id: sessionId,
        profileId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.createProfile(profile);
      await db.createSession(session);

      const nextQuestion = await getNextQuestion(profile);
      return NextResponse.json({ profile, nextQuestion }, { headers: corsHeaders() });
    }
  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders() });
  }
}

// Handle recommendations request
export async function getRecommendationsHandler(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    const count = request.nextUrl.searchParams.get('count');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId parameter' }, { status: 400 });
    }

    const session = await db.getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const recommendations = await getRecommendations(session, count ? parseInt(count, 10) : undefined);
    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
