import { NextResponse } from 'next/server';
import { corsHeaders } from '@/app/lib/utils';
import { db } from '@/app/lib/db';

export async function GET(): Promise<Response> {
  console.log("GET /api/v1 health check called");
  
  // Get session count for debugging
  const inMemoryDb = db as any;
  // Explicitly type the entries as [string, any][] for TypeScript compatibility
  const sessionEntries = Array.from(inMemoryDb.sessions.entries()) as [string, any][];
  const profileEntries = Array.from(inMemoryDb.profiles.entries()) as [string, any][];
  
  console.log("Current sessions:", JSON.stringify(sessionEntries));
  console.log("Current profiles:", JSON.stringify(profileEntries));
  
  return NextResponse.json({
    message: "API v1 is operational",
    version: "1.0.0",
    dbStatus: {
      sessions: sessionEntries.length,
      profiles: profileEntries.length,
      sessionIds: sessionEntries.map(([id]) => id),
      profileIds: profileEntries.map(([id]) => id)
    },
    timestamp: new Date().toISOString()
  }, { headers: corsHeaders() });
}
