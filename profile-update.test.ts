import type { Question, UserProfile } from './data-models';
import { createInitialProfile } from './psychological-dimensions';
import { updateProfileFromQuestion, updateProfileFromAnimeFeedback, generateProfileAdjustments } from './profile-update';

describe('Profile Update Algorithm', () => {
  let testProfile: UserProfile;
  let testQuestion: Question;
  
  beforeEach(() => {
    // Initialize a fresh test profile
    testProfile = createInitialProfile('test-user-123');
    
    // Create a test question
    testQuestion = {
      id: 'q1',
      type: 'text',
      text: 'How do you feel about complex moral situations in stories?',
      options: [
        {
          id: 'q1-a1',
          text: 'I prefer clear moral boundaries between good and evil',
          mappings: [
            { dimension: 'moralAmbiguity', value: 2, confidence: 0.7 }
          ]
        },
        {
          id: 'q1-a2',
          text: 'I enjoy some moral complexity but still want some clarity',
          mappings: [
            { dimension: 'moralAmbiguity', value: 5, confidence: 0.6 }
          ]
        },
        {
          id: 'q1-a3',
          text: 'I enjoy exploring morally ambiguous stories with no clear answers',
          mappings: [
            { dimension: 'moralAmbiguity', value: 9, confidence: 0.8 }
          ]
        }
      ],
      targetDimensions: ['moralAmbiguity'],
      stage: 1
    };
  });
  
  test('updateProfileFromQuestion should update profile correctly', () => {
    const updatedProfile = updateProfileFromQuestion(
      testProfile,
      testQuestion,
      'q1-a3' // Selecting the "morally ambiguous" option
    );
    
    // Verify profile was updated
    expect(updatedProfile).not.toBe(testProfile); // Should be a new object
    expect(updatedProfile.dimensions.moralAmbiguity).toBe(9); // Initial value from the option
    expect(updatedProfile.confidences.moralAmbiguity).toBeGreaterThan(0); // Should have some confidence
    expect(updatedProfile.answeredQuestions).toContain('q1');
    expect(updatedProfile.interactionCount).toBe(1);
  });
  
  test('updateProfileFromQuestion should blend new value with existing one', () => {
    // First set an initial value with medium confidence
    testProfile.dimensions.moralAmbiguity = 4;
    testProfile.confidences.moralAmbiguity = 0.5;
    
    const updatedProfile = updateProfileFromQuestion(
      testProfile,
      testQuestion,
      'q1-a3' // Selecting the "morally ambiguous" option (value 9, confidence 0.8)
    );
    
    // The updated value should be a weighted blend between 4 and 9,
    // biased toward 9 since it has higher confidence
    expect(updatedProfile.dimensions.moralAmbiguity).toBeGreaterThan(4);
    expect(updatedProfile.dimensions.moralAmbiguity).toBeLessThan(9);
    expect(updatedProfile.confidences.moralAmbiguity).toBeGreaterThan(0.5); // Confidence should increase
  });
  
  test('updateProfileFromAnimeFeedback should update profile based on liked anime', () => {
    const animeAttributes = {
      visualComplexity: 8,
      narrativeComplexity: 9,
      emotionalIntensity: 7
    };
    
    const updatedProfile = updateProfileFromAnimeFeedback(
      testProfile,
      animeAttributes,
      8, // High rating
      'rating'
    );
    
    // Profile should move toward the anime values
    expect(updatedProfile.dimensions.visualComplexity).toBeGreaterThan(0);
    expect(updatedProfile.dimensions.narrativeComplexity).toBeGreaterThan(0);
    expect(updatedProfile.dimensions.emotionalIntensity).toBeGreaterThan(0);
    
    // Confidences should increase but be lower than from direct questions
    expect(updatedProfile.confidences.visualComplexity).toBeGreaterThan(0);
    expect(updatedProfile.confidences.visualComplexity).toBeLessThan(0.5);
  });
  
  test('updateProfileFromAnimeFeedback should update profile based on disliked anime', () => {
    // First set some initial values
    testProfile.dimensions.visualComplexity = 5;
    testProfile.confidences.visualComplexity = 0.4;
    
    const animeAttributes = {
      visualComplexity: 9
    };
    
    const updatedProfile = updateProfileFromAnimeFeedback(
      testProfile,
      animeAttributes,
      2, // Low rating
      'rating'
    );
    
    // Should move away from the anime value of 9 (toward lower values)
    expect(updatedProfile.dimensions.visualComplexity).toBeLessThan(5);
  });
  
  test('generateProfileAdjustments should suggest profile changes', () => {
    // Set up a profile with some values
    testProfile.dimensions.visualComplexity = 3;
    testProfile.dimensions.narrativeComplexity = 4;
    testProfile.dimensions.emotionalIntensity = 2;
    
    // Create a list of rated anime that consistently have different values
    const ratedAnime = [
      {
        anime: {
          attributes: {
            visualComplexity: 8,
            narrativeComplexity: 8,
            emotionalIntensity: 3
          }
        },
        rating: 9
      },
      {
        anime: {
          attributes: {
            visualComplexity: 9,
            narrativeComplexity: 7,
            emotionalIntensity: 2
          }
        },
        rating: 8
      },
      {
        anime: {
          attributes: {
            visualComplexity: 7,
            narrativeComplexity: 9,
            emotionalIntensity: 3
          }
        },
        rating: 10
      }
    ];
    
    const adjustments = generateProfileAdjustments(testProfile, ratedAnime);
    
    // Should suggest adjustments for visual and narrative complexity
    expect(adjustments.length).toBeGreaterThan(0);
    
    // Find the visual complexity adjustment
    const visualAdjustment = adjustments.find(a => a.dimension === 'visualComplexity');
    if (visualAdjustment) {
      expect(visualAdjustment.suggestedValue).toBeGreaterThan(testProfile.dimensions.visualComplexity);
      expect(visualAdjustment.explanation).toBeTruthy();
    }
  });
});