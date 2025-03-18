import { Redis } from '@upstash/redis';
import { neon } from '@neondatabase/serverless';

// Initialize Redis client
export const redis = new Redis({
  url: process.env.REDIS_URL || '',
});

// Initialize Postgres client
export const sql = neon(process.env.POSTGRES_URL || '');

// Database schema
export async function initDatabase() {
  try {
    // Create profiles table
    await sql`
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        dimensions JSONB NOT NULL,
        confidences JSONB NOT NULL,
        answered_questions TEXT[] NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Profile type
export interface Profile {
  id: string;
  dimensions: {
    visualComplexity: number;
    colorSaturation: number;
    visualPace: number;
    narrativeComplexity: number;
    narrativePace: number;
    plotPredictability: number;
    characterComplexity: number;
    characterGrowth: number;
    emotionalIntensity: number;
    emotionalValence: number;
    moralAmbiguity: number;
    fantasyRealism: number;
    intellectualEmotional: number;
    noveltyFamiliarity: number;
  };
  confidences: {
    [key: string]: number;
  };
  answeredQuestions: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Session type
export interface Session {
  id: string;
  profileId: string;
  createdAt: Date;
  lastActive: Date;
}

// Database operations
export const db = {
  // Session operations
  async createSession(sessionId: string, profileId: string): Promise<void> {
    const session: Session = {
      id: sessionId,
      profileId,
      createdAt: new Date(),
      lastActive: new Date(),
    };
    await redis.set(`session:${sessionId}`, JSON.stringify(session));
  },

  async getSession(sessionId: string): Promise<Session | null> {
    const data = await redis.get(`session:${sessionId}`);
    return data ? JSON.parse(data as string) : null;
  },

  async updateSessionLastActive(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.lastActive = new Date();
      await redis.set(`session:${sessionId}`, JSON.stringify(session));
    }
  },

  // Profile operations
  async createProfile(profile: Omit<Profile, 'createdAt' | 'updatedAt'>): Promise<void> {
    await sql`
      INSERT INTO profiles (id, dimensions, confidences, answered_questions)
      VALUES (${profile.id}, ${JSON.stringify(profile.dimensions)}, ${JSON.stringify(profile.confidences)}, ${profile.answeredQuestions})
    `;
  },

  async getProfile(profileId: string): Promise<Profile | null> {
    const result = await sql`
      SELECT * FROM profiles WHERE id = ${profileId}
    `;
    return result.rows[0] || null;
  },

  async updateProfile(profileId: string, updates: Partial<Profile>): Promise<void> {
    const setClauses = [];
    const values = [];

    if (updates.dimensions) {
      setClauses.push('dimensions = ${JSON.stringify(updates.dimensions)}');
    }
    if (updates.confidences) {
      setClauses.push('confidences = ${JSON.stringify(updates.confidences)}');
    }
    if (updates.answeredQuestions) {
      setClauses.push('answered_questions = ${updates.answeredQuestions}');
    }

    if (setClauses.length > 0) {
      await sql`
        UPDATE profiles
        SET ${sql(setClauses.join(', '))}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${profileId}
      `;
    }
  },
};
