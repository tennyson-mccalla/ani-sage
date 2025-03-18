import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { corsHeaders } from '@/app/lib/utils';

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function GET() {
  try {
    const sessionId = `session_${Date.now()}`;
    const profileId = Math.random().toString(36).substring(2);

    // Create new profile
    const profile = await db.createProfile({
      id: profileId,
      dimensions: {},
      confidences: {},
      answeredQuestions: []
    });

    // Create new session
    await db.createSession({
      id: sessionId,
      profileId: profile.id
    });

    return NextResponse.json({
      sessionId,
      isNewUser: true,
      profileConfidence: 0,
      interactionCount: 0
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
