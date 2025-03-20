import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export interface Session {
  id: string;
  profileId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Profile {
  id: string;
  dimensions: Record<string, number>;
  confidences: Record<string, number>;
  answeredQuestions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export const db = {
  async getSession(sessionId: string): Promise<Session | null> {
    try {
      const result = await sql`
        SELECT * FROM sessions WHERE id = ${sessionId}
      `;
      const rawResult = result[0];
      if (!rawResult) return null;
      
      // Convert to Session type with proper Date objects
      return {
        id: rawResult.id,
        profileId: rawResult.profile_id,
        createdAt: new Date(rawResult.created_at),
        updatedAt: new Date(rawResult.updated_at)
      };
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  },

  async getProfile(profileId: string): Promise<Profile | null> {
    try {
      const result = await sql`
        SELECT * FROM profiles WHERE id = ${profileId}
      `;
      const rawResult = result[0];
      if (!rawResult) return null;
      
      // Convert to Profile type with proper Date objects and structure
      return {
        id: rawResult.id,
        dimensions: rawResult.dimensions || {},
        confidences: rawResult.confidences || {},
        answeredQuestions: rawResult.answered_questions || [],
        createdAt: new Date(rawResult.created_at),
        updatedAt: new Date(rawResult.updated_at)
      };
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  },

  async updateProfile(profile: Profile): Promise<Profile | null> {
    try {
      const result = await sql`
        UPDATE profiles
        SET
          dimensions = ${JSON.stringify(profile.dimensions)},
          confidences = ${JSON.stringify(profile.confidences)},
          answered_questions = ${JSON.stringify(profile.answeredQuestions)},
          updated_at = NOW()
        WHERE id = ${profile.id}
        RETURNING *
      `;
      const rawResult = result[0];
      if (!rawResult) return null;
      
      // Convert to Profile type with proper Date objects and structure
      return {
        id: rawResult.id,
        dimensions: rawResult.dimensions || {},
        confidences: rawResult.confidences || {},
        answeredQuestions: rawResult.answered_questions || [],
        createdAt: new Date(rawResult.created_at),
        updatedAt: new Date(rawResult.updated_at)
      };
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    }
  },

  async createProfile(profile: Profile): Promise<Profile> {
    try {
      const result = await sql`
        INSERT INTO profiles (
          id, dimensions, confidences, answered_questions, created_at, updated_at
        ) VALUES (
          ${profile.id},
          ${JSON.stringify(profile.dimensions)},
          ${JSON.stringify(profile.confidences)},
          ${JSON.stringify(profile.answeredQuestions)},
          ${profile.createdAt},
          ${profile.updatedAt}
        )
        RETURNING *
      `;
      
      const rawResult = result[0];
      
      return {
        id: rawResult.id,
        dimensions: rawResult.dimensions || {},
        confidences: rawResult.confidences || {},
        answeredQuestions: rawResult.answered_questions || [],
        createdAt: new Date(rawResult.created_at),
        updatedAt: new Date(rawResult.updated_at)
      };
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  },

  async createSession(session: Session): Promise<Session> {
    try {
      const result = await sql`
        INSERT INTO sessions (
          id, profile_id, created_at, updated_at
        ) VALUES (
          ${session.id},
          ${session.profileId},
          ${session.createdAt},
          ${session.updatedAt}
        )
        RETURNING *
      `;
      
      const rawResult = result[0];
      
      return {
        id: rawResult.id,
        profileId: rawResult.profile_id,
        createdAt: new Date(rawResult.created_at),
        updatedAt: new Date(rawResult.updated_at)
      };
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  },

  async getProfileForSession(sessionId: string): Promise<Profile | null> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) return null;
      
      return this.getProfile(session.profileId);
    } catch (error) {
      console.error('Error getting profile for session:', error);
      return null;
    }
  }
};
