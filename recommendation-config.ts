/**
 * Recommendation Engine Configuration
 * 
 * This module defines the configuration interfaces and default settings
 * for the recommendation engine.
 */

import type { FilterOptions } from './recommendation-filters';

/**
 * Main recommendation engine configuration
 */
export interface RecommendationConfig {
  /**
   * General settings
   */
  general: {
    /**
     * Number of recommendations to generate
     */
    count: number;
    
    /**
     * Minimum match score (0-1) for recommendations
     */
    minMatchScore: number;
    
    /**
     * Recommendation freshness
     * 0: All recent recommendations allowed
     * 1: Full avoidance of recent recommendations
     */
    freshness: number;
    
    /**
     * Number of days to remember recommendations for freshness
     */
    freshnessMemoryDays: number;
  };
  
  /**
   * Clustering settings
   */
  clustering: {
    /**
     * Enable clustering-based recommendations
     */
    enabled: boolean;
    
    /**
     * Whether to include adjacent clusters
     */
    includeAdjacentClusters: boolean;
    
    /**
     * Maximum number of clusters to consider
     */
    maxClusters: number;
  };
  
  /**
   * Filtering settings
   */
  filtering: FilterOptions;
  
  /**
   * Diversity settings
   */
  diversity: {
    /**
     * Enable diversity enhancement
     */
    enabled: boolean;
    
    /**
     * Weight of score vs diversity (0-1)
     * 0: Only diversity matters
     * 1: Only score matters
     */
    scoreWeight: number;
  };
  
  /**
   * Personalization settings
   */
  personalization: {
    /**
     * Weight of psychological dimensions vs. explicit preferences
     * 0: Only explicit preferences
     * 1: Only psychological dimensions
     */
    psychologicalWeight: number;
    
    /**
     * Enable collaborative filtering
     */
    useCollaborative: boolean;
    
    /**
     * Enable content-based filtering
     */
    useContentBased: boolean;
  };
}

/**
 * Default recommendation engine configuration
 */
export const DEFAULT_RECOMMENDATION_CONFIG: RecommendationConfig = {
  general: {
    count: 10,
    minMatchScore: 0.6,
    freshness: 0.7,
    freshnessMemoryDays: 30
  },
  clustering: {
    enabled: true,
    includeAdjacentClusters: true,
    maxClusters: 5
  },
  filtering: {
    genreDiversity: true,
    timeRangeDiversity: true,
    popularitySpread: true,
    minRating: 6.5
  },
  diversity: {
    enabled: true,
    scoreWeight: 0.7
  },
  personalization: {
    psychologicalWeight: 0.8,
    useCollaborative: true,
    useContentBased: true
  }
};

/**
 * Get recommendation config with user overrides
 * 
 * @param overrides User config overrides
 * @returns Merged configuration
 */
export function getRecommendationConfig(
  overrides: Partial<RecommendationConfig> = {}
): RecommendationConfig {
  return {
    general: {
      ...DEFAULT_RECOMMENDATION_CONFIG.general,
      ...overrides.general
    },
    clustering: {
      ...DEFAULT_RECOMMENDATION_CONFIG.clustering,
      ...overrides.clustering
    },
    filtering: {
      ...DEFAULT_RECOMMENDATION_CONFIG.filtering,
      ...overrides.filtering
    },
    diversity: {
      ...DEFAULT_RECOMMENDATION_CONFIG.diversity,
      ...overrides.diversity
    },
    personalization: {
      ...DEFAULT_RECOMMENDATION_CONFIG.personalization,
      ...overrides.personalization
    }
  };
}