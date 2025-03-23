/**
 * Anime Data Service
 * 
 * This service manages anime data for the recommendation engine.
 * It loads data from local cache and provides fallback to API when needed.
 */

import fs from 'fs';
import path from 'path';
import { AnimeApiAdapter, createApiAdapter } from '../app/lib/anime-api-adapter';
import { AnimeTitle } from '../data-models';
import { runAniListPipeline } from './anilist-data-pipeline';

// Configuration
const DATA_DIR = path.join(process.cwd(), 'data');
const ANIME_DATA_FILE = path.join(DATA_DIR, 'top-anime.json');
const ID_MAPPINGS_FILE = path.join(DATA_DIR, 'id-mappings.json');
const CACHE_EXPIRY_DAYS = 7; // Refresh cache after 7 days

// Interface for ID mappings
interface IdMapping {
  anilistId?: number;
  malId?: number;
  tmdbId?: number;
  title: string;
}

export class AnimeDataService {
  private animeData: AnimeTitle[] = [];
  private idMappings: IdMapping[] = [];
  private apiAdapter: AnimeApiAdapter;
  private lastRefreshed: Date | null = null;
  
  constructor() {
    this.apiAdapter = createApiAdapter();
    this.initializeDataService();
  }
  
  /**
   * Initialize the data service by loading cached data or fetching new data
   */
  private async initializeDataService(): Promise<void> {
    try {
      if (this.shouldRefreshCache()) {
        console.log('Anime data cache expired or not found. Refreshing...');
        await this.refreshAnimeData();
      } else {
        console.log('Loading anime data from cache...');
        this.loadAnimeDataFromCache();
      }
    } catch (error) {
      console.error('Error initializing anime data service:', error);
      // If we fail to refresh or load from cache, start with an empty dataset
      this.animeData = [];
    }
  }
  
  /**
   * Check if we need to refresh the cache
   */
  private shouldRefreshCache(): boolean {
    // Check if cache file exists
    if (!fs.existsSync(ANIME_DATA_FILE)) {
      return true;
    }
    
    // Check file modification time
    const stats = fs.statSync(ANIME_DATA_FILE);
    const modifiedTime = new Date(stats.mtime);
    const currentTime = new Date();
    const daysSinceModification = (currentTime.getTime() - modifiedTime.getTime()) / (1000 * 60 * 60 * 24);
    
    return daysSinceModification > CACHE_EXPIRY_DAYS;
  }
  
  /**
   * Load anime data and ID mappings from local cache
   */
  private loadAnimeDataFromCache(): void {
    try {
      // Load anime data
      if (fs.existsSync(ANIME_DATA_FILE)) {
        const rawData = fs.readFileSync(ANIME_DATA_FILE, 'utf8');
        this.animeData = JSON.parse(rawData);
        this.lastRefreshed = fs.statSync(ANIME_DATA_FILE).mtime;
        console.log(`Loaded ${this.animeData.length} anime from cache`);
      } else {
        console.log('No anime data cache found');
        this.animeData = [];
      }
      
      // Load ID mappings
      if (fs.existsSync(ID_MAPPINGS_FILE)) {
        const rawMappings = fs.readFileSync(ID_MAPPINGS_FILE, 'utf8');
        this.idMappings = JSON.parse(rawMappings);
        console.log(`Loaded ${this.idMappings.length} ID mappings from cache`);
      } else {
        console.log('No ID mappings cache found');
        this.idMappings = [];
      }
    } catch (error) {
      console.error('Error loading data from cache:', error);
      this.animeData = [];
      this.idMappings = [];
    }
  }
  
  /**
   * Refresh anime data by running the AniList pipeline
   */
  public async refreshAnimeData(): Promise<void> {
    try {
      console.log('Running AniList data pipeline...');
      await runAniListPipeline();
      
      // After pipeline completes, load the updated data
      this.loadAnimeDataFromCache();
      this.lastRefreshed = new Date();
    } catch (error) {
      console.error('Error refreshing anime data:', error);
      throw error;
    }
  }
  
  /**
   * Get all anime in the dataset
   */
  public getAllAnime(): AnimeTitle[] {
    return this.animeData;
  }
  
  /**
   * Get anime by ID
   */
  public getAnimeById(id: string): AnimeTitle | undefined {
    return this.animeData.find(anime => anime.id === id);
  }
  
  /**
   * Get anime by external ID (MAL, AniList, etc.)
   */
  public getAnimeByExternalId(type: 'malId' | 'anilistId' | 'tmdbId', id: number): AnimeTitle | undefined {
    return this.animeData.find(
      anime => anime.externalIds && anime.externalIds[type] === id
    );
  }
  
  /**
   * Convert between external IDs
   * 
   * @param sourceType Source ID type
   * @param sourceId Source ID value
   * @param targetType Target ID type to get
   * @returns The target ID if found, undefined otherwise
   */
  public convertExternalId(
    sourceType: 'malId' | 'anilistId' | 'tmdbId', 
    sourceId: number, 
    targetType: 'malId' | 'anilistId' | 'tmdbId'
  ): number | undefined {
    // Check if we already have the anime in our data
    const anime = this.getAnimeByExternalId(sourceType, sourceId);
    if (anime?.externalIds?.[targetType]) {
      return anime.externalIds[targetType];
    }
    
    // Check ID mappings
    const mapping = this.idMappings.find(m => m[sourceType] === sourceId);
    if (mapping?.[targetType]) {
      return mapping[targetType];
    }
    
    return undefined;
  }
  
  /**
   * Get all available ID mappings
   */
  public getAllIdMappings(): IdMapping[] {
    return this.idMappings;
  }
  
  /**
   * Search anime by title
   */
  public searchAnime(query: string, limit: number = 10): AnimeTitle[] {
    const normalizedQuery = query.toLowerCase();
    
    return this.animeData
      .filter(anime => {
        // Search in main title
        if (anime.title.toLowerCase().includes(normalizedQuery)) {
          return true;
        }
        
        // Search in alternative titles
        if (anime.alternativeTitles && anime.alternativeTitles.some(
          title => title && title.toLowerCase().includes(normalizedQuery)
        )) {
          return true;
        }
        
        return false;
      })
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, limit);
  }
  
  /**
   * Get top anime by popularity
   */
  public getTopAnime(limit: number = 50): AnimeTitle[] {
    return [...this.animeData]
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, limit);
  }
  
  /**
   * Get top anime by rating
   */
  public getTopRatedAnime(limit: number = 50): AnimeTitle[] {
    return [...this.animeData]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit);
  }
  
  /**
   * Get anime by genre
   */
  public getAnimeByGenre(genre: string, limit: number = 50): AnimeTitle[] {
    const normalizedGenre = genre.toLowerCase();
    
    return this.animeData
      .filter(anime => 
        anime.genres && anime.genres.some(g => g.toLowerCase() === normalizedGenre)
      )
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, limit);
  }
  
  /**
   * Fallback to API if anime is not in local dataset
   */
  public async getAnimeDetailsWithApiFallback(id: string): Promise<AnimeTitle | null> {
    // Try to get from local data first
    const localAnime = this.getAnimeById(id);
    if (localAnime) {
      return localAnime;
    }
    
    // If not found locally, try the API
    try {
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        return null;
      }
      
      return await this.apiAdapter.getAnimeDetails(numericId);
    } catch (error) {
      console.error('Error fetching anime details from API:', error);
      return null;
    }
  }
  
  /**
   * Get the dataset size
   */
  public getDatasetSize(): number {
    return this.animeData.length;
  }
  
  /**
   * Get when the dataset was last refreshed
   */
  public getLastRefreshedDate(): Date | null {
    return this.lastRefreshed;
  }
}

// Create a singleton instance
let instance: AnimeDataService | null = null;

export function getAnimeDataService(): AnimeDataService {
  if (!instance) {
    instance = new AnimeDataService();
  }
  return instance;
}