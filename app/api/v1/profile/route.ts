import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { corsHeaders } from '@/app/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');

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

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    const data = await request.json();
    const { questionId, optionId } = data;

    if (!sessionId || !questionId || !optionId) {
      return NextResponse.json({
        error: 'bad_request',
        message: 'Missing required fields'
      }, { status: 400 });
    }

    const session = await db.getSession(sessionId);
    if (!session) {
      return NextResponse.json({
        error: 'not_found',
        message: 'Session not found'
      }, { status: 404 });
    }

    const profile = await db.getProfile(session.profileId);
    if (!profile) {
      return NextResponse.json({
        error: 'not_found',
        message: 'Profile not found'
      }, { status: 404 });
    }

    // Update profile with answer
    if (!profile.answeredQuestions.includes(questionId)) {
      profile.answeredQuestions.push(questionId);
    }

    // Save updated profile
    await db.updateProfile(profile);

    return NextResponse.json({
      success: true,
      profile: {
        dimensions: profile.dimensions,
        confidences: profile.confidences,
        answeredQuestions: profile.answeredQuestions
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({
      error: 'server_error',
      message: 'Error updating profile',
      details: String(error)
    }, { status: 500 });
  }
}
