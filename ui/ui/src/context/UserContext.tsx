import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
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

  // Load profile on mount
  useEffect(() => {
    refreshProfile();
  }, []);

  // Refresh profile from API
  const refreshProfile = async () => {
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
  };

  // Update profile with questionnaire answers
  const updateProfile = async (answers: Record<string, string>) => {
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
  };

  // Apply suggested profile adjustments
  const applyAdjustments = async () => {
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
  };

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