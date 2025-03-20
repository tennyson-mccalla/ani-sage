'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Dimension } from '../components/profile/DimensionDisplay';
import { apiService } from '../services/api';

// Define the shape of our context data
interface UserContextType {
  sessionId: string | null;
  profile: {
    dimensions: Dimension[];
    suggestedAdjustments: {
      dimension: string;
      explanation: string;
      currentValue: number;
      suggestedValue: number;
    }[];
  } | null;
  isLoading: boolean;
  error: string | null;
  updateProfile: (answers: Record<string, string>) => Promise<void>;
  applyAdjustments: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  createSession: () => Promise<string>;
}

// Create the context with a default value
const UserContext = createContext<UserContextType>({
  sessionId: null,
  profile: null,
  isLoading: false,
  error: null,
  updateProfile: async () => {},
  applyAdjustments: async () => {},
  refreshProfile: async () => {},
  createSession: async () => '',
});

// Provider component that wraps the app
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserContextType['profile']>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load session and profile on mount
  useEffect(() => {
    const loadSessionAndProfile = async () => {
      // Try to get session from localStorage
      const storedSessionId = localStorage.getItem('sessionId');
      
      if (storedSessionId) {
        setSessionId(storedSessionId);
        await refreshProfile();
      } else {
        // Create a new session if none exists
        try {
          await createSession();
        } catch (err) {
          console.error('Failed to create initial session:', err);
          // Continue with mock data if session creation fails
        }
      }
    };
    
    loadSessionAndProfile();
  }, []);

  // Create a new session
  const createSession = async (): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('UserContext: Creating session...');
      const newSessionId = await apiService.createSession();
      console.log('UserContext: Session created with ID:', newSessionId);
      
      if (newSessionId) {
        setSessionId(newSessionId);
        localStorage.setItem('sessionId', newSessionId);
        console.log('UserContext: Session ID stored in localStorage and state');
        return newSessionId;
      } else {
        console.error('UserContext: Session creation failed, no ID returned');
        throw new Error('Failed to create a session');
      }
    } catch (err) {
      console.error('UserContext: Error creating session:', err);
      setError('Failed to create a session');
      
      // Create a fallback mock session ID for development
      const fallbackId = `fallback-${Math.random().toString(36).substring(2, 15)}`;
      console.log('UserContext: Using fallback session ID:', fallbackId);
      setSessionId(fallbackId);
      localStorage.setItem('sessionId', fallbackId);
      
      return fallbackId;
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh profile from API
  const refreshProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (sessionId) {
        // Use real API if session exists
        const data = await apiService.getUserProfile(sessionId);
        setProfile(data);
      } else {
        // Fall back to mock data if no session
        const mockData = await apiService.getUserProfile();
        setProfile(mockData);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile with questionnaire answers
  const updateProfile = async (answers: Record<string, string>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // If no session exists, create one first
      if (!sessionId) {
        await createSession();
      }
      
      await apiService.updateProfile(answers, sessionId);
      await refreshProfile();
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Apply suggested profile adjustments
  const applyAdjustments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // If no session exists, create one first
      if (!sessionId) {
        await createSession();
      }
      
      await apiService.applyProfileAdjustments(sessionId);
      await refreshProfile();
    } catch (err) {
      console.error('Error applying adjustments:', err);
      setError('Failed to apply profile adjustments');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const value = {
    sessionId,
    profile,
    isLoading,
    error,
    updateProfile,
    applyAdjustments,
    refreshProfile,
    createSession
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the user context
export const useUser = () => useContext(UserContext);
