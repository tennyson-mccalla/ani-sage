/**
 * Ani-Sage API Server
 * 
 * This file serves as the entry point for the API server.
 */

import * as http from 'http';
import * as url from 'url';
import dotenv from 'dotenv';
import { AnimeApiAdapter, ApiProvider } from './anime-api-adapter';
import { createApiAdapter } from './index';

// Load environment variables
dotenv.config();

// Initialize API adapter with configuration
const apiAdapter = createApiAdapter();

// Simple in-memory storage for sessions and profiles
const sessions: Record<string, any> = {};
const profiles: Record<string, any> = {};

// Create HTTP server
const server = http.createServer(async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Parse the URL
  const parsedUrl = url.parse(req.url || '', true);
  const pathname = parsedUrl.pathname || '';
  
  // API routing
  if (pathname === '/api/v1/session') {
    // Initialize or get user session
    handleSession(req, res);
  } else if (pathname === '/api/v1/questions') {
    // Get personalized questions
    handleGetQuestions(req, res);
  } else if (pathname.match(/^\/api\/v1\/questions\/[\w-]+\/answer$/)) {
    // Submit question answer
    handleSubmitAnswer(req, res, pathname);
  } else if (pathname === '/api/v1/profile') {
    // Get user profile
    handleGetProfile(req, res);
  } else if (pathname === '/api/v1/recommendations') {
    // Get recommendations
    handleGetRecommendations(req, res);
  } else if (pathname.match(/^\/api\/v1\/recommendations\/[\w-]+$/)) {
    // Get specific recommendation details
    handleGetAnimeDetails(req, res, pathname);
  } else {
    // Not found
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not_found', message: 'Endpoint not found' }));
  }
});

// Handle session initialization/retrieval
async function handleSession(req: http.IncomingMessage, res: http.ServerResponse) {
  const sessionId = `session_${Date.now()}`;
  sessions[sessionId] = { created: new Date().toISOString() };
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    sessionId,
    isNewUser: true,
    profileConfidence: 0,
    interactionCount: 0
  }));
}

// Handle getting questions
async function handleGetQuestions(req: http.IncomingMessage, res: http.ServerResponse) {
  try {
    // Parse the query parameters
    const parsedUrl = url.parse(req.url || '', true);
    const { count = 5, stage, sessionId } = parsedUrl.query;
    
    console.log(`Getting questions for session ${sessionId}, stage ${stage}, count ${count}`);
    
    // Import the full question bank from the advanced implementation
    const { questions } = require('../question-bank.js');
    
    // Create empty user profile for new users
    if (!profiles[sessionId as string]) {
      profiles[sessionId as string] = {
        userId: sessionId,
        dimensions: {
          visualComplexity: 5,
          colorSaturation: 5,
          visualPace: 5,
          narrativeComplexity: 5,
          narrativePace: 5,
          plotPredictability: 5,
          characterComplexity: 5,
          characterGrowth: 5,
          emotionalIntensity: 5,
          emotionalValence: 0, // -5 to 5 scale
          moralAmbiguity: 5,
          fantasyRealism: 0, // -5 to 5 scale
          intellectualEmotional: 0, // -5 to 5 scale
          noveltyFamiliarity: 0, // -5 to 5 scale
        },
        confidences: {
          visualComplexity: 0.1,
          colorSaturation: 0.1,
          visualPace: 0.1,
          narrativeComplexity: 0.1,
          narrativePace: 0.1,
          plotPredictability: 0.1,
          characterComplexity: 0.1,
          characterGrowth: 0.1,
          emotionalIntensity: 0.1,
          emotionalValence: 0.1,
          moralAmbiguity: 0.1,
          fantasyRealism: 0.1,
          intellectualEmotional: 0.1,
          noveltyFamiliarity: 0.1,
        },
        answeredQuestions: []
      };
    }
    
    // Get user profile for question selection
    const userProfile = profiles[sessionId as string];
    const answeredQuestionsIds = userProfile.answeredQuestions || [];
    
    // Filter questions by stage if specified
    let availableQuestions: any[] = questions;
    if (stage) {
      const stageNum = parseInt(stage as string, 10);
      availableQuestions = questions.filter((q: any) => q.stage === stageNum);
      console.log(`Filtered to ${availableQuestions.length} questions for stage ${stageNum}`);
    }
    
    // Filter out questions that have already been answered
    availableQuestions = availableQuestions.filter((q: any) => !answeredQuestionsIds.includes(q.id));
    console.log(`${availableQuestions.length} questions available after filtering answered questions`);
    
    // If we have a user profile with dimensions and confidences, we can use it to select questions
    // targeting dimensions with low confidence
    let selectedQuestions: any[] = [];
    
    if (userProfile && userProfile.confidences) {
      // Sort dimensions by confidence ascending
      const sortedDimensions = Object.entries(userProfile.confidences)
        .map(([dimension, confidence]) => ({ 
          dimension, 
          confidence: confidence as number 
        }))
        .sort((a, b) => (a.confidence as number) - (b.confidence as number));
      
      // Target the dimensions with lowest confidence
      const targetDimensions = sortedDimensions
        .slice(0, 3)
        .map(d => d.dimension);
      
      console.log(`Targeting dimensions with lowest confidence: ${targetDimensions.join(', ')}`);
      
      // Find questions that target these dimensions
      const targetingQuestions = availableQuestions.filter((q: any) => 
        q.targetDimensions && q.targetDimensions.some((d: string) => targetDimensions.includes(d))
      );
      
      if (targetingQuestions.length > 0) {
        // Select questions targeting low-confidence dimensions
        while (selectedQuestions.length < Math.min(Number(count), targetingQuestions.length)) {
          // Pick a random question from targeting questions
          const randomIndex = Math.floor(Math.random() * targetingQuestions.length);
          const question = targetingQuestions[randomIndex];
          
          // Only add if not already selected
          if (!selectedQuestions.find(q => q.id === question.id)) {
            selectedQuestions.push(question);
          }
          
          // Remove from targeting questions to avoid duplicates
          targetingQuestions.splice(randomIndex, 1);
        }
      }
    }
    
    // If we don't have enough questions yet, add random ones
    while (selectedQuestions.length < Math.min(Number(count), availableQuestions.length)) {
      // Pick a random question
      const randomIndex = Math.floor(Math.random() * availableQuestions.length);
      const question = availableQuestions[randomIndex];
      
      // Only add if not already selected
      if (!selectedQuestions.find((q: any) => q.id === question.id)) {
        selectedQuestions.push(question);
      }
      
      // Remove from available questions to avoid duplicates
      availableQuestions.splice(randomIndex, 1);
    }
    
    console.log(`Selected ${selectedQuestions.length} questions`);
    
    // Format questions for the frontend by cleaning up irrelevant fields
    const formattedQuestions = selectedQuestions.map((q: any) => ({
      id: q.id,
      type: q.type || 'text',
      text: q.text,
      description: q.description,
      imageUrl: q.imageUrl, // For image-based questions
      options: q.options.map((opt: any) => ({
        id: opt.id,
        text: opt.text,
        imageUrl: opt.imageUrl // For image options
      })),
      stage: q.stage
    }));
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ questions: formattedQuestions }));
  } catch (error) {
    console.error('Error getting questions:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'server_error', 
      message: 'Error retrieving questions',
      details: String(error)
    }));
  }
}

// Handle submitting an answer
async function handleSubmitAnswer(req: http.IncomingMessage, res: http.ServerResponse, pathname: string) {
  try {
    // Parse request body to get answer data
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    await new Promise<void>((resolve, reject) => {
      req.on('end', () => resolve());
      req.on('error', reject);
    });
    
    const data = JSON.parse(body);
    const { optionId, sessionId } = data;
    
    // Parse the question ID from the URL
    const questionId = pathname.split('/')[4];
    
    console.log(`Processing answer for question ${questionId}, option ${optionId}, session ${sessionId}`);
    
    // Load the question bank
    const { questions } = require('../question-bank.js');
    
    // Find the question
    const question = questions.find((q: any) => q.id === questionId);
    if (!question) {
      throw new Error(`Question ${questionId} not found`);
    }
    
    // Find the selected option
    const option = question.options.find((o: any) => o.id === optionId);
    if (!option) {
      throw new Error(`Option ${optionId} not found for question ${questionId}`);
    }
    
    // Make sure we have a profile for this user
    if (!profiles[sessionId]) {
      profiles[sessionId] = {
        userId: sessionId,
        dimensions: {
          visualComplexity: 5,
          colorSaturation: 5,
          visualPace: 5,
          narrativeComplexity: 5,
          narrativePace: 5,
          plotPredictability: 5,
          characterComplexity: 5,
          characterGrowth: 5,
          emotionalIntensity: 5,
          emotionalValence: 0,
          moralAmbiguity: 5,
          fantasyRealism: 0,
          intellectualEmotional: 0,
          noveltyFamiliarity: 0,
        },
        confidences: {
          visualComplexity: 0.1,
          colorSaturation: 0.1,
          visualPace: 0.1,
          narrativeComplexity: 0.1,
          narrativePace: 0.1,
          plotPredictability: 0.1,
          characterComplexity: 0.1,
          characterGrowth: 0.1,
          emotionalIntensity: 0.1,
          emotionalValence: 0.1,
          moralAmbiguity: 0.1,
          fantasyRealism: 0.1,
          intellectualEmotional: 0.1,
          noveltyFamiliarity: 0.1,
        },
        answeredQuestions: []
      };
    }
    
    // Get user profile
    const userProfile = profiles[sessionId];
    
    // Update the profile with Bayesian update based on option mappings
    if (option.mappings && option.mappings.length > 0) {
      // For each dimension mapping in the option
      for (const mapping of option.mappings) {
        const { dimension, value, confidence } = mapping;
        
        if (userProfile.dimensions && dimension in userProfile.dimensions) {
          // Current belief and confidence
          const currentValue = userProfile.dimensions[dimension];
          const currentConfidence = userProfile.confidences[dimension] || 0.1;
          
          // Bayesian update formula:
          // new_value = (current_value * current_confidence + new_value * new_confidence) / (current_confidence + new_confidence)
          // new_confidence = current_confidence + new_confidence
          const newConfidence = Math.min(1.0, currentConfidence + (confidence || 0.1));
          const newValue = (currentValue * currentConfidence + value * (confidence || 0.1)) / newConfidence;
          
          // Update profile
          userProfile.dimensions[dimension] = newValue;
          userProfile.confidences[dimension] = newConfidence;
          
          console.log(`Updated dimension ${dimension}: ${currentValue.toFixed(2)} -> ${newValue.toFixed(2)}, confidence: ${currentConfidence.toFixed(2)} -> ${newConfidence.toFixed(2)}`);
        }
      }
    }
    
    // Mark question as answered
    if (!userProfile.answeredQuestions.includes(questionId)) {
      userProfile.answeredQuestions.push(questionId);
    }
    
    // Update the profile in storage
    profiles[sessionId] = userProfile;
    
    // Decide on next action
    let nextAction = 'more_questions';
    if (userProfile.answeredQuestions.length >= 5) {
      // If they've answered at least 5 questions, they can get recommendations
      nextAction = 'recommendations';
    }
    
    // Return success
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      profileUpdated: true,
      nextAction,
      profile: {
        dimensions: userProfile.dimensions,
        confidences: userProfile.confidences,
        answeredQuestions: userProfile.answeredQuestions
      }
    }));
  } catch (error) {
    console.error('Error processing answer:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'server_error', 
      message: 'Error processing answer',
      details: String(error)
    }));
  }
}

// Handle getting user profile
async function handleGetProfile(req: http.IncomingMessage, res: http.ServerResponse) {
  try {
    // Parse the query parameters
    const parsedUrl = url.parse(req.url || '', true);
    const { sessionId } = parsedUrl.query;
    
    console.log(`Getting profile for session ${sessionId}`);
    
    // If no sessionId, we can't get a profile
    if (!sessionId || !profiles[sessionId as string]) {
      // Return a default profile
      const defaultProfile = {
        dimensions: {
          visualComplexity: 5,
          colorSaturation: 5,
          visualPace: 5,
          narrativeComplexity: 5,
          narrativePace: 5,
          plotPredictability: 5,
          characterComplexity: 5,
          characterGrowth: 5,
          emotionalIntensity: 5,
          emotionalValence: 0,
          moralAmbiguity: 5,
          fantasyRealism: 0,
          intellectualEmotional: 0,
          noveltyFamiliarity: 0,
        },
        confidences: {
          visualComplexity: 0.1,
          colorSaturation: 0.1,
          visualPace: 0.1,
          narrativeComplexity: 0.1,
          narrativePace: 0.1,
          plotPredictability: 0.1,
          characterComplexity: 0.1,
          characterGrowth: 0.1,
          emotionalIntensity: 0.1,
          emotionalValence: 0.1,
          moralAmbiguity: 0.1,
          fantasyRealism: 0.1,
          intellectualEmotional: 0.1,
          noveltyFamiliarity: 0.1,
        },
        answeredQuestions: [],
        suggestedAdjustments: []
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(defaultProfile));
      return;
    }
    
    // Get the actual user profile
    const userProfile = profiles[sessionId as string];
    
    // Generate suggested adjustments based on confidence
    const suggestedAdjustments = [];
    
    // Find dimensions with highest confidence where the value is notably different from default
    for (const [dimension, value] of Object.entries(userProfile.dimensions)) {
      const confidence = userProfile.confidences ? 
        (userProfile.confidences as Record<string, number>)[dimension] || 0 : 0;
      
      // Only suggest for high-confidence dimensions (> 0.5)
      if (confidence > 0.5) {
        // For dimensions with 0-10 scale, default is 5
        if (dimension !== 'emotionalValence' && dimension !== 'fantasyRealism' && 
            dimension !== 'intellectualEmotional' && dimension !== 'noveltyFamiliarity') {
          
          // If value is significantly different from default (5)
          const numValue = Number(value);
          const deviation = Math.abs(numValue - 5);
          if (deviation > 2) {
            // More significant deviation = higher confidence in suggestion
            suggestedAdjustments.push({
              dimension,
              explanation: `Based on your answers, your ${formatDimensionName(dimension)} preference is ${numValue > 5 ? 'higher' : 'lower'} than average.`,
              currentValue: numValue,
              suggestedValue: numValue,  // No change, just highlighting
              confidence: confidence
            });
          }
        }
        // For dimensions with -5 to 5 scale, default is 0
        else {
          // If value is significantly different from default (0)
          const numValue = Number(value);
          const deviation = Math.abs(numValue);
          if (deviation > 2) {
            const explanation = dimension === 'emotionalValence' ? 
              `You appear to prefer ${numValue > 0 ? 'more positive' : 'more negative'} emotional tones in stories.` :
              dimension === 'fantasyRealism' ?
              `You appear to prefer ${numValue > 0 ? 'more fantastical' : 'more realistic'} stories.` :
              dimension === 'intellectualEmotional' ?
              `You engage with stories more ${numValue > 0 ? 'intellectually' : 'emotionally'}.` :
              `You prefer ${numValue > 0 ? 'newer, unfamiliar' : 'familiar, established'} content.`;
              
            suggestedAdjustments.push({
              dimension,
              explanation,
              currentValue: numValue,
              suggestedValue: numValue,  // No change, just highlighting
              confidence: confidence
            });
          }
        }
      }
    }
    
    // Sort by confidence descending and limit to top 3
    suggestedAdjustments.sort((a, b) => b.confidence - a.confidence);
    const topAdjustments = suggestedAdjustments.slice(0, 3);
    
    // Return the profile with suggested adjustments
    const response = {
      dimensions: userProfile.dimensions,
      confidences: userProfile.confidences,
      answeredQuestions: userProfile.answeredQuestions,
      suggestedAdjustments: topAdjustments
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'server_error', 
      message: 'Error retrieving user profile',
      details: String(error)
    }));
  }
}

// Helper function to format dimension names for user-friendly display
function formatDimensionName(dimension: string): string {
  // Convert camelCase to space-separated words
  const formatted = dimension.replace(/([A-Z])/g, ' $1');
  
  // Capitalize the first letter
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

// Handle getting recommendations
async function handleGetRecommendations(req: http.IncomingMessage, res: http.ServerResponse) {
  try {
    // Parse the query parameters
    const parsedUrl = url.parse(req.url || '', true);
    const { sessionId } = parsedUrl.query;
    
    console.log(`Getting recommendations for session ${sessionId}`);
    
    // Get user profile or use default if not found
    const userProfile = profiles[sessionId as string] || {
      dimensions: {
        visualComplexity: 5,
        colorSaturation: 5,
        visualPace: 5,
        narrativeComplexity: 5,
        narrativePace: 5,
        plotPredictability: 5,
        characterComplexity: 5,
        characterGrowth: 5,
        emotionalIntensity: 5,
        emotionalValence: 0,
        moralAmbiguity: 5,
        fantasyRealism: 0,
        intellectualEmotional: 0,
        noveltyFamiliarity: 0
      }
    };
    
    console.log('Fetching anime from API using psychological profile...');
    
    // Get top anime from API
    let animeList;
    try {
      // Try to get popular anime
      console.log('Fetching anime list...');
      animeList = await apiAdapter.getPopularAnime(10, 1);
      
      // If no anime found, try seasonal
      if (!animeList || animeList.length === 0) {
        throw new Error('No anime found from popular endpoint');
      }
    } catch (err) {
      console.error('Failed to get popular anime, falling back to seasonal anime', err);
      
      // Fallback to seasonal anime if popular anime fails
      try {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        
        // Determine current season
        const month = currentDate.getMonth() + 1;
        let season;
        if (month >= 1 && month <= 3) season = 'winter';
        else if (month >= 4 && month <= 6) season = 'spring';
        else if (month >= 7 && month <= 9) season = 'summer';
        else season = 'fall';
        
        console.log(`Fetching seasonal anime for ${season} ${year}...`);
        animeList = await apiAdapter.getSeasonalAnime(year, season, 10);
        
        // If no anime found, use hardcoded
        if (!animeList || animeList.length === 0) {
          throw new Error('No anime found from seasonal endpoint');
        }
      } catch (err2) {
        console.error('Failed to get seasonal anime, using hardcoded fallback', err2);
        
        // Fallback to hardcoded data if all API calls fail
        animeList = [
          {
            id: 1,
            title: 'Fullmetal Alchemist: Brotherhood',
            alternativeTitles: [],
            image: { 
              medium: 'https://placehold.co/300x450/25163c/ffffff?text=Fullmetal+Alchemist',
              large: 'https://placehold.co/300x450/25163c/ffffff?text=Fullmetal+Alchemist'
            },
            synopsis: 'Two brothers search for a Philosopher\'s Stone after an attempt to revive their deceased mother goes wrong, changing their bodies.',
            score: 9.1,
            genres: ['Action', 'Adventure', 'Drama', 'Fantasy'],
            trailer: 'https://youtube.com/watch?v=--IcmZkvL0Q'
          },
          {
            id: 2,
            title: 'Steins;Gate',
            alternativeTitles: [],
            image: {
              medium: 'https://placehold.co/300x450/25163c/ffffff?text=Steins;Gate',
              large: 'https://placehold.co/300x450/25163c/ffffff?text=Steins;Gate'
            },
            synopsis: 'A group of friends accidentally create a time machine, leading to dramatic consequences as they attempt to prevent global disaster.',
            score: 9.0,
            genres: ['Sci-Fi', 'Thriller', 'Drama'],
            trailer: 'https://youtube.com/watch?v=27OZc-ku6is'
          },
          {
            id: 3,
            title: 'Violet Evergarden',
            alternativeTitles: [],
            image: {
              medium: 'https://placehold.co/300x450/25163c/ffffff?text=Violet+Evergarden',
              large: 'https://placehold.co/300x450/25163c/ffffff?text=Violet+Evergarden'
            },
            synopsis: 'A former soldier becomes a letter writer and explores the meaning of love as she recovers from the war.',
            score: 8.9,
            genres: ['Drama', 'Fantasy', 'Slice of Life'],
            trailer: 'https://youtube.com/watch?v=0CJeDetA45Q'
          }
        ];
      }
    }
    
    // Assign psychological attributes to each anime based on metadata
    console.log('Mapping anime to psychological attributes...');
    const animeWithAttributes = animeList.map(anime => {
      // Use the actual inferAnimeAttributes method if available
      let attributes = {};
      try {
        attributes = apiAdapter.inferAnimeAttributes(anime);
      } catch (error) {
        console.error(`Error inferring attributes for anime ${anime.id}:`, error);
        
        // Default attributes based on genres if inference fails
        attributes = inferAttributesFromGenres(anime.genres || []);
      }
      
      return {
        anime,
        attributes
      };
    });
    
    // Score each anime based on match with user profile
    console.log('Calculating match scores based on psychological profile...');
    const scoredAnime = animeWithAttributes.map(({ anime, attributes }) => {
      // Calculate match score as weighted Euclidean distance (lower = better match)
      let distanceSquared = 0;
      let totalWeight = 0;
      
      // Count how many dimensions we actually compared
      let dimensionsCompared = 0;
      
      // For each dimension in the user profile, compare with anime attributes
      for (const dimension of Object.keys(userProfile.dimensions)) {
        if (dimension in attributes && dimension in userProfile.dimensions) {
          // Get the values to compare
          const userValue = (userProfile.dimensions as Record<string, number>)[dimension];
          const animeValue = (attributes as Record<string, number>)[dimension];
          
          // Get confidence as weight (higher confidence = more important)
          const confidence = userProfile.confidences ? 
            (userProfile.confidences as Record<string, number>)[dimension] || 0.5 : 0.5;
          const weight = confidence;
          
          // For dimensions with range 0-10
          if (dimension !== 'emotionalValence' && dimension !== 'fantasyRealism' &&
              dimension !== 'intellectualEmotional' && dimension !== 'noveltyFamiliarity') {
            // Calculate squared difference, normalized to 0-1 range
            const diff = (animeValue - userValue) / 10;
            distanceSquared += diff * diff * weight;
          } 
          // For dimensions with range -5 to 5
          else {
            // Calculate squared difference, normalized to 0-1 range
            const diff = (animeValue - userValue) / 10;
            distanceSquared += diff * diff * weight;
          }
          
          totalWeight += weight;
          dimensionsCompared++;
        }
      }
      
      // Scale by number of dimensions compared to avoid bias
      if (dimensionsCompared > 0 && totalWeight > 0) {
        distanceSquared = distanceSquared / totalWeight;
      }
      
      // Convert distance to score (0-10 scale, higher is better match)
      // Using an exponential decay function: score = 10 * e^(-distance)
      const matchScore = Math.round((10 * Math.exp(-Math.sqrt(distanceSquared))) * 10) / 10;
      
      // Generate match reasons based on closest attribute matches
      const matchReasons = generateMatchReasons(userProfile.dimensions, attributes);
      
      return {
        anime,
        attributes,
        matchScore,
        matchReasons
      };
    });
    
    // Sort by match score (highest first)
    scoredAnime.sort((a, b) => b.matchScore - a.matchScore);
    
    // Take top matches (up to 5)
    const topMatches = scoredAnime.slice(0, 5);
    
    // Enrich top matches with trailers if possible
    console.log('Enriching recommendations with trailers...');
    const enrichedRecommendations = await Promise.all(topMatches.map(async ({ anime, matchScore, matchReasons }) => {
      try {
        const enrichedAnime = await apiAdapter.enrichWithTrailer(anime);
        
        // Extract YouTube ID from trailer URL
        let youtubeTrailerId = null;
        if (enrichedAnime.trailer) {
          const match = enrichedAnime.trailer.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
          youtubeTrailerId = match ? match[1] : null;
        }
        
        // Format for the response
        return {
          id: String(enrichedAnime.id),
          title: enrichedAnime.title,
          imageUrls: { 
            poster: enrichedAnime.image.large || enrichedAnime.image.medium || 
                   `https://placehold.co/300x450/25163c/ffffff?text=${encodeURIComponent(enrichedAnime.title)}`
          },
          genres: enrichedAnime.genres || [],
          score: matchScore,  // Use our psychological match score
          synopsis: enrichedAnime.synopsis || 'No synopsis available.',
          matchReasons: matchReasons.slice(0, 3), // Limit to top 3 reasons
          externalIds: {
            youtubeTrailerId,
            ...(enrichedAnime.externalIds || {})
          }
        };
      } catch (error) {
        console.error(`Error enriching anime ${anime.id}:`, error);
        
        // Return non-enriched version if enrichment fails
        return {
          id: String(anime.id),
          title: anime.title,
          imageUrls: { 
            poster: anime.image.large || anime.image.medium || 
                   `https://placehold.co/300x450/25163c/ffffff?text=${encodeURIComponent(anime.title)}`
          },
          genres: anime.genres || [],
          score: matchScore,
          synopsis: anime.synopsis || 'No synopsis available.',
          matchReasons: matchReasons.slice(0, 3),
          externalIds: {
            ...(anime.externalIds || {})
          }
        };
      }
    }));
    
    console.log(`Successfully processed ${enrichedRecommendations.length} personalized anime recommendations`);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ recommendations: enrichedRecommendations }));
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'server_error', 
      message: 'Error getting recommendations',
      details: String(error)
    }));
  }
}

/**
 * Generate psychologically-relevant match reasons
 */
function generateMatchReasons(userDimensions: Record<string, number>, animeAttributes: Record<string, number>): {dimension: string, strength: number, explanation: string}[] {
  const reasons: {dimension: string, strength: number, explanation: string}[] = [];
  
  // For visual dimensions
  const userVisualComplexity = userDimensions.visualComplexity ?? 5;
  const animeVisualComplexity = animeAttributes.visualComplexity ?? 5;
  
  if (Math.abs(userVisualComplexity - animeVisualComplexity) <= 2) {
    const strength = 1 - Math.abs(userVisualComplexity - animeVisualComplexity) / 10;
    if (animeVisualComplexity >= 7) {
      reasons.push({
        dimension: 'visualComplexity',
        strength,
        explanation: 'The detailed visual style aligns with your aesthetic preferences'
      });
    } else if (animeVisualComplexity <= 3) {
      reasons.push({
        dimension: 'visualComplexity',
        strength,
        explanation: 'The clean, minimalist visuals match your preferred aesthetic'
      });
    } else {
      reasons.push({
        dimension: 'visualComplexity',
        strength,
        explanation: 'The balanced visual presentation suits your preferences'
      });
    }
  }
  
  // For narrative dimensions
  const userNarrativeComplexity = userDimensions.narrativeComplexity ?? 5;
  const animeNarrativeComplexity = animeAttributes.narrativeComplexity ?? 5;
  
  if (Math.abs(userNarrativeComplexity - animeNarrativeComplexity) <= 2) {
    const strength = 1 - Math.abs(userNarrativeComplexity - animeNarrativeComplexity) / 10;
    if (animeNarrativeComplexity >= 7) {
      reasons.push({
        dimension: 'narrativeComplexity',
        strength,
        explanation: 'The intricate storylines align with your preference for complex narratives'
      });
    } else if (animeNarrativeComplexity <= 3) {
      reasons.push({
        dimension: 'narrativeComplexity',
        strength,
        explanation: 'The straightforward storytelling matches your preference for clarity'
      });
    }
  }
  
  // For character dimensions
  const userCharacterComplexity = userDimensions.characterComplexity ?? 5;
  const animeCharacterComplexity = animeAttributes.characterComplexity ?? 5;
  
  if (Math.abs(userCharacterComplexity - animeCharacterComplexity) <= 2) {
    const strength = 1 - Math.abs(userCharacterComplexity - animeCharacterComplexity) / 10;
    if (animeCharacterComplexity >= 7) {
      reasons.push({
        dimension: 'characterComplexity',
        strength,
        explanation: 'The nuanced, layered characters match your interest in character depth'
      });
    } else if (animeCharacterComplexity <= 3) {
      reasons.push({
        dimension: 'characterComplexity',
        strength,
        explanation: 'The clear, well-defined characters align with your preferences'
      });
    }
  }
  
  // For emotional dimensions
  const userEmotionalIntensity = userDimensions.emotionalIntensity ?? 5;
  const animeEmotionalIntensity = animeAttributes.emotionalIntensity ?? 5;
  
  if (Math.abs(userEmotionalIntensity - animeEmotionalIntensity) <= 2) {
    const strength = 1 - Math.abs(userEmotionalIntensity - animeEmotionalIntensity) / 10;
    if (animeEmotionalIntensity >= 7) {
      reasons.push({
        dimension: 'emotionalIntensity',
        strength,
        explanation: 'The emotional depth resonates with your preference for impactful stories'
      });
    } else if (animeEmotionalIntensity <= 3) {
      reasons.push({
        dimension: 'emotionalIntensity',
        strength,
        explanation: 'The measured emotional tone aligns with your preference for restraint'
      });
    }
  }
  
  // For emotional valence
  const userEmotionalValence = userDimensions.emotionalValence ?? 0;
  const animeEmotionalValence = animeAttributes.emotionalValence ?? 0;
  
  if (Math.abs(userEmotionalValence - animeEmotionalValence) <= 2) {
    const strength = 1 - Math.abs(userEmotionalValence - animeEmotionalValence) / 10;
    if (animeEmotionalValence > 2) {
      reasons.push({
        dimension: 'emotionalValence',
        strength,
        explanation: 'The positive, uplifting atmosphere matches your emotional preferences'
      });
    } else if (animeEmotionalValence < -2) {
      reasons.push({
        dimension: 'emotionalValence',
        strength,
        explanation: 'The darker, more serious tone aligns with your emotional preferences'
      });
    }
  }
  
  // For moral ambiguity
  const userMoralAmbiguity = userDimensions.moralAmbiguity ?? 5;
  const animeMoralAmbiguity = animeAttributes.moralAmbiguity ?? 5;
  
  if (Math.abs(userMoralAmbiguity - animeMoralAmbiguity) <= 2) {
    const strength = 1 - Math.abs(userMoralAmbiguity - animeMoralAmbiguity) / 10;
    if (animeMoralAmbiguity >= 7) {
      reasons.push({
        dimension: 'moralAmbiguity',
        strength,
        explanation: 'The morally complex scenarios match your interest in nuanced storytelling'
      });
    } else if (animeMoralAmbiguity <= 3) {
      reasons.push({
        dimension: 'moralAmbiguity',
        strength,
        explanation: 'The clear moral framework aligns with your storytelling preferences'
      });
    }
  }
  
  // If we don't have enough reasons yet, add generic ones
  if (reasons.length < 3) {
    // Add generic reasons based on score and popularity
    reasons.push({
      dimension: 'general',
      strength: 0.7,
      explanation: 'This highly-rated anime has resonated with viewers who share your preferences'
    });
    
    reasons.push({
      dimension: 'general',
      strength: 0.6,
      explanation: 'The overall tone and style should appeal to your sensibilities'
    });
  }
  
  // Sort by strength and return
  reasons.sort((a, b) => b.strength - a.strength);
  return reasons;
}

/**
 * Infer psychological attributes from genres as a fallback
 */
function inferAttributesFromGenres(genres: string[]): Record<string, number> {
  const attributes: Record<string, number> = {
    visualComplexity: 5,
    colorSaturation: 5,
    visualPace: 5,
    narrativeComplexity: 5,
    narrativePace: 5,
    plotPredictability: 5,
    characterComplexity: 5,
    characterGrowth: 5,
    emotionalIntensity: 5,
    emotionalValence: 0,
    moralAmbiguity: 5,
    fantasyRealism: 0,
    intellectualEmotional: 0,
    noveltyFamiliarity: 0
  };
  
  // Adjust attributes based on genres
  if (genres.includes('Action')) {
    attributes.visualPace = 8;
    attributes.narrativePace = 7;
    attributes.emotionalIntensity = 7;
  }
  
  if (genres.includes('Adventure')) {
    attributes.visualComplexity = 7;
    attributes.narrativePace = 6;
    attributes.emotionalValence = 2;
  }
  
  if (genres.includes('Comedy')) {
    attributes.emotionalValence = 3;
    attributes.plotPredictability = 6;
  }
  
  if (genres.includes('Drama')) {
    attributes.emotionalIntensity = 8;
    attributes.characterComplexity = 7;
    attributes.characterGrowth = 8;
  }
  
  if (genres.includes('Fantasy')) {
    attributes.fantasyRealism = 3;
    attributes.visualComplexity = 7;
  }
  
  if (genres.includes('Horror')) {
    attributes.emotionalValence = -4;
    attributes.emotionalIntensity = 9;
  }
  
  if (genres.includes('Mystery') || genres.includes('Thriller')) {
    attributes.plotPredictability = 3;
    attributes.narrativeComplexity = 8;
    attributes.intellectualEmotional = 2;
  }
  
  if (genres.includes('Psychological')) {
    attributes.narrativeComplexity = 9;
    attributes.characterComplexity = 8;
    attributes.moralAmbiguity = 8;
  }
  
  if (genres.includes('Romance')) {
    attributes.emotionalIntensity = 7;
    attributes.characterComplexity = 6;
    attributes.emotionalValence = 2;
  }
  
  if (genres.includes('Sci-Fi')) {
    attributes.intellectualEmotional = 3;
    attributes.narrativeComplexity = 7;
    attributes.fantasyRealism = 2;
  }
  
  if (genres.includes('Slice of Life')) {
    attributes.visualPace = 3;
    attributes.narrativePace = 3;
    attributes.emotionalIntensity = 5;
    attributes.fantasyRealism = -3;
  }
  
  if (genres.includes('Sports')) {
    attributes.emotionalIntensity = 7;
    attributes.narrativePace = 6;
    attributes.fantasyRealism = -4;
  }
  
  return attributes;
}

// Handle getting anime details
async function handleGetAnimeDetails(req: http.IncomingMessage, res: http.ServerResponse, pathname: string) {
  try {
    // Parse the anime ID from the URL
    const animeId = pathname.split('/')[4];
    
    // Try to get real anime details
    console.log(`Fetching details for anime ID: ${animeId}`);
    
    let animeDetails;
    try {
      // Convert string ID to numeric ID
      const numericId = parseInt(animeId, 10);
      if (isNaN(numericId)) {
        throw new Error('Invalid anime ID');
      }
      
      // Get anime details from API
      animeDetails = await apiAdapter.getAnimeDetails(numericId);
      
      // If not found, throw error to use fallback
      if (!animeDetails) {
        throw new Error('Anime not found');
      }
      
      // Enrich with trailer if possible
      animeDetails = await apiAdapter.enrichWithTrailer(animeDetails);
    } catch (error) {
      console.error('Error fetching anime details from API:', error);
      
      // Fallback to hardcoded data if API call fails
      console.log('Using fallback anime details');
      animeDetails = {
        id: parseInt(animeId, 10),
        title: animeId === '1' ? 'Fullmetal Alchemist: Brotherhood' : 
               animeId === '2' ? 'Steins;Gate' : 'Violet Evergarden',
        alternativeTitles: ['Japanese Title', 'English Title'],
        image: {
          medium: `https://placehold.co/300x450/25163c/ffffff?text=${encodeURIComponent(
            animeId === '1' ? 'Fullmetal Alchemist: Brotherhood' : 
            animeId === '2' ? 'Steins;Gate' : 'Violet Evergarden'
          )}`,
          large: `https://placehold.co/600x900/25163c/ffffff?text=${encodeURIComponent(
            animeId === '1' ? 'Fullmetal Alchemist: Brotherhood' : 
            animeId === '2' ? 'Steins;Gate' : 'Violet Evergarden'
          )}`
        },
        synopsis: 'Sample synopsis for the selected anime.',
        score: 9.1,
        genres: ['Action', 'Adventure', 'Drama'],
        episodeCount: 24,
        format: 'TV',
        status: 'FINISHED',
        seasonYear: 2020,
        season: 'SPRING',
        trailer: animeId === '1' ? 'https://youtube.com/watch?v=--IcmZkvL0Q' :
                 animeId === '2' ? 'https://youtube.com/watch?v=27OZc-ku6is' :
                 'https://youtube.com/watch?v=0CJeDetA45Q',
        externalIds: {
          youtubeTrailerId: animeId === '1' ? '--IcmZkvL0Q' :
                            animeId === '2' ? '27OZc-ku6is' : '0CJeDetA45Q'
        }
      };
    }
    
    // Extract YouTube ID from trailer URL
    let youtubeTrailerId = null;
    if (animeDetails.trailer) {
      const match = animeDetails.trailer.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      youtubeTrailerId = match ? match[1] : null;
    }
    
    // Format response
    const formattedDetails = {
      id: String(animeDetails.id),
      title: animeDetails.title,
      alternativeTitles: animeDetails.alternativeTitles || [],
      synopsis: animeDetails.synopsis || 'No synopsis available.',
      genres: animeDetails.genres || [],
      year: animeDetails.seasonYear || 2020,
      season: animeDetails.season || 'SPRING',
      episodeCount: animeDetails.episodeCount || 12,
      rating: animeDetails.score || 8.5,
      popularity: animeDetails.popularity || 90,
      imageUrls: {
        poster: animeDetails.image?.large || animeDetails.image?.medium || 
               `https://placehold.co/300x450/25163c/ffffff?text=${encodeURIComponent(animeDetails.title)}`,
        banner: `https://placehold.co/1000x250/25163c/ffffff?text=${encodeURIComponent(animeDetails.title)}`,
        thumbnail: animeDetails.image?.medium || 
                 `https://placehold.co/150x200/25163c/ffffff?text=${encodeURIComponent(animeDetails.title)}`
      },
      externalIds: {
        ...(animeDetails.externalIds || {}),
        youtubeTrailerId: youtubeTrailerId || 
                          (animeDetails.externalIds?.youtubeTrailerId || null)
      },
      matchScore: 8 + Math.random() * 2, // Random match score between 8-10
      matchReasons: [
        {
          dimension: 'narrativeComplexity',
          strength: 0.75 + Math.random() * 0.25,
          explanation: 'The narrative complexity matches your preference for intricate stories.'
        },
        {
          dimension: 'characterDepth',
          strength: 0.7 + Math.random() * 0.3,
          explanation: 'The character development aligns with your interest in complex characters.'
        },
        {
          dimension: 'visualStyle',
          strength: 0.8 + Math.random() * 0.2,
          explanation: 'The visual aesthetics match your preferred style.'
        }
      ],
      similarTitles: [
        {
          id: animeId === '1' ? '2' : '1',
          title: animeId === '1' ? 'Steins;Gate' : 'Fullmetal Alchemist: Brotherhood',
          imageUrl: `https://placehold.co/150x200/25163c/ffffff?text=${encodeURIComponent(
            animeId === '1' ? 'Steins;Gate' : 'Fullmetal Alchemist: Brotherhood'
          )}`
        },
        {
          id: '3',
          title: 'Violet Evergarden',
          imageUrl: 'https://placehold.co/150x200/25163c/ffffff?text=Violet+Evergarden'
        }
      ]
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(formattedDetails));
  } catch (error) {
    console.error('Error getting anime details:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'server_error', message: 'Error getting anime details' }));
  }
}

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Ani-Sage API server running on port ${PORT}`);
  console.log(`API base URL: http://localhost:${PORT}/api/v1`);
});

// Export for use in other files
export { server };