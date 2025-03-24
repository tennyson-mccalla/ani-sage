import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import { Session } from './db';

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validate that a URL is properly formatted
 */
export function isValidUrl(url: string) {
  try {
    // Basic URL validation
    if (!url || typeof url !== 'string') return false;
    
    // Must start with http:// or https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
    
    // Try creating URL object (this will throw if invalid)
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a temporary profile for any session
 */
export async function ensureSessionProfile(sessionId: string): Promise<Session | null> {
  if (!sessionId) return null;
  
  console.log(`ensureSessionProfile: Checking session ${sessionId}`);
  
  try {
    // Check if session exists
    let session = await db.getSession(sessionId);
    
    // If session doesn't exist, create it with a new profile
    if (!session) {
      console.log(`Creating temporary profile for session ${sessionId}`);
      
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
      
      console.log(`Created new profile with ID ${profile.id} for session ${sessionId}`);
      
      // Create a new session with the specified ID
      const newSession = {
        id: sessionId,
        profileId: profile.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Save the session directly in memory first
      const inMemoryDb = db as any;
      if (inMemoryDb.sessions) {
        inMemoryDb.sessions.set(sessionId, newSession);
      }
      
      // Also save using the standard interface
      const sessionsMap = inMemoryDb._getSessionsMap ? 
                          inMemoryDb._getSessionsMap() : 
                          new Map();
      sessionsMap.set(sessionId, newSession);
      db.saveSessions(sessionsMap);
      
      // Verify the session was saved
      const savedSession = await db.getSession(sessionId);
      console.log(`Session saved and retrieved check: ${savedSession ? 'SUCCESS' : 'FAILED'}`);
      
      // Return the newly created session
      return newSession;
    } else {
      console.log(`Found existing session for ${sessionId} with profile ${session.profileId}`);
      return session;
    }
  } catch (error) {
    console.error(`Error in ensureSessionProfile for session ${sessionId}:`, error);
    
    // Fallback: create a mock session object if we can't use the database
    const mockSession = {
      id: sessionId,
      profileId: `profile-${sessionId}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    console.log(`Created fallback mock session for ${sessionId}`);
    return mockSession;
  }
}
