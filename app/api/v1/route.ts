import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/api/db';
import { createApiAdapter } from '@/api/index';
import { corsHeaders } from '@/api/utils';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    const count = request.nextUrl.searchParams.get('count') || '10';

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

    const apiAdapter = createApiAdapter();
    const recommendations = await apiAdapter.getAnimeRecommendations(parseInt(profile.id, 10));

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

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { optionId, sessionId } = data;

    if (!sessionId || !optionId) {
      return NextResponse.json({
        error: 'bad_request',
        message: 'Missing required fields'
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

    const updatedProfile = await updateProfileWithAnswer(profile, optionId);

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

async function updateProfileWithAnswer(profile: Profile, optionId: string): Promise<Profile> {
  const updatedProfile = {
    ...profile,
    updatedAt: new Date()
  };

  // Update profile based on the selected option
  // This is a simplified version - you'll need to implement the actual logic
  const option = getOptionById(optionId);
  if (option) {
    if (option.mappings) {
      for (const mapping of option.mappings) {
        const { dimension, value } = mapping;
        updatedProfile.dimensions[dimension] = (updatedProfile.dimensions[dimension] || 0) + value;
      }
    }

    if (option.confidenceUpdates) {
      for (const [dimension, value] of Object.entries(option.confidenceUpdates)) {
        updatedProfile.confidences[dimension] = Math.max(0, Math.min(1,
          (updatedProfile.confidences[dimension] || 0) + value
        ));
      }
    }
  }

  return await db.updateProfile(updatedProfile);
}

function getOptionById(optionId: string) {
  // This is a placeholder - you'll need to implement the actual logic
  return null;
}
