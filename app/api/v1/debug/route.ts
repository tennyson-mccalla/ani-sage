import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { corsHeaders } from '@/app/lib/utils';

export async function GET(): Promise<Response> {
  console.log("GET /api/v1/debug called");
  
  try {
    // Import the debug helper to get raw storage state
    const { dumpStorage } = await import('@/app/lib/db');
    console.log("Debug endpoint: Raw storage state:", dumpStorage());
    
    // Parse the sessions and profiles from the database
    let sessions = [];
    let profiles = [];
    
    try {
      // Use the db interface directly to test if it's working
      const sessionItems = await Promise.all(
        Array.from({ length: 20 }, (_, i) => 
          db.getSession(`test-id-${i}`).catch(() => null)
        )
      );
      
      // Extract data from localStorage
      const rawStorage = JSON.parse(dumpStorage());
      
      if (rawStorage.sessions) {
        try {
          const parsedSessions = JSON.parse(rawStorage.sessions);
          sessions = parsedSessions.map(([id, session]: [string, any]) => ({
            id,
            profileId: session.profileId,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt
          }));
        } catch (error) {
          console.error("Error parsing sessions:", error);
        }
      }
      
      if (rawStorage.profiles) {
        try {
          const parsedProfiles = JSON.parse(rawStorage.profiles);
          profiles = parsedProfiles.map(([id, profile]: [string, any]) => ({
            id,
            dimensions: Object.keys(profile.dimensions || {}).length,
            answeredQuestions: profile.answeredQuestions?.length || 0,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt
          }));
        } catch (error) {
          console.error("Error parsing profiles:", error);
        }
      }
    } catch (error) {
      console.error("Debug endpoint error:", error);
    }
    
    return NextResponse.json({
      status: 'ok',
      database: {
        sessions,
        profiles,
        sessionCount: sessions.length,
        profileCount: profiles.length
      },
      timestamp: new Date().toISOString()
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
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