import { NextRequest, NextResponse } from 'next/server';
import { db, Profile } from '@/app/lib/db';
import { corsHeaders } from '@/app/lib/utils';
import { manualMappings } from '@/app/lib/utils/malsync/manual-mappings';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    console.log("Debug recommendations API called");
    
    // Get parameters
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    const animeId = request.nextUrl.searchParams.get('animeId');
    
    // Get environment variables (safe ones for debugging)
    const envData = {
      NEXT_PUBLIC_USE_REAL_API: process.env.NEXT_PUBLIC_USE_REAL_API,
      DEBUG_RECOMMENDATIONS: process.env.DEBUG_RECOMMENDATIONS,
      FORCE_REAL_API: process.env.FORCE_REAL_API,
    };
    
    let profile: Profile | null = null;
    
    // If session ID provided, get the profile
    if (sessionId) {
      const session = await db.getSession(sessionId);
      if (session) {
        profile = await db.getProfile(session.profileId);
      }
    }
    
    // Get anime traits from mock database for debugging purposes
    const animeTraits: any[] = [];
    
    // Only import the mock database if we're checking specific anime
    if (animeId) {
      try {
        // This is our mock anime database with traits for debugging
        const animeDatabase = [
          {
            id: "5114",
            title: "Fullmetal Alchemist: Brotherhood",
            traits: {
              visualComplexity: 8.2,
              narrativeComplexity: 8.7,
              emotionalIntensity: 7.9,
              characterComplexity: 9.0,
              moralAmbiguity: 7.8
            }
          },
          {
            id: "16498",
            title: "Attack on Titan",
            traits: {
              visualComplexity: 9.3,
              narrativeComplexity: 9.0,
              emotionalIntensity: 9.5,
              characterComplexity: 8.7,
              moralAmbiguity: 9.2
            }
          },
          {
            id: "1535",
            title: "Death Note",
            traits: {
              visualComplexity: 7.0,
              narrativeComplexity: 9.0,
              emotionalIntensity: 8.0,
              characterComplexity: 9.0,
              moralAmbiguity: 9.5
            }
          },
          {
            id: "11",
            title: "K-On!",
            traits: {
              visualComplexity: 6.5,
              narrativeComplexity: 2.5,
              emotionalIntensity: 4.0,
              characterComplexity: 5.0,
              moralAmbiguity: 1.5
            }
          },
          {
            id: "5",
            title: "My Neighbor Totoro",
            traits: {
              visualComplexity: 8.5,
              narrativeComplexity: 3.5,
              emotionalIntensity: 4.0,
              characterComplexity: 4.5,
              moralAmbiguity: 2.0
            }
          }
        ];
        
        // If specific anime ID requested, return just that one
        if (animeId) {
          const anime = animeDatabase.find(a => a.id === animeId);
          if (anime) {
            animeTraits.push(anime);
          }
        } else {
          // Otherwise return all anime
          animeTraits.push(...animeDatabase);
        }
        
        // Calculate match scores if we have a profile
        if (profile && profile.dimensions) {
          animeTraits.forEach(anime => {
            if (!anime.traits) return;
            
            // Dimension importance weights
            const dimensionWeights: Record<string, number> = {
              'visualComplexity': 0.8,
              'narrativeComplexity': 1.0,
              'emotionalIntensity': 0.9,
              'characterComplexity': 1.0,
              'moralAmbiguity': 0.7
            };
            
            // Calculate match score with detailed breakdown
            const dimensions = [
              'visualComplexity',
              'narrativeComplexity',
              'emotionalIntensity',
              'characterComplexity',
              'moralAmbiguity'
            ];
            
            let weightedDistanceSum = 0;
            let totalWeight = 0;
            const dimensionScores: Record<string, {
              profileValue: number,
              animeValue: number,
              distance: number,
              weight: number,
              score: number
            }> = {};
            
            dimensions.forEach(dim => {
              if (profile!.dimensions[dim] !== undefined && anime.traits[dim] !== undefined) {
                // Get values
                const profileValue = profile!.dimensions[dim];
                const animeValue = anime.traits[dim];
                
                // Calculate distance (squared to emphasize larger differences)
                const distance = Math.pow(Math.abs(profileValue - animeValue), 2) / 100;
                
                // Get weight for this dimension
                const weight = dimensionWeights[dim] || 1.0;
                
                // Apply weighted distance
                weightedDistanceSum += distance * weight;
                totalWeight += weight;
                
                // Calculate individual dimension score (100% - distance)
                const dimScore = 100 - (distance * 100);
                
                // Store dimension details
                dimensionScores[dim] = {
                  profileValue,
                  animeValue,
                  distance: Math.abs(profileValue - animeValue),
                  weight,
                  score: dimScore
                };
              }
            });
            
            // Calculate final match score
            const avgWeightedDistance = totalWeight > 0 ? weightedDistanceSum / totalWeight : 0.5;
            const matchScore = Math.max(0, Math.min(100, 100 - (avgWeightedDistance * 100)));
            
            // Add scores to anime
            anime.matchScore = Math.round(matchScore);
            anime.dimensionScores = dimensionScores;
          });
        }
      } catch (error) {
        console.error('Error loading mock anime database:', error);
      }
    }
    
    // Return combined debug info
    return NextResponse.json({
      success: true,
      env: envData,
      serverTime: new Date().toISOString(),
      profile: profile ? {
        id: profile.id,
        dimensions: profile.dimensions,
        confidences: profile.confidences
      } : null,
      manualMappingsCount: Object.keys(manualMappings).length,
      animeTraits: animeTraits,
      nodeEnv: process.env.NODE_ENV
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error in debug recommendations API:', error);
    return NextResponse.json({
      error: 'server_error',
      message: 'Error in debug recommendations endpoint',
      details: String(error)
    }, {
      status: 500,
      headers: corsHeaders()
    });
  }
}