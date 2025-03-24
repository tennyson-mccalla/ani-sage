/**
 * Cross-platform ID Mapping Client
 * 
 * This module provides ID mappings between different anime platforms
 * using an internal database of manual mappings.
 * 
 * Previously integrated with MALSync API, but it has been removed due to
 * consistent 404 errors. Now using only manual mappings.
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
  private cache: Record<string, MalSyncMapping> = {};
  
  constructor() {
    // No configuration needed since we only use manual mappings
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
   * @returns Promise with the mapping data from manual database
   */
  public async getAnilistMapping(anilistId: string | number): Promise<MalSyncMapping | null> {
    const cacheKey = `anilist-${anilistId}`;
    
    // Check cache first
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }
    
    // Check if we have a manual mapping
    if (hasManualMapping(anilistId)) {
      const manualMapping = getFullMapping(anilistId);
      if (manualMapping) {
        const mapping = this.convertManualMappingToMalSync(manualMapping);
        this.cache[cacheKey] = mapping;
        return mapping;
      }
    }
    
    // No mapping found in manual database
    return null;
  }
  
  /**
   * Get mappings for a MyAnimeList anime ID
   * 
   * @param malId MyAnimeList anime ID
   * @returns Promise with the mapping data - only returns from matching manual mappings
   */
  public async getMalMapping(malId: string | number): Promise<MalSyncMapping | null> {
    const cacheKey = `mal-${malId}`;
    
    // Check cache first
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }
    
    // Search through manual mappings for matching MAL ID
    for (const key in manualMappings) {
      const mapping = manualMappings[key];
      if (mapping.mal === Number(malId)) {
        const result = this.convertManualMappingToMalSync(mapping);
        this.cache[cacheKey] = result;
        return result;
      }
    }
    
    // No mapping found in manual database
    return null;
  }
  
  /**
   * Get the TMDB ID for an AniList anime
   * 
   * @param anilistId AniList anime ID
   * @returns The TMDB ID if found, null otherwise
   */
  public async getTmdbIdFromAnilist(anilistId: string | number): Promise<number | null> {
    // Check manual mappings directly
    const manualTmdbId = getTmdbIdFromManualMapping(anilistId);
    if (manualTmdbId) {
      console.log(`Found TMDB ID ${manualTmdbId} for AniList ID ${anilistId} in manual mappings`);
      return manualTmdbId;
    }
    
    // No TMDB ID found
    return null;
  }

  /**
   * Get MAL ID from an AniList ID
   * 
   * @param anilistId AniList anime ID
   * @returns The MAL ID if found, null otherwise
   */
  public async getMalIdFromAnilist(anilistId: string | number): Promise<number | null> {
    // Check manual mappings directly
    const manualMalId = getMalIdFromManualMapping(anilistId);
    if (manualMalId) {
      console.log(`Found MAL ID ${manualMalId} for AniList ID ${anilistId} in manual mappings`);
      return manualMalId;
    }
    
    // No MAL ID found
    return null;
  }
  
  /**
   * Get AniList ID from a MAL ID
   * 
   * @param malId MyAnimeList anime ID
   * @returns The AniList ID if found, null otherwise
   */
  public async getAnilistIdFromMal(malId: string | number): Promise<number | null> {
    // Search through manual mappings
    for (const key in manualMappings) {
      const mapping = manualMappings[key];
      if (mapping.mal === Number(malId)) {
        return mapping.anilist;
      }
    }
    
    return null;
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

export default new MalSyncClient();