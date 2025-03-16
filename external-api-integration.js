/**
 * External API Integration Services
 * 
 * Services for integrating with external APIs: MyAnimeList, AniList, 
 * TMDb, and YouTube to fetch anime data and enrichment.
 */

/**
 * Base API client with request throttling to handle rate limits
 */
class BaseApiClient {
  constructor(baseUrl, rateLimit = { requests: 5, perSeconds: 1 }) {
    this.baseUrl = baseUrl;
    this.rateLimit = rateLimit;
    this.requestQueue = [];
    this.processing = false;
  }
  
  /**
   * Enqueue a request to be processed according to rate limits
   */
  async enqueueRequest(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
      // Add to queue
      this.requestQueue.push({
        endpoint,
        options,
        resolve,
        reject
      });
      
      // Start processing if not already running
      if (!this.processing) {
        this.processQueue();
      }
    });
  }
  
  /**
   * Process the request queue with rate limiting
   */
  async processQueue() {
    if (this.requestQueue.length === 0) {
      this.processing = false;
      return;
    }
    
    this.processing = true;
    
    const batch = this.requestQueue.splice(0, this.rateLimit.requests);
    const batchPromises = batch.map(request => this.executeRequest(request));
    
    // Process current batch
    await Promise.all(batchPromises);
    
    // Wait for rate limit window
    if (this.requestQueue.length > 0) {
      await new Promise(resolve => setTimeout(
        resolve, 
        (this.rateLimit.perSeconds * 1000) + 50 // Add 50ms buffer
      ));
      this.processQueue();
    } else {
      this.processing = false;
    }
  }
  
  /**
   * Execute a single request
   */
  async executeRequest(request) {
    try {
      const url = `${this.baseUrl}${request.endpoint}`;
      const response = await fetch(url, request.options);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      request.resolve(data);
      
    } catch (error) {
      request.reject(error);
    }
  }
}

/**
 * MyAnimeList API Client
 */
class MyAnimeListClient extends BaseApiClient {
  constructor(clientId) {
    super('https://api.myanimelist.net/v2', { requests: 3, perSeconds: 1 });
    this.clientId = clientId;
  }
  
  /**
   * Get default request options with authentication
   */
  getRequestOptions() {
    return {
      headers: {
        'X-MAL-CLIENT-ID': this.clientId,
        'Accept': 'application/json'
      }
    };
  }
  
  /**
   * Search for anime by title
   */
  async searchAnime(query, limit = 10) {
    const endpoint = `/anime?q=${encodeURIComponent(query)}&limit=${limit}&fields=id,title,synopsis,genres,mean,num_episodes,start_season,studios,popularity,media_type`;
    return this.enqueueRequest(endpoint, this.getRequestOptions());
  }
  
  /**
   * Get detailed anime information
   */
  async getAnimeDetails(animeId) {
    const endpoint = `/anime/${animeId}?fields=id,title,alternative_titles,synopsis,genres,mean,num_episodes,start_season,studios,popularity,media_type,pictures,related_anime,recommendations`;
    return this.enqueueRequest(endpoint, this.getRequestOptions());
  }
  
  /**
   * Get seasonal anime
   */
  async getSeasonalAnime(year, season, limit = 20) {
    const endpoint = `/anime/season/${year}/${season}?limit=${limit}&fields=id,title,synopsis,genres,mean,num_episodes,studios,popularity`;
    return this.enqueueRequest(endpoint, this.getRequestOptions());
  }
}

/**
 * AniList API Client
 */
class AniListClient extends BaseApiClient {
  constructor() {
    super('https://graphql.anilist.co', { requests: 5, perSeconds: 1 });
  }
  
  /**
   * Execute a GraphQL query against AniList API
   */
  async executeQuery(query, variables = {}) {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables
      })
    };
    
    return this.enqueueRequest('', options);
  }
  
  /**
   * Search for anime
   */
  async searchAnime(search, page = 1, perPage = 10) {
    const query = `
      query ($search: String, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(search: $search, type: ANIME) {
            id
            idMal
            title {
              romaji
              english
              native
            }
            description
            genres
            episodes
            duration
            format
            startDate {
              year
              month
              day
            }
            averageScore
            popularity
            tags {
              id
              name
              category
            }
            coverImage {
              large
              medium
            }
          }
        }
      }
    `;
    
    return this.executeQuery(query, { search, page, perPage });
  }
  
  /**
   * Get detailed anime information
   */
  async getAnimeDetails(id) {
    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          idMal
          title {
            romaji
            english
            native
          }
          description
          genres
          episodes
          duration
          format
          status
          startDate {
            year
            month
            day
          }
          averageScore
          popularity
          tags {
            id
            name
            category
            rank
          }
          characters(sort: ROLE) {
            nodes {
              id
              name {
                full
              }
              image {
                medium
              }
            }
          }
          staff {
            nodes {
              id
              name {
                full
              }
              primaryOccupations
            }
          }
          studios {
            nodes {
              id
              name
            }
          }
          relations {
            edges {
              relationType
              node {
                id
                title {
                  romaji
                }
                format
              }
            }
          }
          coverImage {
            large
            medium
          }
          bannerImage
        }
      }
    `;
    
    return this.executeQuery(query, { id });
  }
  
  /**
   * Get anime recommendations based on a specific anime
   */
  async getAnimeRecommendations(id) {
    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          recommendations(sort: RATING_DESC) {
            nodes {
              mediaRecommendation {
                id
                idMal
                title {
                  romaji
                  english
                }
                genres
                averageScore
                popularity
                coverImage {
                  medium
                }
              }
            }
          }
        }
      }
    `;
    
    return this.executeQuery(query, { id });
  }
}

/**
 * TMDb API Client
 */
class TMDbClient extends BaseApiClient {
  constructor(apiKey) {
    super('https://api.themoviedb.org/3', { requests: 5, perSeconds: 1 });
    this.apiKey = apiKey;
  }
  
  /**
   * Add API key to endpoint
   */
  addApiKey(endpoint) {
    const separator = endpoint.includes('?') ? '&' : '?';
    return `${endpoint}${separator}api_key=${this.apiKey}`;
  }
  
  /**
   * Search for anime in TMDb
   */
  async searchAnime(query, page = 1) {
    const endpoint = this.addApiKey(`/search/tv?query=${encodeURIComponent(query)}&page=${page}&include_adult=false`);
    return this.enqueueRequest(endpoint);
  }
  
  /**
   * Get TV show details
   */
  async getTvDetails(tvId) {
    const endpoint = this.addApiKey(`/tv/${tvId}?append_to_response=images,videos,keywords`);
    return this.enqueueRequest(endpoint);
  }
  
  /**
   * Get images for a TV show
   */
  async getTvImages(tvId) {
    const endpoint = this.addApiKey(`/tv/${tvId}/images`);
    return this.enqueueRequest(endpoint);
  }
  
  /**
   * Get videos (trailers, teasers) for a TV show
   */
  async getTvVideos(tvId) {
    const endpoint = this.addApiKey(`/tv/${tvId}/videos`);
    return this.enqueueRequest(endpoint);
  }
}

/**
 * YouTube API Client
 */
class YouTubeClient extends BaseApiClient {
  constructor(apiKey) {
    super('https://www.googleapis.com/youtube/v3', { requests: 3, perSeconds: 1 });
    this.apiKey = apiKey;
  }
  
  /**
   * Add API key to endpoint
   */
  addApiKey(endpoint) {
    const separator = endpoint.includes('?') ? '&' : '?';
    return `${endpoint}${separator}key=${this.apiKey}`;
  }
  
  /**
   * Search for anime trailers on YouTube
   */
  async searchAnimeTrailer(animeName, maxResults = 5) {
    const query = `${animeName} anime trailer official`;
    const endpoint = this.addApiKey(`/search?part=snippet&q=${encodeURIComponent(query)}&maxResults=${maxResults}&type=video`);
    return this.enqueueRequest(endpoint);
  }
  
  /**
   * Get video details
   */
  async getVideoDetails(videoId) {
    const endpoint = this.addApiKey(`/videos?part=snippet,contentDetails,statistics&id=${videoId}`);
    return this.enqueueRequest(endpoint);
  }
}

/**
 * API Integration facade that coordinates between different APIs
 */
class ApiIntegrationService {
  constructor(config) {
    this.malClient = new MyAnimeListClient(config.malClientId);
    this.anilistClient = new AniListClient();
    this.tmdbClient = new TMDbClient(config.tmdbApiKey);
    this.youtubeClient = new YouTubeClient(config.youtubeApiKey);
    
    // Cache for API responses
    this.cache = {
      mal: new Map(),
      anilist: new Map(),
      tmdb: new Map(),
      youtube: new Map()
    };
    
    // Cache TTL in milliseconds (24 hours)
    this.cacheTtl = 24 * 60 * 60 * 1000;
  }
  
  /**
   * Get from cache or fetch from API
   */
  async getFromCacheOrFetch(cacheKey, cacheName, fetchFn) {
    // Check cache first
    const cache = this.cache[cacheName];
    const cachedItem = cache.get(cacheKey);
    
    if (cachedItem && cachedItem.timestamp > Date.now() - this.cacheTtl) {
      return cachedItem.data;
    }
    
    // Fetch from API
    const data = await fetchFn();
    
    // Store in cache
    cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  }
  
  /**
   * Search for anime across multiple platforms
   */
  async searchAnime(query, limit = 10) {
    const cacheKey = `search:${query}:${limit}`;
    
    // Run searches in parallel
    const [malResults, anilistResults] = await Promise.all([
      this.getFromCacheOrFetch(
        cacheKey, 
        'mal', 
        () => this.malClient.searchAnime(query, limit)
      ),
      this.getFromCacheOrFetch(
        cacheKey, 
        'anilist', 
        () => this.anilistClient.searchAnime(query, limit)
      )
    ]);
    
    // Merge and deduplicate results
    return this.mergeSearchResults(malResults, anilistResults);
  }
  
  /**
   * Merge and deduplicate results from different APIs
   */
  mergeSearchResults(malResults, anilistResults) {
    const merged = [];
    const idMap = new Map();
    
    // Process MAL results
    if (malResults && malResults.data) {
      malResults.data.forEach(anime => {
        const id = `mal:${anime.id}`;
        idMap.set(id, merged.length);
        
        merged.push({
          id,
          title: anime.title,
          alternativeTitles: [],
          synopsis: anime.synopsis,
          genres: anime.genres.map(g => g.name),
          episodeCount: anime.num_episodes,
          year: anime.start_season ? anime.start_season.year : null,
          season: anime.start_season ? anime.start_season.season : null,
          rating: anime.mean,
          popularity: anime.popularity,
          externalIds: {
            malId: anime.id
          },
          source: 'mal'
        });
      });
    }
    
    // Process AniList results
    if (anilistResults && anilistResults.data && anilistResults.data.Page) {
      anilistResults.data.Page.media.forEach(anime => {
        const malId = anime.idMal;
        
        // Check if already added from MAL
        if (malId && idMap.has(`mal:${malId}`)) {
          const index = idMap.get(`mal:${malId}`);
          const existing = merged[index];
          
          // Enhance existing record with AniList data
          existing.alternativeTitles = [
            anime.title.english,
            anime.title.native
          ].filter(Boolean);
          
          existing.externalIds.anilistId = anime.id;
          
          if (anime.coverImage && anime.coverImage.large) {
            existing.imageUrls = {
              poster: anime.coverImage.large
            };
          }
        } else {
          // New anime not in MAL results
          const id = `anilist:${anime.id}`;
          idMap.set(id, merged.length);
          
          merged.push({
            id,
            title: anime.title.romaji,
            alternativeTitles: [
              anime.title.english,
              anime.title.native
            ].filter(Boolean),
            synopsis: anime.description,
            genres: anime.genres,
            episodeCount: anime.episodes,
            year: anime.startDate ? anime.startDate.year : null,
            season: this.getSeason(anime.startDate),
            rating: anime.averageScore / 10, // Convert to 10-point scale
            popularity: anime.popularity,
            externalIds: {
              anilistId: anime.id,
              malId: anime.idMal
            },
            imageUrls: anime.coverImage ? {
              poster: anime.coverImage.large
            } : {},
            source: 'anilist'
          });
        }
      });
    }
    
    return merged;
  }
  
  /**
   * Get season from date object
   */
  getSeason(date) {
    if (!date || !date.month) return null;
    
    const month = date.month;
    
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'fall';
    return 'winter';
  }
  
  /**
   * Get detailed anime information from all sources
   */
  async getAnimeDetails(animeId) {
    const [source, id] = animeId.split(':');
    
    if (source === 'mal') {
      return this.getFromCacheOrFetch(
        animeId,
        'mal',
        () => this.getAnimeDetailsFromMal(id)
      );
    } else if (source === 'anilist') {
      return this.getFromCacheOrFetch(
        animeId,
        'anilist',
        () => this.getAnimeDetailsFromAnilist(id)
      );
    } else {
      throw new Error(`Unknown source: ${source}`);
    }
  }
  
  /**
   * Get anime details from MyAnimeList
   */
  async getAnimeDetailsFromMal(malId) {
    const details = await this.malClient.getAnimeDetails(malId);
    
    // Basic anime data
    const anime = {
      id: `mal:${details.id}`,
      title: details.title,
      alternativeTitles: [
        details.alternative_titles?.en,
        details.alternative_titles?.ja
      ].filter(Boolean),
      synopsis: details.synopsis,
      genres: details.genres.map(g => g.name),
      episodeCount: details.num_episodes,
      year: details.start_season?.year,
      season: details.start_season?.season,
      rating: details.mean,
      popularity: details.popularity,
      externalIds: {
        malId: details.id
      },
      imageUrls: {
        poster: details.main_picture?.large || details.main_picture?.medium
      },
      source: 'mal'
    };
    
    // Try to find a matching anime on TMDb for poster/trailer
    const tmdbResults = await this.tmdbClient.searchAnime(details.title);
    
    if (tmdbResults && tmdbResults.results && tmdbResults.results.length > 0) {
      const bestMatch = this.findBestTmdbMatch(tmdbResults.results, details);
      
      if (bestMatch) {
        anime.externalIds.tmdbId = bestMatch.id;
        
        // Get more TMDb details
        const tmdbDetails = await this.tmdbClient.getTvDetails(bestMatch.id);
        const videos = await this.tmdbClient.getTvVideos(bestMatch.id);
        
        // Add poster and backdrop images
        if (tmdbDetails.poster_path) {
          anime.imageUrls.poster = `https://image.tmdb.org/t/p/w500${tmdbDetails.poster_path}`;
        }
        
        if (tmdbDetails.backdrop_path) {
          anime.imageUrls.banner = `https://image.tmdb.org/t/p/w1280${tmdbDetails.backdrop_path}`;
        }
        
        // Find a trailer
        if (videos && videos.results && videos.results.length > 0) {
          const trailer = videos.results.find(v => 
            v.type === 'Trailer' && v.site === 'YouTube'
          );
          
          if (trailer) {
            anime.externalIds.youtubeTrailerId = trailer.key;
          }
        }
      }
    }
    
    // If no YouTube trailer from TMDb, search directly
    if (!anime.externalIds.youtubeTrailerId) {
      await this.findYoutubeTrailer(anime);
    }
    
    return anime;
  }
  
  /**
   * Get anime details from AniList
   */
  async getAnimeDetailsFromAnilist(anilistId) {
    const response = await this.anilistClient.getAnimeDetails(parseInt(anilistId));
    const details = response.data.Media;
    
    // Basic anime data
    const anime = {
      id: `anilist:${details.id}`,
      title: details.title.romaji,
      alternativeTitles: [
        details.title.english,
        details.title.native
      ].filter(Boolean),
      synopsis: details.description,
      genres: details.genres,
      episodeCount: details.episodes,
      year: details.startDate?.year,
      season: this.getSeason(details.startDate),
      rating: details.averageScore / 10, // Convert to 10-point scale
      popularity: details.popularity,
      externalIds: {
        anilistId: details.id,
        malId: details.idMal
      },
      imageUrls: {},
      source: 'anilist'
    };
    
    // Add images
    if (details.coverImage) {
      anime.imageUrls.poster = details.coverImage.large || details.coverImage.medium;
    }
    
    if (details.bannerImage) {
      anime.imageUrls.banner = details.bannerImage;
    }
    
    // If MAL ID exists, try to get additional data from MAL
    if (details.idMal) {
      try {
        const malDetails = await this.malClient.getAnimeDetails(details.idMal);
        
        // Enhanced synopsis if available
        if (malDetails.synopsis && malDetails.synopsis.length > anime.synopsis.length) {
          anime.synopsis = malDetails.synopsis;
        }
      } catch (error) {
        console.warn(`Could not fetch MAL details for ID ${details.idMal}:`, error.message);
      }
    }
    
    // Try to find a matching anime on TMDb for poster/trailer
    const tmdbResults = await this.tmdbClient.searchAnime(details.title.romaji);
    
    if (tmdbResults && tmdbResults.results && tmdbResults.results.length > 0) {
      const bestMatch = this.findBestTmdbMatch(tmdbResults.results, {
        title: details.title.romaji,
        alternative_titles: {
          en: details.title.english
        },
        start_season: {
          year: details.startDate?.year
        }
      });
      
      if (bestMatch) {
        anime.externalIds.tmdbId = bestMatch.id;
        
        // Get more TMDb details
        const tmdbDetails = await this.tmdbClient.getTvDetails(bestMatch.id);
        const videos = await this.tmdbClient.getTvVideos(bestMatch.id);
        
        // Add poster and backdrop images if better quality available
        if (tmdbDetails.poster_path) {
          anime.imageUrls.tmdbPoster = `https://image.tmdb.org/t/p/w500${tmdbDetails.poster_path}`;
        }
        
        if (tmdbDetails.backdrop_path) {
          anime.imageUrls.banner = `https://image.tmdb.org/t/p/w1280${tmdbDetails.backdrop_path}`;
        }
        
        // Find a trailer
        if (videos && videos.results && videos.results.length > 0) {
          const trailer = videos.results.find(v => 
            v.type === 'Trailer' && v.site === 'YouTube'
          );
          
          if (trailer) {
            anime.externalIds.youtubeTrailerId = trailer.key;
          }
        }
      }
    }
    
    // If no YouTube trailer from TMDb, search directly
    if (!anime.externalIds.youtubeTrailerId) {
      await this.findYoutubeTrailer(anime);
    }
    
    return anime;
  }
  
  /**
   * Find best matching TMDb result
   */
  findBestTmdbMatch(tmdbResults, animeDetails) {
    if (!tmdbResults || tmdbResults.length === 0) return null;
    
    // Prioritize exact title matches
    const titleMatches = tmdbResults.filter(result => {
      const normalizedTitle = result.name.toLowerCase();
      const targetTitle = animeDetails.title.toLowerCase();
      const alternativeTitles = [
        animeDetails.alternative_titles?.en,
        animeDetails.alternative_titles?.ja
      ].filter(Boolean).map(t => t.toLowerCase());
      
      return normalizedTitle === targetTitle || 
             alternativeTitles.includes(normalizedTitle);
    });
    
    if (titleMatches.length > 0) {
      // If multiple title matches, prefer year match
      if (animeDetails.start_season?.year) {
        const yearMatches = titleMatches.filter(result => {
          const firstAirYear = result.first_air_date ? 
                               parseInt(result.first_air_date.split('-')[0]) : 
                               null;
                               
          return firstAirYear === animeDetails.start_season.year;
        });
        
        if (yearMatches.length > 0) {
          return yearMatches[0];
        }
      }
      
      // Otherwise return first title match
      return titleMatches[0];
    }
    
    // If no exact match, try fuzzy matching
    const fuzzyMatches = tmdbResults.filter(result => {
      const normalizedTitle = result.name.toLowerCase();
      const targetTitle = animeDetails.title.toLowerCase();
      
      // Check if one is substring of the other
      return normalizedTitle.includes(targetTitle) || 
             targetTitle.includes(normalizedTitle);
    });
    
    if (fuzzyMatches.length > 0) {
      // If multiple fuzzy matches, prefer year match
      if (animeDetails.start_season?.year) {
        const yearMatches = fuzzyMatches.filter(result => {
          const firstAirYear = result.first_air_date ? 
                               parseInt(result.first_air_date.split('-')[0]) : 
                               null;
                               
          return firstAirYear === animeDetails.start_season.year;
        });
        
        if (yearMatches.length > 0) {
          return yearMatches[0];
        }
      }
      
      // Otherwise return first fuzzy match
      return fuzzyMatches[0];
    }
    
    // If still no match, return null
    return null;
  }
  
  /**
   * Find YouTube trailer for anime
   */
  async findYoutubeTrailer(anime) {
    try {
      const searchResults = await this.youtubeClient.searchAnimeTrailer(anime.title);
      
      if (searchResults && 
          searchResults.items && 
          searchResults.items.length > 0) {
        
        // Find an official trailer if possible
        const officialTrailer = searchResults.items.find(item => {
          const title = item.snippet.title.toLowerCase();
          const channelTitle = item.snippet.channelTitle.toLowerCase();
          
          return (title.includes('official') || 
                 title.includes('trailer') || 
                 channelTitle.includes('official') ||
                 channelTitle.includes('anime')) &&
                 !title.includes('reaction') &&
                 !title.includes('review');
        });
        
        if (officialTrailer) {
          anime.externalIds.youtubeTrailerId = officialTrailer.id.videoId;
        } else {
          // Otherwise use the first result
          anime.externalIds.youtubeTrailerId = searchResults.items[0].id.videoId;
        }
      }
    } catch (error) {
      console.warn(`Could not find YouTube trailer for ${anime.title}:`, error.message);
    }
    
    return anime;
  }
  
  /**
   * Map external anime data to psychological attributes
   */
  mapAnimeToPsychologicalAttributes(animeDetails) {
    // This would be a complex mapping function that analyzes genre, themes,
    // plot elements, etc. to derive psychological dimension values
    
    // For MVP: simplified mapping based on genres, ratings, and popularity
    const attributes = {};
    
    // Visual complexity from genre and format
    if (animeDetails.genres.some(g => ['Avant Garde', 'Dementia', 'Fantasy'].includes(g))) {
      attributes.visualComplexity = 8;
    } else if (animeDetails.genres.some(g => ['Sci-Fi', 'Supernatural'].includes(g))) {
      attributes.visualComplexity = 7;
    } else if (animeDetails.genres.some(g => ['Action', 'Adventure'].includes(g))) {
      attributes.visualComplexity = 6;
    } else if (animeDetails.genres.some(g => ['Slice of Life', 'Sports'].includes(g))) {
      attributes.visualComplexity = 4;
    } else {
      attributes.visualComplexity = 5;
    }
    
    // Narrative complexity from genre
    if (animeDetails.genres.some(g => ['Mystery', 'Psychological', 'Thriller'].includes(g))) {
      attributes.narrativeComplexity = 9;
    } else if (animeDetails.genres.some(g => ['Drama', 'Sci-Fi'].includes(g))) {
      attributes.narrativeComplexity = 7;
    } else if (animeDetails.genres.some(g => ['Comedy', 'Romance'].includes(g))) {
      attributes.narrativeComplexity = 5;
    } else if (animeDetails.genres.some(g => ['Slice of Life', 'Sports', 'Kids'].includes(g))) {
      attributes.narrativeComplexity = 3;
    } else {
      attributes.narrativeComplexity = 5;
    }
    
    // Emotional intensity and valence
    if (animeDetails.genres.some(g => ['Horror', 'Tragedy', 'Psychological'].includes(g))) {
      attributes.emotionalIntensity = 8;
      attributes.emotionalValence = -3;
    } else if (animeDetails.genres.some(g => ['Drama', 'Thriller'].includes(g))) {
      attributes.emotionalIntensity = 7;
      attributes.emotionalValence = -1;
    } else if (animeDetails.genres.some(g => ['Comedy', 'Slice of Life'].includes(g))) {
      attributes.emotionalIntensity = 5;
      attributes.emotionalValence = 3;
    } else if (animeDetails.genres.some(g => ['Romance', 'Music'].includes(g))) {
      attributes.emotionalIntensity = 6;
      attributes.emotionalValence = 2;
    } else {
      attributes.emotionalIntensity = 5;
      attributes.emotionalValence = 0;
    }
    
    // Moral ambiguity
    if (animeDetails.genres.some(g => ['Psychological', 'Thriller', 'Horror'].includes(g))) {
      attributes.moralAmbiguity = 8;
    } else if (animeDetails.genres.some(g => ['Drama', 'Seinen'].includes(g))) {
      attributes.moralAmbiguity = 6;
    } else if (animeDetails.genres.some(g => ['Action', 'Adventure'].includes(g))) {
      attributes.moralAmbiguity = 4;
    } else if (animeDetails.genres.some(g => ['Kids', 'Shounen'].includes(g))) {
      attributes.moralAmbiguity = 2;
    } else {
      attributes.moralAmbiguity = 5;
    }
    
    // Fantasy vs Realism
    if (animeDetails.genres.some(g => ['Fantasy', 'Sci-Fi', 'Supernatural'].includes(g))) {
      attributes.fantasyRealism = 3;
    } else if (animeDetails.genres.some(g => ['Historical', 'Military'].includes(g))) {
      attributes.fantasyRealism = -2;
    } else if (animeDetails.genres.some(g => ['Slice of Life', 'Sports', 'School'].includes(g))) {
      attributes.fantasyRealism = -3;
    } else {
      attributes.fantasyRealism = 0;
    }
    
    // Character complexity
    if (animeDetails.genres.some(g => ['Psychological', 'Drama', 'Seinen'].includes(g))) {
      attributes.characterComplexity = 8;
    } else if (animeDetails.genres.some(g => ['Romance', 'Slice of Life'].includes(g))) {
      attributes.characterComplexity = 6;
    } else if (animeDetails.genres.some(g => ['Action', 'Adventure'].includes(g))) {
      attributes.characterComplexity = 5;
    } else if (animeDetails.genres.some(g => ['Comedy', 'Kids'].includes(g))) {
      attributes.characterComplexity = 3;
    } else {
      attributes.characterComplexity = 5;
    }
    
    // Intellectual vs emotional
    if (animeDetails.genres.some(g => ['Mystery', 'Psychological', 'Sci-Fi'].includes(g))) {
      attributes.intellectualEmotional = 3;
    } else if (animeDetails.genres.some(g => ['Drama', 'Slice of Life'].includes(g))) {
      attributes.intellectualEmotional = -1;
    } else if (animeDetails.genres.some(g => ['Romance', 'Comedy'].includes(g))) {
      attributes.intellectualEmotional = -3;
    } else {
      attributes.intellectualEmotional = 0;
    }
    
    return attributes;
  }
}

module.exports = {
  MyAnimeListClient,
  AniListClient,
  TMDbClient,
  YouTubeClient,
  ApiIntegrationService
};
