/**
 * Recommendation Engine Demo
 * 
 * This script demonstrates the recommendation engine functionality
 * by generating recommendations for sample user profiles.
 */

import { createApiAdapter } from './api/config';
import { createInitialProfile } from './psychological-dimensions';
import { RecommendationService } from './recommendation-service';
import { updateProfileFromQuestion } from './profile-update';
import { getEmptySampleQuestions, getSampleQuestionById } from './question-bank';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Run the recommendation engine demo
 */
async function runRecommendationDemo(): Promise<void> {
  console.log('=== Recommendation Engine Demo ===\n');
  
  // Initialize the API adapter and recommendation service
  const apiAdapter = createApiAdapter();
  const recommendationService = new RecommendationService(apiAdapter);

  // Create sample user profiles with different psychological preferences
  const userProfiles = createSampleUserProfiles();
  
  // Generate and display recommendations for each profile
  for (const profile of userProfiles) {
    console.log(`\n== Recommendations for ${profile.profileName} ==`);
    console.log(`Profile psychological traits:`);
    
    // Display key psychological dimensions
    const keyDimensions = [
      'visualComplexity',
      'narrativeComplexity',
      'emotionalIntensity',
      'moralAmbiguity',
      'fantasyRealism'
    ];
    
    keyDimensions.forEach(dimension => {
      const value = profile.userProfile.dimensions[dimension];
      console.log(`- ${dimension}: ${value.toFixed(1)}`);
    });
    
    // Generate recommendations
    try {
      const recommendations = await recommendationService.getRecommendations(
        profile.userProfile,
        { count: 5 }
      );
      
      if (recommendations.length === 0) {
        console.log('\nNo recommendations found for this profile.');
        continue;
      }
      
      console.log('\nTop recommendations:');
      recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec.anime.title}`);
        console.log(`   Score: ${rec.score.toFixed(1)}/10`);
        console.log(`   Genres: ${rec.anime.genres.join(', ')}`);
        
        // Display match reasons
        if (rec.matchReasons && rec.matchReasons.length > 0) {
          console.log('   Match reasons:');
          rec.matchReasons.slice(0, 2).forEach(reason => {
            console.log(`   - ${reason.explanation}`);
          });
        }
        console.log();
      });
      
      // Get similar anime for the top recommendation
      if (recommendations.length > 0) {
        const topAnimeId = recommendations[0].anime.id;
        console.log(`Similar anime to "${recommendations[0].anime.title}":`);
        
        const similarAnime = await recommendationService.getSimilarAnime(topAnimeId, 3);
        
        if (similarAnime.length === 0) {
          console.log('No similar anime found.');
        } else {
          similarAnime.forEach((rec, i) => {
            console.log(`${i + 1}. ${rec.anime.title} (${rec.score.toFixed(1)}/10)`);
          });
        }
      }
    } catch (error) {
      console.error(`Error getting recommendations for ${profile.profileName}:`, error);
    }
  }
  
  // Demonstrate seasonal recommendations
  console.log('\n== Current Season Recommendations ==');
  try {
    const currentProfile = userProfiles[0].userProfile;
    const seasonalRecommendations = await recommendationService.getSeasonalRecommendations(
      currentProfile,
      undefined, // current season
      undefined, // current year
      3
    );
    
    if (seasonalRecommendations.length === 0) {
      console.log('No seasonal recommendations found.');
    } else {
      console.log('\nTop seasonal recommendations:');
      seasonalRecommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec.anime.title}`);
        console.log(`   Score: ${rec.score.toFixed(1)}/10`);
        console.log(`   Genres: ${rec.anime.genres.join(', ')}`);
      });
    }
  } catch (error) {
    console.error('Error getting seasonal recommendations:', error);
  }
  
  console.log('\nDemo completed!');
}

/**
 * Create sample user profiles with different psychological preferences
 */
function createSampleUserProfiles(): Array<{ 
  profileName: string; 
  userProfile: import('./data-models').UserProfile; 
}> {
  const profiles = [];
  const sampleQuestions = getEmptySampleQuestions();
  
  // Profile 1: Complex narrative lover
  const complexNarrativeProfile = createInitialProfile('user-1');
  
  // Answer questions to shape the profile
  const complexQuestions = [
    { questionId: 'narrative-complexity', optionId: 'high-complexity' },
    { questionId: 'moral-ambiguity', optionId: 'ambiguous' },
    { questionId: 'visual-style', optionId: 'detailed' },
    { questionId: 'character-depth', optionId: 'complex-characters' },
    { questionId: 'emotional-tone', optionId: 'dark-serious' }
  ];
  
  let profile1 = complexNarrativeProfile;
  complexQuestions.forEach(answer => {
    const question = getSampleQuestionById(sampleQuestions, answer.questionId);
    if (question) {
      profile1 = updateProfileFromQuestion(profile1, question, answer.optionId);
    }
  });
  
  profiles.push({
    profileName: 'Complex Narrative Enthusiast',
    userProfile: profile1
  });
  
  // Profile 2: Action/Adventure fan
  const actionProfile = createInitialProfile('user-2');
  
  const actionQuestions = [
    { questionId: 'narrative-complexity', optionId: 'medium-complexity' },
    { questionId: 'moral-ambiguity', optionId: 'clear-morals' },
    { questionId: 'visual-style', optionId: 'dynamic' },
    { questionId: 'character-depth', optionId: 'balanced-characters' },
    { questionId: 'emotional-tone', optionId: 'exciting-uplifting' }
  ];
  
  let profile2 = actionProfile;
  actionQuestions.forEach(answer => {
    const question = getSampleQuestionById(sampleQuestions, answer.questionId);
    if (question) {
      profile2 = updateProfileFromQuestion(profile2, question, answer.optionId);
    }
  });
  
  profiles.push({
    profileName: 'Action & Adventure Fan',
    userProfile: profile2
  });
  
  // Profile 3: Slice of life enjoyer
  const sliceOfLifeProfile = createInitialProfile('user-3');
  
  const solQuestions = [
    { questionId: 'narrative-complexity', optionId: 'low-complexity' },
    { questionId: 'moral-ambiguity', optionId: 'nuanced-morals' },
    { questionId: 'visual-style', optionId: 'clean-simple' },
    { questionId: 'character-depth', optionId: 'complex-characters' },
    { questionId: 'emotional-tone', optionId: 'light-optimistic' }
  ];
  
  let profile3 = sliceOfLifeProfile;
  solQuestions.forEach(answer => {
    const question = getSampleQuestionById(sampleQuestions, answer.questionId);
    if (question) {
      profile3 = updateProfileFromQuestion(profile3, question, answer.optionId);
    }
  });
  
  profiles.push({
    profileName: 'Slice of Life & Character Drama Fan',
    userProfile: profile3
  });
  
  return profiles;
}

// Run the demo
runRecommendationDemo().catch(error => {
  console.error('Demo failed with error:', error);
});