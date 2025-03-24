import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { corsHeaders } from '@/app/lib/utils';

// Set dynamic runtime to handle URL search parameters
export const dynamic = 'force-dynamic';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest): Promise<Response> {
  console.log("GET /api/v1/session called - creating new session with temp profile");
  
  try {
    // Generate a unique session ID
    const sessionId = uuidv4();
    console.log("Generated session ID:", sessionId);
    
    // Create a new profile with default values
    const profile = await db.createProfile({
      dimensions: {
        'visualComplexity': 5.0,
        'narrativeComplexity': 5.0,
        'emotionalIntensity': 5.0,
        'characterComplexity': 5.0,
        'moralAmbiguity': 5.0
      },
      confidences: {},
      answeredQuestions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log(`Created temporary profile with ID: ${profile.id}`);
    
    // Store the session directly with the same ID that's returned to the client
    const newSession = {
      id: sessionId, // Use the ID we already generated
      profileId: profile.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Get and update the sessions Map
    const sessionsMap = (db as any)._getSessionsMap ? 
                        (db as any)._getSessionsMap() : 
                        new Map();
    sessionsMap.set(sessionId, newSession);
    db.saveSessions(sessionsMap);
    
    // Verify session was created successfully
    const storedSession = await db.getSession(sessionId);
    
    // Return the session information to the client
    return NextResponse.json({
      sessionId: sessionId,
      profileId: profile.id,
      isTemporary: true,
      createdAt: new Date().toISOString(),
      success: !!storedSession
    }, { 
      headers: corsHeaders()
    });
  } catch (error) {
    console.error('Error creating session with temp profile:', error);
    return NextResponse.json({
      error: 'server_error',
      message: 'Error creating session',
      details: String(error)
    }, {
      status: 500,
      headers: corsHeaders()
    });
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    console.log("POST /api/v1/session called to save session:", sessionId);
    
    if (!sessionId) {
      console.log("Missing sessionId in POST request");
      return NextResponse.json({
        error: 'bad_request',
        message: 'Missing sessionId'
      }, { 
        status: 400,
        headers: corsHeaders()
      });
    }
    
    // Check if session exists
    const session = await db.getSession(sessionId);
    if (!session) {
      console.log(`Session ${sessionId} not found`);
      return NextResponse.json({
        error: 'not_found',
        message: 'Session not found'
      }, { 
        status: 404,
        headers: corsHeaders()
      });
    }
    
    // Get the profile for this session
    const profile = await db.getProfile(session.profileId);
    if (!profile) {
      console.log(`Profile not found for session ${sessionId}`);
      return NextResponse.json({
        error: 'not_found',
        message: 'Profile not found'
      }, { 
        status: 404,
        headers: corsHeaders()
      });
    }
    
    // Update profile to mark it as permanent (no actual change needed for now)
    // In a real implementation, you might set a flag or move to permanent storage
    console.log(`Saving session ${sessionId} as permanent`);
    
    // Return success response
    return NextResponse.json({
      success: true,
      sessionId: session.id,
      profileId: session.profileId,
      isPermanent: true
    }, {
      headers: corsHeaders()
    });
  } catch (error) {
    console.error('Error saving session:', error);
    return NextResponse.json({
      error: 'server_error',
      message: 'Error saving session',
      details: String(error)
    }, {
      status: 500,
      headers: corsHeaders()
    });
  }
}
