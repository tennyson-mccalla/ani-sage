import { Redis } from '@upstash/redis';
import { neon } from '@neondatabase/serverless';
import { Profile, Session } from './types';

// Initialize Redis client
const redis = new Redis({
  url: process.env.REDIS_URL || '',
  token: process.env.REDIS_TOKEN || ''
});

// Initialize Postgres client
const sql = neon(process.env.POSTGRES_URL || '');

// Database schema
const schema = `
  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    dimensions JSONB NOT NULL,
    confidences JSONB NOT NULL,
    answered_questions TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
`;

export interface Database {
  createSession(): Promise<Session>;
  getSession(id: string): Promise<Session | null>;
  updateSession(id: string, updates: Partial<Session>): Promise<Session>;
  createProfile(sessionId: string): Promise<Profile>;
  getProfile(sessionId: string): Promise<Profile | null>;
  updateProfile(sessionId: string, updates: Partial<Profile>): Promise<Profile>;
}

class InMemoryDatabase implements Database {
  private sessions: Map<string, Session> = new Map();
  private profiles: Map<string, Profile> = new Map();

  async createSession(): Promise<Session> {
    const session: Session = {
      id: Math.random().toString(36).substring(2),
      currentQuestionIndex: 0,
      answeredQuestions: [],
      recommendations: [],
      startTime: new Date().toISOString(),
      lastUpdateTime: new Date().toISOString()
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async getSession(id: string): Promise<Session | null> {
    return this.sessions.get(id) || null;
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<Session> {
    const session = await this.getSession(id);
    if (!session) {
      throw new Error(`Session not found: ${id}`);
    }
    const updatedSession = { ...session, ...updates };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  async createProfile(sessionId: string): Promise<Profile> {
    const profile: Profile = {
      sessionId,
      dimensions: {},
      confidence: {},
      lastUpdateTime: new Date().toISOString()
    };
    this.profiles.set(sessionId, profile);
    return profile;
  }

  async getProfile(sessionId: string): Promise<Profile | null> {
    return this.profiles.get(sessionId) || null;
  }

  async updateProfile(sessionId: string, updates: Partial<Profile>): Promise<Profile> {
    const profile = await this.getProfile(sessionId);
    if (!profile) {
      throw new Error(`Profile not found: ${sessionId}`);
    }
    const updatedProfile = { ...profile, ...updates };
    this.profiles.set(sessionId, updatedProfile);
    return updatedProfile;
  }
}

export const db: Database = new InMemoryDatabase();

export async function initDatabase(): Promise<void> {
  // No initialization needed for in-memory database
}

// Profile operations
export async function createProfile(profile: {
  id: string;
  dimensions: Record<string, number>;
  confidences: Record<string, number>;
  answeredQuestions: string[];
}) {
  try {
    await sql`
      INSERT INTO profiles (id, dimensions, confidences, answered_questions)
      VALUES (${profile.id}, ${JSON.stringify(profile.dimensions)}, ${JSON.stringify(profile.confidences)}, ${profile.answeredQuestions})
    `;
    return profile;
  } catch (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
}

export async function getProfile(id: string) {
  try {
    const result = await sql`
      SELECT * FROM profiles WHERE id = ${id}
    `;
    if (result.length === 0) return null;

    const profile = result[0];
    return {
      id: profile.id,
      dimensions: profile.dimensions,
      confidences: profile.confidences,
      answeredQuestions: profile.answered_questions
    };
  } catch (error) {
    console.error('Error getting profile:', error);
    throw error;
  }
}

export async function updateProfile(id: string, profile: {
  dimensions: Record<string, number>;
  confidences: Record<string, number>;
  answeredQuestions: string[];
}) {
  try {
    await sql`
      UPDATE profiles
      SET dimensions = ${JSON.stringify(profile.dimensions)},
          confidences = ${JSON.stringify(profile.confidences)},
          answered_questions = ${profile.answeredQuestions},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;
    return { id, ...profile };
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

// Session operations
export async function createSession(sessionId: string, profileId: string) {
  try {
    await redis.set(`session:${sessionId}`, profileId, { ex: 24 * 60 * 60 }); // 24 hours expiry
    return { sessionId, profileId };
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

export async function getSession(sessionId: string) {
  try {
    const profileId = await redis.get<string>(`session:${sessionId}`);
    if (!profileId) return null;
    return { sessionId, profileId };
  } catch (error) {
    console.error('Error getting session:', error);
    throw error;
  }
}

export async function deleteSession(sessionId: string) {
  try {
    await redis.del(`session:${sessionId}`);
    return true;
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
}

// Export database instance for direct access if needed
export const dbInstance = {
  createProfile,
  getProfile,
  updateProfile,
  createSession,
  getSession,
  deleteSession
};
