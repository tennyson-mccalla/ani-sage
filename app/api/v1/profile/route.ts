import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/api/db';
import { corsHeaders } from '@/api/utils';

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
