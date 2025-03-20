/**
 * Manual mappings for popular anime between platforms
 * 
 * This provides a fallback when the MALSync API fails to return mappings.
 * The keys are AniList IDs, and the values contain the corresponding IDs
 * from other platforms.
 */

export interface ManualMapping {
  anilist: number;
  mal?: number;
  tmdb?: number;
  title: string;
  type: 'TV' | 'Movie';
}

// Map of AniList ID to other platform IDs
export const manualMappings: Record<string, ManualMapping> = {
  // Popular anime movies
  '21519': { anilist: 21519, tmdb: 372058, mal: 32281, title: 'Your Name', type: 'Movie' },
  '20954': { anilist: 20954, tmdb: 378064, mal: 28851, title: 'A Silent Voice', type: 'Movie' },
  '199380': { anilist: 199380, tmdb: 555604, mal: 43249, title: 'Suzume', type: 'Movie' },
  '21820': { anilist: 21820, tmdb: 149870, mal: 32648, title: 'Spirited Away', type: 'Movie' },
  '100665': { anilist: 100665, tmdb: 505262, mal: 35247, title: 'Weathering With You', type: 'Movie' },
  '103883': { anilist: 103883, tmdb: 667520, mal: 37987, title: 'Violet Evergarden: The Movie', type: 'Movie' },
  
  // Popular anime series
  '21856': { anilist: 21856, tmdb: 65930, mal: 31964, title: 'My Hero Academia', type: 'TV' },
  '113415': { anilist: 113415, tmdb: 95479, mal: 40748, title: 'JUJUTSU KAISEN', type: 'TV' },
  '101922': { anilist: 101922, tmdb: 85937, mal: 38000, title: 'Demon Slayer', type: 'TV' },
  '16498': { anilist: 16498, tmdb: 1429, mal: 16498, title: 'Attack on Titan', type: 'TV' },
  '5114': { anilist: 5114, tmdb: 31911, mal: 5114, title: 'Fullmetal Alchemist: Brotherhood', type: 'TV' },
  '1535': { anilist: 1535, tmdb: 13916, mal: 1535, title: 'Death Note', type: 'TV' },
  '20665': { anilist: 20665, tmdb: 61663, mal: 23273, title: 'Your Lie in April', type: 'TV' },
  '11757': { anilist: 11757, tmdb: 45782, mal: 11757, title: 'Sword Art Online', type: 'TV' },
  '21087': { anilist: 21087, tmdb: 63926, mal: 30276, title: 'One Punch Man', type: 'TV' },
  '97940': { anilist: 97940, tmdb: 76669, mal: 34599, title: 'Made in Abyss', type: 'TV' }
};

/**
 * Check if a manual mapping exists for an AniList ID
 * 
 * @param anilistId AniList anime ID
 * @returns true if a manual mapping exists
 */
export function hasManualMapping(anilistId: string | number): boolean {
  return !!manualMappings[anilistId.toString()];
}

/**
 * Get the TMDB ID for an AniList anime from manual mappings
 * 
 * @param anilistId AniList anime ID
 * @returns TMDB ID if available, null otherwise
 */
export function getTmdbIdFromManualMapping(anilistId: string | number): number | null {
  const mapping = manualMappings[anilistId.toString()];
  return mapping?.tmdb || null;
}

/**
 * Get the MAL ID for an AniList anime from manual mappings
 * 
 * @param anilistId AniList anime ID
 * @returns MAL ID if available, null otherwise
 */
export function getMalIdFromManualMapping(anilistId: string | number): number | null {
  const mapping = manualMappings[anilistId.toString()];
  return mapping?.mal || null;
}

/**
 * Get full mapping information for an AniList ID
 * 
 * @param anilistId AniList anime ID
 * @returns Full mapping object if available, null otherwise
 */
export function getFullMapping(anilistId: string | number): ManualMapping | null {
  return manualMappings[anilistId.toString()] || null;
}