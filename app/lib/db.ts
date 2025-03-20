import { Redis } from '@upstash/redis';
import { Pool } from '@neondatabase/serverless';
import { Question, QuestionOption } from './types';
import { v4 as uuidv4 } from 'uuid';

// Determine if we should use the real database or in-memory implementation
const isLocalDev = process.env.NODE_ENV === 'development' || process.env.USE_IN_MEMORY_DB === 'true';

// Database interfaces
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

export interface Database {
  createProfile(profile: Omit<Profile, 'id'>): Promise<Profile>;
  getProfile(id: string): Promise<Profile | null>;
  updateProfile(profile: Profile): Promise<Profile>;
  getProfileForSession(sessionId: string): Promise<Profile | null>;
  createSession(session: Omit<Session, 'id'>): Promise<Session>;
  getSession(id: string): Promise<Session | null>;
  updateSession(session: Session): Promise<Session>;
  
  // Added direct storage access methods
  getSessions(): string | null;
  saveSessions(sessions: any): void;
  getProfiles(): string | null;
  saveProfiles(profiles: any): void;
}

// Since Next.js API routes don't share state between requests in development,
// we need to use the Node.js global object to maintain our state
declare global {
  var __db_storage__: Record<string, string>;
}

// Initialize global storage if it doesn't exist
if (!global.__db_storage__) {
  global.__db_storage__ = {};
  console.log("Global storage initialized");
}

// Simplified in-memory storage based on global state
// This is the simplest solution for development
// Export this class so it can be used directly in Next.js API routes
export class LocalStorage {
  static getItem(key: string): string | null {
    return global.__db_storage__[key] || null;
  }

  static setItem(key: string, value: string): void {
    global.__db_storage__[key] = value;
    console.log(`LocalStorage: Set ${key}=${value.substring(0, 30)}...`);
  }

  static removeItem(key: string): void {
    delete global.__db_storage__[key];
  }

  static clear(): void {
    global.__db_storage__ = {};
  }
  
  static getStorage(): Record<string, string> {
    return {...global.__db_storage__};
  }
}

// Debug helper
export function dumpStorage(): string {
  return JSON.stringify(LocalStorage.getStorage());
}

// In-memory implementation for local development
export class InMemoryDatabase implements Database {
  // Add public sessions and profiles maps for direct access
  public sessions: Map<string, Session> = new Map();
  public profiles: Map<string, Profile> = new Map();
  // These methods are now public to allow direct access for debugging and session creation
  getProfiles(): string | null {
    return LocalStorage.getItem('profiles');
  }
  
  saveProfiles(profiles: any): void {
    if (Array.isArray(profiles)) {
      LocalStorage.setItem('profiles', JSON.stringify(profiles));
    } else if (profiles instanceof Map) {
      const data = JSON.stringify(Array.from(profiles.entries()));
      LocalStorage.setItem('profiles', data);
    } else {
      LocalStorage.setItem('profiles', JSON.stringify(profiles));
    }
  }
  
  getSessions(): string | null {
    return LocalStorage.getItem('sessions');
  }
  
  saveSessions(sessions: any): void {
    if (Array.isArray(sessions)) {
      LocalStorage.setItem('sessions', JSON.stringify(sessions));
    } else if (sessions instanceof Map) {
      const data = JSON.stringify(Array.from(sessions.entries()));
      LocalStorage.setItem('sessions', data);
    } else {
      LocalStorage.setItem('sessions', JSON.stringify(sessions));
    }
  }
  
  // Private helper methods for internal use
  _getProfilesMap(): Map<string, Profile> {
    // First, try to load from local storage into our class instance map
    if (this.profiles.size === 0) {
      const storedData = this.getProfiles();
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          this.profiles = new Map(parsed);
        } catch (error) {
          console.error('Error parsing profiles from storage:', error);
        }
      }
    }
    return this.profiles;
  }
  
  _getSessionsMap(): Map<string, Session> {
    // First, try to load from local storage into our class instance map
    if (this.sessions.size === 0) {
      const storedData = this.getSessions();
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          this.sessions = new Map(parsed);
        } catch (error) {
          console.error('Error parsing sessions from storage:', error);
        }
      }
    }
    return this.sessions;
  }

  async createProfile(profile: Omit<Profile, 'id'>): Promise<Profile> {
    const id = uuidv4();
    const newProfile = { ...profile, id, createdAt: new Date(), updatedAt: new Date() };
    
    const profiles = this._getProfilesMap();
    profiles.set(id, newProfile);
    this.saveProfiles(profiles);
    return newProfile;
  }

  async getProfile(id: string): Promise<Profile | null> {
    const profiles = this._getProfilesMap();
    return profiles.get(id) || null;
  }

  async updateProfile(profile: Profile): Promise<Profile> {
    profile.updatedAt = new Date();
    
    const profiles = this._getProfilesMap();
    profiles.set(profile.id, profile);
    this.saveProfiles(profiles);
    
    return profile;
  }

  async getProfileForSession(sessionId: string): Promise<Profile | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;
    return this.getProfile(session.profileId);
  }

  async createSession(session: Omit<Session, 'id'>): Promise<Session> {
    const id = uuidv4();
    console.log(`InMemoryDatabase: Creating session with ID ${id} for profile ${session.profileId}`);
    
    const newSession = { ...session, id, createdAt: new Date(), updatedAt: new Date() };
    
    const sessions = this._getSessionsMap();
    sessions.set(id, newSession);
    this.saveSessions(sessions);
    
    console.log(`Session stored in local storage with ID: ${id}`);
    return newSession;
  }

  async getSession(id: string): Promise<Session | null> {
    const sessions = this._getSessionsMap();
    const session = sessions.get(id);
    console.log(`getSession(${id}): ${session ? 'found' : 'not found'}`);
    return session || null;
  }

  async updateSession(session: Session): Promise<Session> {
    session.updatedAt = new Date();
    
    const sessions = this._getSessionsMap();
    sessions.set(session.id, session);
    this.saveSessions(sessions);
    
    return session;
  }
}

// Create the appropriate database implementation
export const db: Database = new InMemoryDatabase();

// Simplified session methods
export async function createSession(sessionId: string, profileId: string) {
  try {
    console.log(`Creating session with ID ${sessionId} linked to profile ${profileId}`);
    const session = {
      id: sessionId,
      profileId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Store directly in the sessions map - bypass the Database interface
    const inMemoryDb = db as InMemoryDatabase;
    inMemoryDb.sessions.set(sessionId, session);
    console.log(`Session directly set in map: ${JSON.stringify(session)}`);
    
    return { sessionId, profileId };
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

export async function getSession(sessionId: string) {
  try {
    const session = await db.getSession(sessionId);
    if (!session) return null;
    return { sessionId: session.id, profileId: session.profileId };
  } catch (error) {
    console.error('Error getting session:', error);
    throw error;
  }
}

export async function deleteSession(sessionId: string) {
  try {
    // Just return true since our in-memory database doesn't need actual deletion
    return true;
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
}

export const dbInstance = {
  createProfile: async (profile: Omit<Profile, 'id'>): Promise<Profile> => {
    return db.createProfile(profile);
  },
  getProfile: async (id: string): Promise<Profile | null> => {
    return db.getProfile(id);
  },
  updateProfile: async (profile: Profile): Promise<Profile> => {
    return db.updateProfile(profile);
  },
  createSession,
  getSession,
  deleteSession
};

export async function initDatabase(): Promise<void> {
  // No initialization needed for in-memory database
  console.log('Using in-memory database for local development');
}