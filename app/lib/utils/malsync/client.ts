/**
 * MALSync API Client
 * 
 * This module provides integration with MALSync's API to get cross-platform mappings
 * between different anime sources like AniList, MyAnimeList, and TMDB.
 * It falls back to manual mappings when the API fails.
 * 
 * API Documentation: https://api.malsync.moe/
 */

import { BaseAPIClient } from '../../core/client';
import { 
  hasManualMapping, 
  getTmdbIdFromManualMapping, 
  getMalIdFromManualMapping,
  getFullMapping,
  ManualMapping
} from './manual-mappings';

export interface MalSyncMapping {
  id: string | number;
  type: 'anime' | 'manga';
  title: string;
  url: string;
  identifier?: string;
  malId?: number;
  simkl_id?: string | number;
  simkl_malid?: string | number;
  kitsu_id?: string | number;
  anilist_id?: number;
  tmdb_id?: number;
  animeplanet_id?: string;
  livechart_id?: string | number;
  notify_id?: string | number;
  anidb_id?: number;
  shikimori_id?: string | number;
  [key: string]: any;
}

/**
 * MALSync API Client for cross-platform anime ID mappings
 */
export class MalSyncClient {
  private readonly baseUrl = 'https://api.malsync.moe';
  private cache: Record<string, MalSyncMapping> = {};
  private useManualMappings: boolean = true;
  private useApiForManualMappings: boolean = false;

  constructor(options?: { useManualMappings?: boolean, useApiForManualMappings?: boolean }) {
    this.useManualMappings = options?.useManualMappings !== false;
    this.useApiForManualMappings = options?.useApiForManualMappings === true;
  }

  /**
   * Convert a manual mapping to MALSync format
   * 
   * @param mapping Manual mapping object
   * @returns MALSync-compatible mapping object
   */
  private convertManualMappingToMalSync(mapping: ManualMapping): MalSyncMapping {
    return {
      id: mapping.anilist,
      type: 'anime',
      title: mapping.title,
      url: `https://anilist.co/anime/${mapping.anilist}`,
      identifier: mapping.anilist.toString(),
      malId: mapping.mal,
      anilist_id: mapping.anilist,
      tmdb_id: mapping.tmdb,
      // Add a flag to know this came from our manual mappings
      _source: 'manual-mapping'
    };
  }

  /**
   * Get mappings for an AniList anime ID
   * 
   * @param anilistId AniList anime ID
   * @returns Promise with the MALSync mapping data
   */
  public async getAnilistMapping(anilistId: string | number): Promise<MalSyncMapping | null> {
    const cacheKey = `anilist-${anilistId}`;
    
    // Check cache first
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }
    
    // Check if we have a manual mapping and should use it immediately
    if (this.useManualMappings && hasManualMapping(anilistId) && !this.useApiForManualMappings) {
      const manualMapping = getFullMapping(anilistId);
      if (manualMapping) {
        const mapping = this.convertManualMappingToMalSync(manualMapping);
        this.cache[cacheKey] = mapping;
        return mapping;
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/anilist/anime/${anilistId}`);
      
      if (!response.ok) {
        console.warn(`Failed to get MALSync mapping for AniList ID ${anilistId}: ${response.status}`);
        
        // Fall back to manual mapping if API fails
        if (this.useManualMappings && hasManualMapping(anilistId)) {
          console.log(`Using manual mapping for AniList ID ${anilistId}`);
          const manualMapping = getFullMapping(anilistId);
          if (manualMapping) {
            const mapping = this.convertManualMappingToMalSync(manualMapping);
            this.cache[cacheKey] = mapping;
            return mapping;
          }
        }
        
        return null;
      }
      
      const data = await response.json() as MalSyncMapping;
      this.cache[cacheKey] = data;
      return data;
    } catch (error) {
      console.error(`Error fetching MALSync mapping for AniList ID ${anilistId}:`, error);
      
      // Fall back to manual mapping on error
      if (this.useManualMappings && hasManualMapping(anilistId)) {
        console.log(`Using manual mapping for AniList ID ${anilistId} after API error`);
        const manualMapping = getFullMapping(anilistId);
        if (manualMapping) {
          const mapping = this.convertManualMappingToMalSync(manualMapping);
          this.cache[cacheKey] = mapping;
          return mapping;
        }
      }
      
      return null;
    }
  }
  
  /**
   * Get mappings for a MyAnimeList anime ID
   * 
   * @param malId MyAnimeList anime ID
   * @returns Promise with the MALSync mapping data
   */
  public async getMalMapping(malId: string | number): Promise<MalSyncMapping | null> {
    const cacheKey = `mal-${malId}`;
    
    // Check cache first
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/mal/anime/${malId}`);
      
      if (!response.ok) {
        console.warn(`Failed to get MALSync mapping for MAL ID ${malId}: ${response.status}`);
        return null;
      }
      
      const data = await response.json() as MalSyncMapping;
      this.cache[cacheKey] = data;
      return data;
    } catch (error) {
      console.error(`Error fetching MALSync mapping for MAL ID ${malId}:`, error);
      return null;
    }
  }
  
  /**
   * Get the TMDB ID for an AniList anime
   * 
   * @param anilistId AniList anime ID
   * @returns The TMDB ID if found, null otherwise
   */
  public async getTmdbIdFromAnilist(anilistId: string | number): Promise<number | null> {
    // Fast path: Check manual mappings directly
    if (this.useManualMappings && !this.useApiForManualMappings) {
      const manualTmdbId = getTmdbIdFromManualMapping(anilistId);
      if (manualTmdbId) {
        console.log(`Found TMDB ID ${manualTmdbId} for AniList ID ${anilistId} in manual mappings`);
        return manualTmdbId;
      }
    }
    
    // Try API
    const mapping = await this.getAnilistMapping(anilistId);
    
    if (!mapping) {
      // Last resort: check manual mappings
      if (this.useManualMappings) {
        const manualTmdbId = getTmdbIdFromManualMapping(anilistId);
        if (manualTmdbId) {
          console.log(`Found TMDB ID ${manualTmdbId} for AniList ID ${anilistId} in manual mappings (after API failure)`);
          return manualTmdbId;
        }
      }
      return null;
    }
    
    // MALSync often has TMDB IDs via Simkl
    return mapping.tmdb_id || null;
  }

  /**
   * Get MAL ID from an AniList ID
   * 
   * @param anilistId AniList anime ID
   * @returns The MAL ID if found, null otherwise
   */
  public async getMalIdFromAnilist(anilistId: string | number): Promise<number | null> {
    // Fast path: Check manual mappings directly
    if (this.useManualMappings && !this.useApiForManualMappings) {
      const manualMalId = getMalIdFromManualMapping(anilistId);
      if (manualMalId) {
        console.log(`Found MAL ID ${manualMalId} for AniList ID ${anilistId} in manual mappings`);
        return manualMalId;
      }
    }
    
    const mapping = await this.getAnilistMapping(anilistId);
    
    if (!mapping) {
      // Last resort: check manual mappings
      if (this.useManualMappings) {
        const manualMalId = getMalIdFromManualMapping(anilistId);
        if (manualMalId) {
          console.log(`Found MAL ID ${manualMalId} for AniList ID ${anilistId} in manual mappings (after API failure)`);
          return manualMalId;
        }
      }
      return null;
    }
    
    return mapping.malId || null;
  }
  
  /**
   * Get AniList ID from a MAL ID
   * 
   * @param malId MyAnimeList anime ID
   * @returns The AniList ID if found, null otherwise
   */
  public async getAnilistIdFromMal(malId: string | number): Promise<number | null> {
    const mapping = await this.getMalMapping(malId);
    
    if (!mapping) return null;
    
    return mapping.anilist_id || null;
  }
  
  /**
   * Checks if the mapping is from our manual database
   * 
   * @param mapping MALSync mapping object
   * @returns True if the mapping is from our manual database
   */
  public isManualMapping(mapping: MalSyncMapping): boolean {
    return mapping._source === 'manual-mapping';
  }
}

export default new MalSyncClient({
  useManualMappings: true,
  useApiForManualMappings: false
});