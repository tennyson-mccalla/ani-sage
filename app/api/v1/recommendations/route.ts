import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { createApiAdapter } from '@/app/lib/anime-api-adapter';
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
