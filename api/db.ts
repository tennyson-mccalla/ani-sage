import { Redis } from '@upstash/redis';
import { neon } from '@neondatabase/serverless';

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
  createProfile(profile: Omit<Profile, 'id'>): Promise<Profile>;
  getProfile(id: string): Promise<Profile | null>;
  updateProfile(profile: Profile): Promise<Profile>;
  getProfileForSession(sessionId: string): Promise<Profile | null>;
  createSession(session: Omit<Session, 'id'>): Promise<Session>;
  getSession(id: string): Promise<Session | null>;
  updateSession(session: Session): Promise<Session>;
}

export interface Profile {
  id: string;
  dimensions: Record<string, number>;
  confidences: Record<string, number>;
  answeredQuestions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  profileId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class InMemoryDatabase implements Database {
  private profiles: Map<string, Profile> = new Map();
  private sessions: Map<string, Session> = new Map();

  async createProfile(profile: Omit<Profile, 'id'>): Promise<Profile> {
    const id = crypto.randomUUID();
    const newProfile = { ...profile, id, createdAt: new Date(), updatedAt: new Date() };
    this.profiles.set(id, newProfile);
    return newProfile;
  }

  async getProfile(id: string): Promise<Profile | null> {
    return this.profiles.get(id) || null;
  }

  async updateProfile(profile: Profile): Promise<Profile> {
    this.profiles.set(profile.id, profile);
    return profile;
  }

  async getProfileForSession(sessionId: string): Promise<Profile | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;
    return this.getProfile(session.profileId);
  }

  async createSession(session: Omit<Session, 'id'>): Promise<Session> {
    const id = crypto.randomUUID();
    const newSession = { ...session, id, createdAt: new Date(), updatedAt: new Date() };
    this.sessions.set(id, newSession);
    return newSession;
  }

  async getSession(id: string): Promise<Session | null> {
    return this.sessions.get(id) || null;
  }

  async updateSession(session: Session): Promise<Session> {
    this.sessions.set(session.id, session);
    return session;
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
