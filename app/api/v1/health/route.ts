import { NextResponse } from 'next/server';
import { corsHeaders } from '@/app/lib/utils';
import { db, dumpStorage } from '@/app/lib/db';

export async function GET() {
  console.log("GET /api/v1/health called");
  
  try {
    // Simple health check to verify the server and storage
    const rawStorage = dumpStorage();
    
    // Create a session with a known ID to test that our direct session storage works
    const knownId = 'test-session-' + Date.now();
    const newSession = {
      id: knownId,
      profileId: 'health-check',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Use the direct storage method
    const sessionsMap = (db as any)._getSessionsMap ? 
                       (db as any)._getSessionsMap() : 
                       new Map();
    sessionsMap.set(knownId, newSession);
    db.saveSessions(sessionsMap);
    
    // Try to retrieve it to verify storage is working
    const verifySession = await db.getSession(knownId);
    
    return NextResponse.json({
      status: 'ok',
      message: 'API is healthy',
      storageState: rawStorage,
      testSession: {
        id: knownId,
        verified: !!verifySession,
        retrieved: verifySession ? JSON.stringify(verifySession) : null
      },
      timestamp: new Date().toISOString()
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'error',
      message: String(error),
      timestamp: new Date().toISOString()
    }, {
      status: 500, 
      headers: corsHeaders()
    });
  }
}