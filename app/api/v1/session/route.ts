import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { corsHeaders } from '@/app/lib/utils';
import { v4 as uuidv4 } from 'uuid';

export async function GET(): Promise<Response> {
  console.log("GET /api/v1/session called");
  return NextResponse.json({
    message: "Session endpoint is available",
    timestamp: new Date().toISOString()
  }, { headers: corsHeaders() });
}

export async function POST(request: NextRequest): Promise<Response> {
  console.log("POST /api/v1/session called");
  try {
    // Generate a unique session ID
    const sessionId = uuidv4();
    console.log("Generated session ID:", sessionId);
    
    // Generate a unique profile ID
    const profileId = uuidv4();
    console.log("Generated profile ID:", profileId);
    
    // Create empty profile with required date fields
    const profile = await db.createProfile({
      dimensions: {},
      confidences: {},
      answeredQuestions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log("Created profile with ID:", profile.id);
    
    // We'll use the db interface now, which will store in our static LocalStorage
    const { dumpStorage } = await import('@/app/lib/db');
    console.log("Session creation: Database state:", dumpStorage());
    
    // CRITICAL CHANGE: Use the generated sessionId directly in createSession
    // to ensure client and database are synchronized
    console.log(`Creating session with directly specified ID ${sessionId}`);
    
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
    
    console.log("Session creation: Database state after creation:", dumpStorage());
    
    // Verify session was created successfully
    const storedSession = await db.getSession(sessionId);
    
    if (!storedSession) {
      console.error("ERROR: Failed to retrieve just-created session!");
    } else {
      console.log("Successfully verified session storage:", storedSession);
    }
    
    // Return the session info - make absolutely sure the ID matches what's in storage
    return NextResponse.json({
      sessionId,
      profileId: profile.id,
      created: !!storedSession,
      timestamp: new Date().toISOString(),
      debug: {
        storage: storedSession ? true : false,
        id: sessionId
      }
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error creating session:', error);
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
