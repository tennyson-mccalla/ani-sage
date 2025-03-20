import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { createApiAdapter } from '@/app/lib/anime-api-adapter';
import { corsHeaders } from '@/app/lib/utils';
import { calculateMatchScore, getMatchExplanations } from '@/app/lib/anime-attribute-mapper';
import malSyncClient from '@/app/lib/utils/malsync/client';
import { VideoId } from '@/app/lib/providers/youtube/client';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    console.log("GET /api/v1/recommendations called");
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    const count = request.nextUrl.searchParams.get('count') || '10';
    const useRealApi = request.nextUrl.searchParams.get('useRealApi') !== 'false'; // Default to true
    console.log("Looking up recommendations for sessionId:", sessionId);

    if (!sessionId) {
      console.log("No sessionId provided");
      return NextResponse.json({
        error: 'bad_request',
        message: 'Missing sessionId'
      }, {
        status: 400,
        headers: corsHeaders()
      });
    }

    // Import our debug helper to check localStorage state
    const { dumpStorage } = await import('@/app/lib/db');
    console.log("Recommendations endpoint: Storage state:", dumpStorage());
    
    // Look up session using the database interface
    const session = await db.getSession(sessionId);
    console.log("Session lookup result:", session);
    
    if (!session) {
      console.log("Session not found for ID:", sessionId);
      
      // For debug only: If it's a mock session ID, return mock recommendations
      if (sessionId.startsWith('mock-')) {
        console.log("Creating mock recommendations for session");
        
        // Generate mock recommendations
        const mockRecommendations = [];
        for (let i = 0; i < parseInt(count, 10); i++) {
          mockRecommendations.push({
            id: `mock-anime-${i}`,
            title: `Mock Anime ${i + 1}`,
            image: `https://dummyimage.com/300x450/${['3498db', 'e74c3c', '27ae60', '8e44ad'][i % 4]}/ffffff&text=Anime+${i + 1}`,
            genres: ['Animation', 'Fantasy', 'Adventure'],
            score: 7.0 + (Math.random() * 2.0),
            synopsis: 'A mock anime recommendation based on your profile.',
            match: 85 + Math.floor(Math.random() * 15),
            reasons: [
              'This matches your preferred narrative style',
              'Visual elements align with your preferences',
              'Character depth matches your profile'
            ]
          });
        }
        
        return NextResponse.json({ recommendations: mockRecommendations }, { headers: corsHeaders() });
      }
      
      return NextResponse.json({
        error: 'not_found',
        message: 'Session not found'
      }, {
        status: 404,
        headers: corsHeaders()
      });
    }

    // Look up profile using database interface  
    const profile = await db.getProfile(session.profileId);
    console.log("Profile lookup result:", profile);
    
    if (!profile) {
      console.log("Profile not found for ID:", session.profileId);
      return NextResponse.json({
        error: 'not_found',
        message: 'Profile not found'
      }, {
        status: 404,
        headers: corsHeaders()
      });
    }

    let recommendations = [];

    // Try to get real API recommendations first if useRealApi is true
    if (useRealApi) {
      try {
        console.log("Attempting to fetch real API recommendations");
        
        // Create API adapter and get anime recommendations
        const apiAdapter = createApiAdapter();
        
        // Check if we have sufficient API keys
        let fallbackToMock = false;
        
        try {
          // Attempt to get popular anime from AniList
          console.log("Fetching anime from AniList API");
          const animeList = await apiAdapter.getPopularAnime(parseInt(count, 10) * 3); // Get more than we need to filter by profile
          
          if (animeList && animeList.length > 0) {
            console.log(`Successfully fetched ${animeList.length} anime titles from API`);
            
            // Score the anime based on user profile
            const scoredAnime = animeList.map(anime => {
              // Calculate match score based on profile dimensions
              let matchScore = 70; // Default score
              
              if (profile.dimensions && Object.keys(profile.dimensions).length > 0) {
                matchScore = calculateMatchScore(anime, profile.dimensions);
              }
              
              // Generate match explanations
              const matchExplanations = profile.dimensions ? 
                getMatchExplanations(anime, profile.dimensions).map(match => match.explanation) : 
                [
                  'Matches your preferred style',
                  'Aligns with your content preferences',
                  'Popular among viewers with similar tastes'
                ];
              
              return {
                ...anime,
                matchScore,
                matchExplanations
              };
            });
            
            // Sort by match score
            scoredAnime.sort((a, b) => b.matchScore - a.matchScore);
            
            // Take top N recommendations
            const topRecommendations = scoredAnime.slice(0, parseInt(count, 10));
            
            // Format recommendations for frontend
            recommendations = await Promise.all(topRecommendations.map(async (anime) => {
              // Try to get a trailer if not already present
              let trailerUrl: string | null | undefined = anime.trailer;
              
              if (!trailerUrl && process.env.YOUTUBE_API_KEY) {
                try {
                  console.log(`Searching for trailer for ${anime.title}`);
                  const youtubeClient = await import('@/app/lib/providers/youtube/client').then(module => 
                    new module.YouTubeClient(process.env.YOUTUBE_API_KEY || '')
                  );
                  
                  // Use the improved searchAnimeTrailer method first
                  trailerUrl = await youtubeClient.searchAnimeTrailer(anime.title);
                  
                  if (trailerUrl) {
                    console.log(`Found trailer for ${anime.title}: ${trailerUrl}`);
                  } else {
                    console.log(`No trailer found for ${anime.title} using searchAnimeTrailer, trying fallback methods`);
                  
                    // If searchAnimeTrailer fails, try searchVideos as backup
                    // Create a better search query with format information if available
                    const isMovie = anime.format === 'MOVIE';
                    const searchQuery = `${anime.title} ${isMovie ? 'movie' : ''} anime trailer official`;
                    const searchResults = await youtubeClient.searchVideos(searchQuery, 1);
                    
                    if (searchResults?.data?.length > 0) {
                      const videoItem = searchResults.data[0];
                      // Handle the case where id can be a string or VideoId object
                      const videoId = typeof videoItem.id === 'string' ? 
                                     videoItem.id : 
                                     (videoItem.id as VideoId).videoId;
                      trailerUrl = `https://www.youtube.com/watch?v=${videoId}`;
                      console.log(`Found trailer for ${anime.title} via fallback: ${trailerUrl}`);
                    }
                  }
                } catch (error) {
                  console.error(`Error getting trailer for ${anime.title}:`, error);
                }
              }
              
              // Start with AniList images, but we'll prioritize TMDb images when available
              let anilistImage = anime.image?.extraLarge || anime.image?.large || anime.imageUrl || anime.image?.medium;
              let bestImage = null; // We'll set this after checking TMDb
              let tmdbScore = null;
              let tmdbId = null;
              
              if (anime.id && process.env.TMDB_API_KEY) {
                try {
                  // First try to get accurate TMDB ID using MALSync client
                  tmdbId = await malSyncClient.getTmdbIdFromAnilist(anime.id);
                  
                  if (tmdbId) {
                    console.log(`Found TMDB ID ${tmdbId} for anime ${anime.title} (ID: ${anime.id}) using MALSync`);
                    
                    // Store the mapping in the anime object for future use
                    if (!anime.externalIds) {
                      anime.externalIds = {};
                    }
                    anime.externalIds.tmdb = tmdbId;
                    
                    // Import TMDb client
                    const TMDbClient = await import('@/app/lib/providers/tmdb/client').then(module => 
                      new module.TMDbClient(process.env.TMDB_API_KEY || '')
                    );
                    
                    // Get details directly using the TMDB ID (more accurate than search)
                    const detailsResponse = await TMDbClient.getTVDetails(tmdbId);
                    
                    if (detailsResponse?.data) {
                      // Get TMDb score
                      if (detailsResponse.data.vote_average) {
                        tmdbScore = detailsResponse.data.vote_average;
                      }
                      
                      // Use TMDb original size image if available
                      if (detailsResponse.data.poster_path) {
                        const tmdbImage = `https://image.tmdb.org/t/p/original${detailsResponse.data.poster_path}`;
                        console.log(`Found higher quality TMDb image for ${anime.title} using direct ID`);
                        bestImage = tmdbImage; // Always prefer TMDb images when available
                      }
                    }
                  } else {
                    console.log(`No TMDB ID found for ${anime.title} (ID: ${anime.id}) in MALSync, falling back to search`);
                    
                    // Fallback to search by title if no ID mapping found
                    // Import TMDb client
                    const TMDbClient = await import('@/app/lib/providers/tmdb/client').then(module => 
                      new module.TMDbClient(process.env.TMDB_API_KEY || '')
                    );
                    
                    // Determine if this is a movie or TV show (if possible)
                    // AniList format can tell us this
                    const isMovie = anime.format === 'MOVIE';
                    
                    // Search for anime on TMDb with improved anime search
                    const searchResponse = await TMDbClient.searchAnime(anime.title, 1, isMovie);
                    
                    if (searchResponse?.data?.results && searchResponse.data.results.length > 0) {
                      const firstResult = searchResponse.data.results[0];
                      
                      // Get TMDb score
                      if (firstResult.vote_average) {
                        tmdbScore = firstResult.vote_average;
                      }
                      
                      // Use TMDb original size image if available
                      if (firstResult.poster_path) {
                        const tmdbImage = `https://image.tmdb.org/t/p/original${firstResult.poster_path}`;
                        console.log(`Found higher quality TMDb image for ${anime.title} through search`);
                        bestImage = tmdbImage; // Prefer TMDb images even when found through search
                      }
                    }
                  }
                } catch (tmdbError) {
                  console.error(`Error getting TMDb data for ${anime.title}:`, tmdbError);
                  // Continue with AniList image as fallback
                  bestImage = anilistImage;
                }
              } else if (anime.title && process.env.TMDB_API_KEY) {
                // Fallback to title search if no AniList ID available
                try {
                  // Import TMDb client
                  const TMDbClient = await import('@/app/lib/providers/tmdb/client').then(module => 
                    new module.TMDbClient(process.env.TMDB_API_KEY || '')
                  );
                  
                  // Determine if this is a movie or TV show (based on duration or other hints)
                  const isMovie = false; // Default to TV series if unknown
                  
                  // Use our improved anime search that handles movies properly
                  const searchResponse = await TMDbClient.searchAnime(anime.title, 1, isMovie);
                  
                  if (searchResponse?.data?.results && searchResponse.data.results.length > 0) {
                    const firstResult = searchResponse.data.results[0];
                    
                    // Get TMDb score
                    if (firstResult.vote_average) {
                      tmdbScore = firstResult.vote_average;
                    }
                    
                    // Use TMDb original size image if available
                    if (firstResult.poster_path) {
                      const tmdbImage = `https://image.tmdb.org/t/p/original${firstResult.poster_path}`;
                      console.log(`Found higher quality TMDb image for ${anime.title}`);
                      bestImage = tmdbImage; // Always prefer TMDb images when available
                    }
                  }
                } catch (tmdbError) {
                  console.error(`Error getting TMDb data for ${anime.title}:`, tmdbError);
                  // Continue with AniList image as fallback
                  bestImage = anilistImage;
                }
              }
              
              // Try to find MAL score and ID
              let malScore = null;
              let malId = null;
              
              // Get MAL ID from AniList ID using MALSync
              if (anime.id) {
                try {
                  malId = await malSyncClient.getMalIdFromAnilist(anime.id);
                  
                  if (malId) {
                    console.log(`Found MAL ID ${malId} for anime ${anime.title} (ID: ${anime.id}) using MALSync`);
                    
                    // Store the MAL ID for future use
                    if (!anime.externalIds) {
                      anime.externalIds = {};
                    }
                    anime.externalIds.mal = malId;
                    
                    // We could fetch the MAL score here if we implement MAL API integration
                    // For now, we'll just store the ID for future use
                    
                    // Example of how MAL API integration would work:
                    // const MALClient = await import('@/app/lib/providers/mal/client').then(module => 
                    //   new module.MALClient(process.env.MAL_CLIENT_ID || '')
                    // );
                    // const malAnime = await MALClient.getAnime(malId);
                    // if (malAnime?.data?.mean) {
                    //   malScore = malAnime.data.mean;
                    // }
                  }
                } catch (malError) {
                  console.error(`Error getting MAL ID for ${anime.title}:`, malError);
                }
              }
              
              // Create scores object with available scores
              const scores = {} as Record<string, number>;
              if (anime.score) {
                scores.anilist = anime.score;
              } else if (anime.averageScore) {
                scores.anilist = anime.averageScore / 10; // Convert to 10-point scale if needed
              }
              
              // Add additional scores if available
              if (tmdbScore) scores.tmdb = tmdbScore;
              if (malScore) scores.mal = malScore;
              
              return {
                id: anime.id || `api-${Math.random().toString(36).substr(2, 9)}`,
                title: anime.title,
                image: bestImage || anilistImage || `https://dummyimage.com/600x900/${['3498db', 'e74c3c', '27ae60', '8e44ad'][Math.floor(Math.random() * 4)]}/ffffff&text=${encodeURIComponent(anime.title || 'Anime')}`,
                genres: anime.genres || [],
                score: anime.score, // Keep for backwards compatibility
                scores: Object.keys(scores).length > 0 ? scores : undefined,
                externalIds: anime.externalIds || undefined, // Include any external IDs we found
                synopsis: (anime.synopsis || anime.description || 'No description available.').replace(/<[^>]*>/g, ''),
                match: anime.matchScore,
                reasons: anime.matchExplanations || [
                  'This matches your preferred style',
                  'Based on your profile dimensions',
                  'Recommended based on your preferences'
                ],
                trailer: trailerUrl
              };
            }));
            
            console.log(`Successfully generated ${recommendations.length} API-based recommendations`);
          } else {
            console.log("No anime titles returned from API, falling back to mock data");
            fallbackToMock = true;
          }
        } catch (apiError) {
          console.error("API error occurred:", apiError);
          console.log("Falling back to mock data due to API error");
          fallbackToMock = true;
        }
        
        // If we couldn't get real API data, fall back to mock data
        if (fallbackToMock || recommendations.length === 0) {
          console.log("Using mock anime database as fallback");
          return useMockRecommendations(profile, parseInt(count, 10));
        }
      } catch (error) {
        console.error("Error in API recommendation flow:", error);
        console.log("Falling back to mock recommendations due to error");
        const mockResponse = useMockRecommendations(profile, parseInt(count, 10));
        return NextResponse.json(mockResponse, { headers: corsHeaders() });
      }
    } else {
      console.log("Using mock anime database as requested");
      const mockRecommendations = useMockRecommendations(profile, parseInt(count, 10));
      recommendations = mockRecommendations.recommendations;
    }
    
    return NextResponse.json({ recommendations }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return NextResponse.json({
      error: 'server_error',
      message: 'Error retrieving recommendations',
      details: String(error)
    }, {
      status: 500,
      headers: corsHeaders()
    });
  }
}

// Helper function to generate mock recommendations
function useMockRecommendations(profile, count): { recommendations: any[] } {
  // Create a selection of high-quality anime recommendations
  const animeDatabase = [
    {
      id: "1",
      title: "Fullmetal Alchemist: Brotherhood",
      genres: ["Action", "Adventure", "Drama", "Fantasy"],
      score: 9.1,
      description: "After a terrible alchemical ritual goes wrong in the Elric household, brothers Edward and Alphonse are left in a catastrophic situation. Ignoring the alchemical principle of Equivalent Exchange, the boys attempt human transmutation to bring their mother back to life. Instead, they suffer brutal personal loss: Alphonse's body disintegrates while Edward loses a leg and then sacrifices an arm to salvage Alphonse's soul by binding it to a large suit of armor. The brothers now seek the Philosopher's Stone to restore what they've lost.",
      image: {
        medium: "https://dummyimage.com/300x450/3498db/ffffff&text=Fullmetal+Alchemist",
        large: "https://dummyimage.com/600x900/3498db/ffffff&text=Fullmetal+Alchemist",
        extraLarge: "https://dummyimage.com/900x1350/3498db/ffffff&text=Fullmetal+Alchemist"
      },
      trailer: "https://www.youtube.com/watch?v=--IcmZkvL0Q",
      traits: {
        visualComplexity: 8.2,
        narrativeComplexity: 8.7,
        emotionalIntensity: 7.9,
        characterComplexity: 9.0,
        moralAmbiguity: 7.8
      }
    },
    {
      id: "2",
      title: "Attack on Titan",
      genres: ["Action", "Drama", "Fantasy", "Mystery"],
      score: 9.0,
      description: "Centuries ago, mankind was slaughtered to near extinction by monstrous humanoid creatures called Titans, forcing humans to hide in fear behind enormous concentric walls. What makes these giants truly terrifying is that their taste for human flesh is not born out of hunger but what appears to be out of pleasure. To ensure their survival, the remnants of humanity began living within defensive barriers, resulting in one hundred years without a single titan encounter. However, that fragile calm is soon shattered when a colossal Titan manages to breach the supposedly impregnable outer wall, reigniting the fight for survival against the man-eating abominations.",
      image: {
        medium: "https://dummyimage.com/300x450/e74c3c/ffffff&text=Attack+on+Titan",
        large: "https://dummyimage.com/600x900/e74c3c/ffffff&text=Attack+on+Titan",
        extraLarge: "https://dummyimage.com/900x1350/e74c3c/ffffff&text=Attack+on+Titan"
      },
      trailer: "https://www.youtube.com/watch?v=MGRm4IzK1SQ",
      traits: {
        visualComplexity: 9.3,
        narrativeComplexity: 9.0,
        emotionalIntensity: 9.5,
        characterComplexity: 8.7,
        moralAmbiguity: 9.2
      }
    },
    {
      id: "3",
      title: "Steins;Gate",
      genres: ["Sci-Fi", "Thriller", "Drama"],
      score: 9.1,
      description: "Self-proclaimed mad scientist Rintarou Okabe rents out a room in a decrepit building in Akihabara, where he indulges in his hobby of inventing prospective 'future gadgets' with fellow lab members: Mayuri Shiina, his air-headed childhood friend, and Hashida Itaru, a perverted hacker nicknamed 'Daru.' The three pass the time by tinkering with their most promising contraption yet, a machine dubbed the 'Phone Microwave,' which performs the strange function of morphing bananas into piles of green gel. Though miraculous in itself, the phenomenon doesn't provide anything concrete in Okabe's search for a scientific breakthrough; that is, until the lab members are spurred into action by a string of mysterious happenings before stumbling upon an unexpected success—the Phone Microwave can send emails to the past, altering the flow of history.",
      image: {
        medium: "https://dummyimage.com/300x450/27ae60/ffffff&text=Steins;Gate",
        large: "https://dummyimage.com/600x900/27ae60/ffffff&text=Steins;Gate",
        extraLarge: "https://dummyimage.com/900x1350/27ae60/ffffff&text=Steins;Gate"
      },
      traits: {
        visualComplexity: 7.5,
        narrativeComplexity: 9.4,
        emotionalIntensity: 8.3,
        characterComplexity: 8.9,
        moralAmbiguity: 8.0
      }
    },
    {
      id: "4",
      title: "Violet Evergarden",
      genres: ["Drama", "Fantasy", "Slice of Life"],
      score: 8.9,
      description: "The Great War finally came to an end after four long years of conflict; fractured in two, the continent of Telesis slowly began to flourish once again. Caught up in the bloodshed was Violet Evergarden, a young girl raised for the sole purpose of decimating enemy lines. While the war may be over, Violet's life as a soldier has hardly ended. Severely wounded during the war's final battle, she was left with only words from the person she held dearest, but with no understanding of their meaning. Recovering from her wounds, Violet starts a new life working at CH Postal Services. There, she witnesses by pure chance the work of an 'Auto Memory Doll,' amanuenses that transcribe people's thoughts and feelings into words on paper. Moved by the notion, Violet begins work as an Auto Memory Doll, a trade that will take her on an adventure, one that will reshape the lives of her clients and perhaps even her own.",
      image: {
        medium: "https://dummyimage.com/300x450/8e44ad/ffffff&text=Violet+Evergarden",
        large: "https://dummyimage.com/600x900/8e44ad/ffffff&text=Violet+Evergarden",
        extraLarge: "https://dummyimage.com/900x1350/8e44ad/ffffff&text=Violet+Evergarden"
      },
      traits: {
        visualComplexity: 9.7,
        narrativeComplexity: 7.4,
        emotionalIntensity: 9.0,
        characterComplexity: 8.5,
        moralAmbiguity: 6.0
      }
    },
    {
      id: "5",
      title: "My Neighbor Totoro",
      genres: ["Adventure", "Fantasy", "Slice of Life"],
      score: 8.4,
      description: "In 1950s Japan, university professor Tatsuo Kusakabe and his two daughters, Satsuki and Mei, move into an old house to be closer to the hospital where the girls' mother, Yasuko, is recovering from a long-term illness. The house is inhabited by small, dark creatures called susuwatari—house dust spirits that can only be seen when moving from light to dark places. When the girls become comfortable in their new house, the susuwatari leave to find another empty house. One day, Mei discovers two small spirits who lead her into the hollow of a large camphor tree. There she meets and befriends a larger spirit, which identifies itself by a series of roars that she interprets as 'Totoro'.",
      image: {
        medium: "https://dummyimage.com/300x450/f39c12/ffffff&text=My+Neighbor+Totoro",
        large: "https://dummyimage.com/600x900/f39c12/ffffff&text=My+Neighbor+Totoro",
        extraLarge: "https://dummyimage.com/900x1350/f39c12/ffffff&text=My+Neighbor+Totoro"
      },
      traits: {
        visualComplexity: 8.5,
        narrativeComplexity: 3.5,
        emotionalIntensity: 4.0,
        characterComplexity: 4.5,
        moralAmbiguity: 2.0
      }
    },
    {
      id: "6",
      title: "Death Note",
      genres: ["Mystery", "Psychological", "Supernatural", "Thriller"],
      score: 8.6,
      description: "A shinigami, as a god of death, can kill any person—provided they see their victim's face and write their victim's name in a notebook called a Death Note. One day, Ryuk, bored with the shinigami lifestyle and interested in seeing how a human would use a Death Note, drops one into the human realm. High school student and prodigy Light Yagami stumbles upon the Death Note and—after recognizing its power—decides to use it to rid the world of criminals. Later, his actions of wiping out countless criminals give him the moniker 'Kira,' a Japanese transliteration of the English word 'killer.'",
      image: {
        medium: "https://dummyimage.com/300x450/7f8c8d/ffffff&text=Death+Note",
        large: "https://dummyimage.com/600x900/7f8c8d/ffffff&text=Death+Note",
        extraLarge: "https://dummyimage.com/900x1350/7f8c8d/ffffff&text=Death+Note"
      },
      traits: {
        visualComplexity: 7.0,
        narrativeComplexity: 9.0,
        emotionalIntensity: 8.0,
        characterComplexity: 9.0,
        moralAmbiguity: 9.5
      }
    },
    {
      id: "7",
      title: "Your Lie in April",
      genres: ["Drama", "Music", "Romance", "Slice of Life"],
      score: 8.7,
      description: "Music accompanies the path of the human metronome, the prodigious pianist Kousei Arima. But after the passing of his mother, Saki Arima, Kousei falls into a downward spiral, rendering him unable to hear the sound of his own piano. Two years later, Kousei still avoids the piano, leaving behind his admirers and rivals, and lives a colorless life alongside his friends Tsubaki Sawabe and Ryouta Watari. However, everything changes when he meets a beautiful violinist, Kaori Miyazono, who stirs up his world and sets him on a journey to face music again.",
      image: {
        medium: "https://dummyimage.com/300x450/f1c40f/ffffff&text=Your+Lie+in+April",
        large: "https://dummyimage.com/600x900/f1c40f/ffffff&text=Your+Lie+in+April",
        extraLarge: "https://dummyimage.com/900x1350/f1c40f/ffffff&text=Your+Lie+in+April"
      },
      traits: {
        visualComplexity: 8.0,
        narrativeComplexity: 7.0,
        emotionalIntensity: 9.0,
        characterComplexity: 7.5,
        moralAmbiguity: 4.5
      }
    },
    {
      id: "8",
      title: "A Silent Voice",
      genres: ["Drama", "Romance", "Slice of Life"],
      score: 8.9,
      description: "As a wild youth, elementary school student Shouya Ishida sought to beat boredom in the cruelest ways. When the deaf Shouko Nishimiya transfers into his class, Shouya and the rest of his class thoughtlessly bully her for fun. However, when her mother notifies the school, he is singled out and blamed for everything. With Shouko transferring out of the school, Shouya is left at the mercy of his classmates. He is heartlessly ostracized all throughout elementary and middle school, while teachers turn a blind eye. Now in his third year of high school, Shouya is still plagued by his wrongdoings as a young boy. Sincerely regretting his past actions, he sets out on a journey of redemption: to meet Shouko once more and make amends.",
      image: {
        medium: "https://dummyimage.com/300x450/9b59b6/ffffff&text=A+Silent+Voice",
        large: "https://dummyimage.com/600x900/9b59b6/ffffff&text=A+Silent+Voice",
        extraLarge: "https://dummyimage.com/900x1350/9b59b6/ffffff&text=A+Silent+Voice"
      },
      traits: {
        visualComplexity: 8.0,
        narrativeComplexity: 7.0,
        emotionalIntensity: 9.0,
        characterComplexity: 8.5,
        moralAmbiguity: 6.5
      }
    },
    {
      id: "9",
      title: "Spirited Away",
      genres: ["Adventure", "Fantasy", "Supernatural"],
      score: 8.8,
      description: "Stubborn, spoiled, and naïve, 10-year-old Chihiro Ogino is less than pleased when she and her parents discover an abandoned amusement park on the way to their new house. Cautiously venturing inside, she realizes that there is more to this place than meets the eye, as strange things begin to happen once dusk falls. Ghostly apparitions and food that turns her parents into pigs are just the start—Chihiro has unwittingly crossed over into the spirit world. Now trapped, she must summon the courage to live and work amongst spirits, with the help of the enigmatic Haku and the cast of unique characters she meets along the way.",
      image: {
        medium: "https://dummyimage.com/300x450/1abc9c/ffffff&text=Spirited+Away",
        large: "https://dummyimage.com/600x900/1abc9c/ffffff&text=Spirited+Away",
        extraLarge: "https://dummyimage.com/900x1350/1abc9c/ffffff&text=Spirited+Away"
      },
      traits: {
        visualComplexity: 9.5,
        narrativeComplexity: 7.0,
        emotionalIntensity: 7.5,
        characterComplexity: 8.0,
        moralAmbiguity: 6.0
      }
    },
    {
      id: "10",
      title: "Made in Abyss",
      genres: ["Adventure", "Drama", "Fantasy", "Mystery", "Sci-Fi"],
      score: 8.7,
      description: "The Abyss—a gaping chasm stretching down into the depths of the earth, filled with mysterious creatures and relics from a time long past. How did it come to be? What lies at the bottom? Countless brave individuals, known as Divers, have sought to solve these mysteries of the Abyss, fearlessly descending into its darkest realms. The best and bravest of the Divers, the White Whistles, are hailed as legends by those who remain on the surface. Riko, daughter of the missing White Whistle Lyza the Annihilator, aspires to become like her mother and explore the furthest reaches of the Abyss. However, just a novice Red Whistle herself, she is only permitted to roam its most upper layer. Even so, Riko has a chance encounter with a mysterious robot with the appearance of an ordinary young boy. She comes to name him Reg, and he has no recollection of the events preceding his discovery. Certain that the technology to create Reg must come from deep within the Abyss, the two decide to venture forth into the chasm to recover his memories and see the bottom of the great pit with their own eyes. However, they know not of the harsh reality that is the true existence of the Abyss.",
      image: {
        medium: "https://dummyimage.com/300x450/d35400/ffffff&text=Made+in+Abyss",
        large: "https://dummyimage.com/600x900/d35400/ffffff&text=Made+in+Abyss",
        extraLarge: "https://dummyimage.com/900x1350/d35400/ffffff&text=Made+in+Abyss"
      },
      traits: {
        visualComplexity: 9.0,
        narrativeComplexity: 8.0,
        emotionalIntensity: 9.0,
        characterComplexity: 7.5,
        moralAmbiguity: 8.5
      }
    },
    {
      id: "11",
      title: "K-On!",
      genres: ["Comedy", "Music", "Slice of Life"],
      score: 8.2,
      description: "Hirasawa Yui, a young, carefree girl entering high school, has her imagination instantly captured when she sees a poster advertising the 'Light Music Club.' Being the carefree girl that she is, she quickly signs up. However, Yui has a problem, she is unable to play an instrument. When Yui goes to the clubroom to explain, she's greeted by the other members: Ritsu, Mio, and Tsumugi. Although disheartened at Yui's lack of musical know-how, they still try to convince her to stay to prevent the club's disbandment. After playing Yui a short piece which re-ignites her imagination, they succeed in keeping their new member and assign her to the guitar.",
      image: {
        medium: "https://dummyimage.com/300x450/16a085/ffffff&text=K-On!",
        large: "https://dummyimage.com/600x900/16a085/ffffff&text=K-On!",
        extraLarge: "https://dummyimage.com/900x1350/16a085/ffffff&text=K-On!"
      },
      traits: {
        visualComplexity: 6.5,
        narrativeComplexity: 2.5,
        emotionalIntensity: 4.0,
        characterComplexity: 5.0,
        moralAmbiguity: 1.5
      }
    },
    {
      id: "12",
      title: "Cowboy Bebop",
      genres: ["Action", "Adventure", "Drama", "Sci-Fi"],
      score: 8.8,
      description: "Crime is timeless. By the year 2071, humanity has expanded across the galaxy, filling the surface of other planets with settlements like those on Earth. These new societies are plagued by murder, drug use, and theft, and intergalactic outlaws are hunted by a growing number of tough bounty hunters. Spike Spiegel and Jet Black pursue criminals throughout space to make a humble living. Beneath his goofy and aloof demeanor, Spike is haunted by the weight of his violent past. Meanwhile, Jet manages his own troubled memories while taking care of Spike and the Bebop, their ship. The duo is joined by the beautiful con artist Faye Valentine, odd child genius Edward Wong Hau Pepelu Tivrusky IV, and Ein, a bioengineered Welsh Corgi with heightened intelligence. While developing bonds and working to catch a colorful cast of criminals, the crew's lives are disrupted by a menace from Spike's past.",
      image: {
        medium: "https://dummyimage.com/300x450/2980b9/ffffff&text=Cowboy+Bebop",
        large: "https://dummyimage.com/600x900/2980b9/ffffff&text=Cowboy+Bebop",
        extraLarge: "https://dummyimage.com/900x1350/2980b9/ffffff&text=Cowboy+Bebop"
      },
      traits: {
        visualComplexity: 8.0,
        narrativeComplexity: 7.5,
        emotionalIntensity: 8.0,
        characterComplexity: 9.0,
        moralAmbiguity: 7.5
      }
    }
  ];
  
  let animeList = [];
  
  try {
    // Calculate match scores based on profile dimensions
    const scoredAnime = animeDatabase.map(anime => {
      // If profile has no dimensions, use a random score
      if (!profile.dimensions || Object.keys(profile.dimensions).length === 0) {
        return {
          ...anime,
          matchScore: Math.floor(70 + Math.random() * 30)
        };
      }
      
      // Calculate distance between profile and anime traits
      const dimensions = [
        'visualComplexity',
        'narrativeComplexity',
        'emotionalIntensity',
        'characterComplexity',
        'moralAmbiguity'
      ];
      
      let totalDistance = 0;
      let dimensionCount = 0;
      
      dimensions.forEach(dim => {
        if (profile.dimensions[dim] !== undefined && anime.traits[dim] !== undefined) {
          const distance = Math.abs(profile.dimensions[dim] - anime.traits[dim]);
          totalDistance += distance;
          dimensionCount++;
        }
      });
      
      // Convert distance to match score (closer = better match)
      const avgDistance = dimensionCount > 0 ? totalDistance / dimensionCount : 5;
      const matchScore = Math.max(0, Math.min(100, 100 - (avgDistance * 10)));
      
      return {
        ...anime,
        matchScore: Math.round(matchScore)
      };
    });
    
    // Sort by match score (descending)
    scoredAnime.sort((a, b) => b.matchScore - a.matchScore);
    
    // Take the top N recommendations
    animeList = scoredAnime.slice(0, count);
    
  } catch (error) {
    console.error('Error generating recommendations:', error);
    animeList = [];
  }

  // Convert the anime list to the format expected by the frontend
  const recommendations = animeList.map((anime, index) => {
    // Generate custom reasons based on profile and anime traits
    const reasons = [];
    
    if (profile.dimensions) {
      // Visual complexity
      if (profile.dimensions.visualComplexity !== undefined && 
          Math.abs(profile.dimensions.visualComplexity - anime.traits.visualComplexity) < 2) {
        if (anime.traits.visualComplexity > 7) {
          reasons.push('Features rich visuals that match your preference for detailed animation');
        } else if (anime.traits.visualComplexity < 5) {
          reasons.push('Has a clean, minimalist art style that aligns with your preferences');
        } else {
          reasons.push('The visual style aligns with your preferences');
        }
      }
      
      // Narrative complexity
      if (profile.dimensions.narrativeComplexity !== undefined && 
          Math.abs(profile.dimensions.narrativeComplexity - anime.traits.narrativeComplexity) < 2) {
        if (anime.traits.narrativeComplexity > 7) {
          reasons.push('Contains an intricate storyline that matches your taste for complex narratives');
        } else if (anime.traits.narrativeComplexity < 5) {
          reasons.push('Features a straightforward story that matches your narrative preferences');
        } else {
          reasons.push('The storytelling style matches your preferences');
        }
      }
      
      // Emotional intensity
      if (profile.dimensions.emotionalIntensity !== undefined && 
          Math.abs(profile.dimensions.emotionalIntensity - anime.traits.emotionalIntensity) < 2) {
        if (anime.traits.emotionalIntensity > 7) {
          reasons.push('Delivers powerful emotional moments that resonate with your preferences');
        } else if (anime.traits.emotionalIntensity < 5) {
          reasons.push('Has a measured emotional tone that aligns with your preferences');
        } else {
          reasons.push('The emotional depth matches your profile');
        }
      }
      
      // Character complexity
      if (profile.dimensions.characterComplexity !== undefined && 
          Math.abs(profile.dimensions.characterComplexity - anime.traits.characterComplexity) < 2) {
        if (anime.traits.characterComplexity > 7) {
          reasons.push('Features nuanced characters with depth that matches your preferences');
        } else if (anime.traits.characterComplexity < 5) {
          reasons.push('Contains relatable, straightforward characters that suit your taste');
        } else {
          reasons.push('The character development aligns with your preferences');
        }
      }
      
      // Moral ambiguity
      if (profile.dimensions.moralAmbiguity !== undefined && 
          Math.abs(profile.dimensions.moralAmbiguity - anime.traits.moralAmbiguity) < 2) {
        if (anime.traits.moralAmbiguity > 7) {
          reasons.push('Explores complex moral questions that match your interest in ambiguous themes');
        } else if (anime.traits.moralAmbiguity < 5) {
          reasons.push('Features clear moral themes that align with your preferences');
        } else {
          reasons.push('The thematic elements complement your psychological profile');
        }
      }
    }
    
    // Add generic reasons if we don't have enough specific ones
    while (reasons.length < 3) {
      const genericReasons = [
        'Matches your content preferences based on your profile',
        'Aligns with your viewing preferences',
        'Selected based on your psychological profile',
        'Contains elements that match your taste in anime',
        `The ${anime.genres?.[0] || 'content'} elements align with your interests`
      ];
      
      const randomReason = genericReasons[Math.floor(Math.random() * genericReasons.length)];
      if (!reasons.includes(randomReason)) {
        reasons.push(randomReason);
      }
    }

    return {
      id: anime.id || `rec-${index}`,
      title: anime.title || 'Unknown Anime',
      image: anime.image?.extraLarge || anime.image?.large || anime.imageUrl || anime.image?.medium || 
             `https://dummyimage.com/600x900/${['3498db', 'e74c3c', '27ae60', '8e44ad'][index % 4]}/ffffff&text=${encodeURIComponent(anime.title || 'Anime')}`,
      genres: anime.genres || ['Animation'],
      score: anime.score || 7.5,
      scores: {
        anilist: anime.score || 7.5,
        tmdb: anime.score ? (anime.score + (Math.random() * 0.6 - 0.3)) : 7.2 + (Math.random() * 1.5)
      },
      externalIds: {
        tmdb: Math.floor(100000 + Math.random() * 900000), // Mock TMDB ID
        mal: Math.floor(10000 + Math.random() * 90000)     // Mock MAL ID
      },
      synopsis: (anime.synopsis || anime.description || 'No description available.').replace(/<[^>]*>/g, ''),
      match: anime.matchScore || Math.round(70 + (Math.random() * 25)),
      reasons: reasons.slice(0, 3),
      trailer: anime.trailer || undefined
    };
  });

  // Add mock recommendations if we don't have enough
  while (recommendations.length < count) {
    const index = recommendations.length;
    recommendations.push({
      id: `mock-${index}`,
      title: `Generated Recommendation ${index + 1}`,
      image: `https://dummyimage.com/300x450/${['3498db', 'e74c3c', '27ae60', '8e44ad'][index % 4]}/ffffff&text=Anime+${index + 1}`,
      genres: ['Animation', 'Fantasy'],
      score: 7.0 + (Math.random() * 2.0),
      scores: {
        anilist: 7.0 + (Math.random() * 2.0),
        tmdb: 7.0 + (Math.random() * 2.0)
      },
      externalIds: {
        tmdb: Math.floor(100000 + Math.random() * 900000), // Mock TMDB ID
        mal: Math.floor(10000 + Math.random() * 90000)     // Mock MAL ID
      },
      synopsis: 'A generated recommendation based on your profile.',
      match: Math.round(70 + (Math.random() * 25)),
      reasons: [
        'Generated based on your psychological profile',
        'Matches your content preferences',
        'Aligns with your viewing history'
      ]
    });
  }

  return { recommendations };
}
