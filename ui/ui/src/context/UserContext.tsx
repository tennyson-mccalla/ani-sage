import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useRef } from 'react';
import { Dimension } from '../components/profile/DimensionDisplay';
import { apiService } from '../services/api';

// Define the shape of our context data
interface UserContextType {
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
}

// Create the context with a default value
const UserContext = createContext<UserContextType>({
  profile: null,
  isLoading: false,
  error: null,
  updateProfile: async () => {},
  applyAdjustments: async () => {},
  refreshProfile: async () => {},
});

// Provider component that wraps the app
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserContextType['profile']>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitializedRef = useRef(false);
  const isInitializingRef = useRef(false);

  // Initialize session on mount
  useEffect(() => {
    const initializeSession = async () => {
      if (isInitializedRef.current || isInitializingRef.current) {
        return;
      }

      try {
        isInitializingRef.current = true;
        await apiService.initSession();
        isInitializedRef.current = true;
        // After successful initialization, fetch the profile
        await refreshProfile();
      } catch (err) {
        console.error('Error initializing session:', err);
        setError('Failed to initialize session');
      } finally {
        isInitializingRef.current = false;
      }
    };

    initializeSession();
  }, []); // Empty dependency array since we're using refs

  // Refresh profile from API
  const refreshProfile = useCallback(async () => {
    if (isLoading || !isInitializedRef.current) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await apiService.getUserProfile();
      setProfile(data);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Update profile with questionnaire answers
  const updateProfile = useCallback(async (answers: Record<string, string>) => {
    if (isLoading) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await apiService.updateProfile(answers);
      await refreshProfile();
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, refreshProfile]);

  // Apply suggested profile adjustments
  const applyAdjustments = useCallback(async () => {
    if (isLoading) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await apiService.applyProfileAdjustments();
      await refreshProfile();
    } catch (err) {
      console.error('Error applying adjustments:', err);
      setError('Failed to apply profile adjustments');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, refreshProfile]);

  // Context value
  const value = {
    profile,
    isLoading,
    error,
    updateProfile,
    applyAdjustments,
    refreshProfile
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the user context
export const useUser = () => useContext(UserContext);
