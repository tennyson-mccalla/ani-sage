import type { UserProfile, Question, MCPContext } from './data-models';
import { createInitialProfile } from './psychological-dimensions';

/**
 * Storage and retrieval of user profiles via MCP
 */
export class MCPProfileManager {
  /**
   * Retrieves user profile from MCP context
   * Creates a new profile if one doesn't exist
   */
  static getUserProfile(mcpContext: MCPContext | null): UserProfile {
    if (!mcpContext || !mcpContext.userProfile) {
      // Generate a random user ID if no context exists
      const randomUserId = `user-${Math.random().toString(36).substring(2, 15)}`;
      return createInitialProfile(randomUserId);
    }
    
    return mcpContext.userProfile;
  }
  
  /**
   * Saves updated profile to MCP context
   */
  static updateUserProfile(mcpContext: MCPContext | null, profile: UserProfile): MCPContext {
    // If no context exists, create a new one
    if (!mcpContext) {
      return {
        userId: profile.userId,
        userProfile: profile,
        interactionHistory: [],
        recommendationHistory: []
      };
    }
    
    // Otherwise update the existing context
    return {
      ...mcpContext,
      userProfile: profile
    };
  }
  
  /**
   * Logs a question answer in the MCP context
   */
  static logQuestionAnswer(
    mcpContext: MCPContext | null, 
    questionId: string, 
    optionId: string
  ): MCPContext {
    // If no context exists, create a minimal one
    if (!mcpContext) {
      const randomUserId = `user-${Math.random().toString(36).substring(2, 15)}`;
      const profile = createInitialProfile(randomUserId);
      
      return {
        userId: randomUserId,
        userProfile: profile,
        interactionHistory: [{
          questionId,
          optionSelected: optionId,
          timestamp: new Date().toISOString()
        }],
        recommendationHistory: []
      };
    }
    
    // Otherwise update the existing context
    return {
      ...mcpContext,
      interactionHistory: [
        ...mcpContext.interactionHistory,
        {
          questionId,
          optionSelected: optionId,
          timestamp: new Date().toISOString()
        }
      ]
    };
  }
  
  /**
   * Logs an anime interaction (view, rate, etc.) in the MCP context
   */
  static logAnimeInteraction(
    mcpContext: MCPContext | null,
    animeId: string,
    interactionType: 'viewed' | 'selected' | 'watched' | 'rated',
    rating?: number
  ): MCPContext {
    // If no context exists, create a minimal one
    if (!mcpContext) {
      const randomUserId = `user-${Math.random().toString(36).substring(2, 15)}`;
      const profile = createInitialProfile(randomUserId);
      
      return {
        userId: randomUserId,
        userProfile: profile,
        interactionHistory: [],
        recommendationHistory: [{
          animeId,
          interactionType,
          rating,
          timestamp: new Date().toISOString()
        }]
      };
    }
    
    // Otherwise update the existing context
    return {
      ...mcpContext,
      recommendationHistory: [
        ...mcpContext.recommendationHistory,
        {
          animeId,
          interactionType,
          rating,
          timestamp: new Date().toISOString()
        }
      ]
    };
  }
  
  /**
   * Get all questions a user has already answered
   */
  static getAnsweredQuestionIds(mcpContext: MCPContext | null): string[] {
    if (!mcpContext || !mcpContext.userProfile) {
      return [];
    }
    
    return mcpContext.userProfile.answeredQuestions || [];
  }
  
  /**
   * Get anime interaction history for a user
   */
  static getAnimeInteractionHistory(mcpContext: MCPContext | null): {
    animeId: string,
    interactionType: 'viewed' | 'selected' | 'watched' | 'rated',
    rating?: number,
    timestamp: string
  }[] {
    if (!mcpContext || !mcpContext.recommendationHistory) {
      return [];
    }
    
    return mcpContext.recommendationHistory;
  }
  
  /**
   * Rebuild user profile from interaction history
   * Useful for restoring profiles or fixing corrupted data
   */
  static rebuildProfileFromHistory(
    mcpContext: MCPContext | null,
    questions: { [id: string]: Question },
    animeData: { [id: string]: { attributes: { [dimension: string]: number } } }
  ): UserProfile {
    if (!mcpContext) {
      // Generate a random user ID if no context exists
      const randomUserId = `user-${Math.random().toString(36).substring(2, 15)}`;
      return createInitialProfile(randomUserId);
    }
    
    // Start with a fresh profile
    let profile = createInitialProfile(mcpContext.userId);
    
    // Process question history
    mcpContext.interactionHistory.forEach(interaction => {
      const question = questions[interaction.questionId];
      if (question) {
        // We need to import and use the update function here
        // This is a circular dependency but illustrates the concept
        const { updateProfileFromQuestion } = require('./profile-update');
        profile = updateProfileFromQuestion(
          profile, 
          question, 
          interaction.optionSelected
        );
      }
    });
    
    // Process anime rating history
    const ratingInteractions = mcpContext.recommendationHistory
      .filter(rec => rec.interactionType === 'rated' && rec.rating !== undefined);
    
    ratingInteractions.forEach(interaction => {
      const anime = animeData[interaction.animeId];
      if (anime && interaction.rating !== undefined) {
        // We need to import and use the update function here
        const { updateProfileFromAnimeFeedback } = require('./profile-update');
        profile = updateProfileFromAnimeFeedback(
          profile, 
          anime.attributes, 
          interaction.rating,
          'rating'
        );
      }
    });
    
    return profile;
  }
}