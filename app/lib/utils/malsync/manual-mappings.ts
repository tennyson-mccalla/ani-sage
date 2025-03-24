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
  imageUrl?: string; // TMDb image URL for direct access
}

// Map of AniList ID to other platform IDs
export const manualMappings: Record<string, ManualMapping> = {
  // Popular anime movies
  '21519': { anilist: 21519, tmdb: 372058, mal: 32281, title: 'Your Name', type: 'Movie', imageUrl: 'https://image.tmdb.org/t/p/original/q719jXXEzOoYaps6babgKnONONX.jpg' },
  '20954': { anilist: 20954, tmdb: 378064, mal: 28851, title: 'A Silent Voice', type: 'Movie', imageUrl: 'https://image.tmdb.org/t/p/original/drlyoSKDOPnxzJFrRWGqzDsyJvR.jpg' },
  '199380': { anilist: 199380, tmdb: 555604, mal: 43249, title: 'Suzume', type: 'Movie', imageUrl: 'https://image.tmdb.org/t/p/original/vIeu8WysZrTSFb2uhPViKjX9EcC.jpg' },
  '21820': { anilist: 21820, tmdb: 149870, mal: 32648, title: 'Spirited Away', type: 'Movie', imageUrl: 'https://image.tmdb.org/t/p/original/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg' },
  '100665': { anilist: 100665, tmdb: 505262, mal: 35247, title: 'Weathering With You', type: 'Movie', imageUrl: 'https://image.tmdb.org/t/p/original/qgrk7r1fV4IjuoeiGS5HOhXNdLJ.jpg' },
  '103883': { anilist: 103883, tmdb: 533514, mal: 37987, title: 'Violet Evergarden: The Movie', type: 'Movie', imageUrl: 'https://image.tmdb.org/t/p/original/A9R6bukzzRmOzxvDQsXdQpeNm8l.jpg' },
  
  // Popular anime series
  '21856': { anilist: 21856, tmdb: 65930, mal: 31964, title: 'My Hero Academia', type: 'TV', imageUrl: 'https://image.tmdb.org/t/p/original/ivOLM47yJt90P19RH1NvJrAJz9F.jpg' },
  '113415': { anilist: 113415, tmdb: 95479, mal: 40748, title: 'JUJUTSU KAISEN', type: 'TV', imageUrl: 'https://image.tmdb.org/t/p/original/fHpKWq9ayzSk8nSwqRuaAUemRKh.jpg' },
  '101922': { anilist: 101922, tmdb: 85937, mal: 38000, title: 'Demon Slayer', type: 'TV', imageUrl: 'https://image.tmdb.org/t/p/original/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg' },
  '16498': { anilist: 16498, tmdb: 1429, mal: 16498, title: 'Attack on Titan', type: 'TV', imageUrl: 'https://image.tmdb.org/t/p/original/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg' },
  '5114': { anilist: 5114, tmdb: 31911, mal: 5114, title: 'Fullmetal Alchemist: Brotherhood', type: 'TV', imageUrl: 'https://image.tmdb.org/t/p/original/5ZFUEOULaVml7pQuXxhpR2SmVUw.jpg' },
  '1535': { anilist: 1535, tmdb: 13916, mal: 1535, title: 'Death Note', type: 'TV', imageUrl: 'https://image.tmdb.org/t/p/original/tCZFfYTIwrR7n94J6G14Y4hAFU6.jpg' },
  '20665': { anilist: 20665, tmdb: 61663, mal: 23273, title: 'Your Lie in April', type: 'TV', imageUrl: 'https://image.tmdb.org/t/p/original/rRjfH3ckTYz8z8aSkJshFL4VyK9.jpg' },
  '11757': { anilist: 11757, tmdb: 45782, mal: 11757, title: 'Sword Art Online', type: 'TV', imageUrl: 'https://image.tmdb.org/t/p/original/9m8bFIXPg26taNrFSXGwEORVACD.jpg' },
  '21087': { anilist: 21087, tmdb: 63926, mal: 30276, title: 'One Punch Man', type: 'TV', imageUrl: 'https://image.tmdb.org/t/p/original/iE3s0lG5QVdEHOEZnoAxjmMtvne.jpg' },
  '97940': { anilist: 97940, tmdb: 76669, mal: 34599, title: 'Made in Abyss', type: 'TV', imageUrl: 'https://image.tmdb.org/t/p/original/f6U3odfIb3pCXMGKRTQGGF9o1Qg.jpg' }, // Fixed image URL
  
  // Additional classic and popular series
  '1': { anilist: 1, tmdb: 30991, mal: 1, title: 'Cowboy Bebop', type: 'TV', imageUrl: 'https://image.tmdb.org/t/p/original/xDiXDfZwC6XYC6fxHI1jl3A3Ill.jpg' },
  '6547': { anilist: 6547, tmdb: 42942, mal: 6547, title: 'Angel Beats!', type: 'TV', imageUrl: 'https://image.tmdb.org/t/p/original/w6BYSNkbOvJJ2WZJ3cdoS6mgznW.jpg' },
  '9253': { anilist: 9253, tmdb: 42509, mal: 9253, title: 'Steins;Gate', type: 'TV', imageUrl: 'https://image.tmdb.org/t/p/original/5DZix6ggRiFEbsGqUeTAI1z2wtX.jpg' },
  '20': { anilist: 20, tmdb: 46260, mal: 20, title: 'Naruto', type: 'TV', imageUrl: 'https://image.tmdb.org/t/p/original/xppeysfvDKVx775MFuH8Z9BlpMk.jpg' },
  '21': { anilist: 21, tmdb: 37854, mal: 21, title: 'One Piece', type: 'TV', imageUrl: 'https://image.tmdb.org/t/p/original/cMD9Ygz11zjJzAovURpO75Qg7rT.jpg' },
  '269': { anilist: 269, tmdb: 30984, mal: 269, title: 'Bleach', type: 'TV', imageUrl: 'https://image.tmdb.org/t/p/original/2EewmxXe72ogD0EaWM8gqa0ccIw.jpg' },
  '20583': { anilist: 20583, tmdb: 61374, mal: 22319, title: 'Tokyo Ghoul', type: 'TV', imageUrl: 'https://image.tmdb.org/t/p/original/1m4RlC9BTCbyY549TOdVQ5NRPcR.jpg' },
  '99423': { anilist: 99423, tmdb: 82684, mal: 36474, title: 'Kimetsu no Yaiba', type: 'TV', imageUrl: 'https://image.tmdb.org/t/p/original/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg' },
  '20605': { anilist: 20605, tmdb: 61459, mal: 22535, title: 'Kiseijuu: Sei no Kakuritsu', type: 'TV', imageUrl: 'https://image.tmdb.org/t/p/original/cXBfjZSdJelu2r0wKD7qCxS71kb.jpg' },
  '15335': { anilist: 15335, tmdb: 57041, mal: 15335, title: 'Gintama', type: 'TV', imageUrl: 'https://image.tmdb.org/t/p/original/f7vK8pzZIqhyA8sYmBpWmp9Ae7.jpg' }
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

/**
 * Get the TMDb image URL for an AniList anime from manual mappings
 * 
 * @param anilistId AniList anime ID
 * @returns TMDb image URL if available, null otherwise
 */
export function getImageUrlFromManualMapping(anilistId: string | number): string | null {
  const mapping = manualMappings[anilistId.toString()];
  return mapping?.imageUrl || null;
}