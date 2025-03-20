/**
 * Question Bank
 *
 * This module defines the psychological profiling questions used to determine
 * user preferences and build their psychological profile.
 */

import type { Question, QuestionOption } from './types.js';

export interface QuestionWithDimensions extends Question {
  targetDimensions: string[];
}

// Initialize the question bank
const questions: QuestionWithDimensions[] = getQuestionBank();

// Export the questions array
export { questions };

/**
 * Get all questions in the question bank
 */
export function getQuestionBank(): QuestionWithDimensions[] {
  // Start with empty questions (structure only)
  const questions = getEmptySampleQuestions();

  // Fill in the question options with proper mappings
  return questions.map(question => {
    // Add psychological dimension mappings to options
    const filledOptions = question.options.map(option => {
      return {
        ...option,
        mappings: getMappingsForOption(question.id, option.id)
      };
    });

    return {
      ...question,
      options: filledOptions
    };
  });
}

/**
 * Get the mappings for a specific question option
 *
 * @param questionId The ID of the question
 * @param optionId The ID of the option
 * @returns Array of psychological dimension mappings
 */
function getMappingsForOption(
  questionId: string,
  optionId: string
): Array<{
  dimension: string;
  value: number;
  confidence: number;
}> {
  // Visual complexity question
  if (questionId === 'visual-style') {
    switch (optionId) {
      case 'clean-simple':
        return [
          { dimension: 'visualComplexity', value: 3, confidence: 0.7 },
          { dimension: 'colorSaturation', value: 4, confidence: 0.5 }
        ];
      case 'balanced':
        return [
          { dimension: 'visualComplexity', value: 5, confidence: 0.6 },
          { dimension: 'colorSaturation', value: 5, confidence: 0.5 }
        ];
      case 'detailed':
        return [
          { dimension: 'visualComplexity', value: 8, confidence: 0.7 },
          { dimension: 'colorSaturation', value: 6, confidence: 0.5 }
        ];
      case 'dynamic':
        return [
          { dimension: 'visualComplexity', value: 7, confidence: 0.7 },
          { dimension: 'colorSaturation', value: 7, confidence: 0.6 },
          { dimension: 'visualPace', value: 8, confidence: 0.7 }
        ];
      default:
        return [];
    }
  }

  // Narrative complexity question
  if (questionId === 'narrative-complexity') {
    switch (optionId) {
      case 'low-complexity':
        return [
          { dimension: 'narrativeComplexity', value: 3, confidence: 0.8 },
          { dimension: 'plotPredictability', value: 7, confidence: 0.6 }
        ];
      case 'medium-complexity':
        return [
          { dimension: 'narrativeComplexity', value: 6, confidence: 0.7 },
          { dimension: 'plotPredictability', value: 5, confidence: 0.6 }
        ];
      case 'high-complexity':
        return [
          { dimension: 'narrativeComplexity', value: 9, confidence: 0.8 },
          { dimension: 'plotPredictability', value: 3, confidence: 0.7 }
        ];
      default:
        return [];
    }
  }

  // Character depth question
  if (questionId === 'character-depth') {
    switch (optionId) {
      case 'simple-characters':
        return [
          { dimension: 'characterComplexity', value: 3, confidence: 0.7 },
          { dimension: 'characterGrowth', value: 3, confidence: 0.6 }
        ];
      case 'balanced-characters':
        return [
          { dimension: 'characterComplexity', value: 6, confidence: 0.6 },
          { dimension: 'characterGrowth', value: 5, confidence: 0.5 }
        ];
      case 'complex-characters':
        return [
          { dimension: 'characterComplexity', value: 9, confidence: 0.8 },
          { dimension: 'characterGrowth', value: 8, confidence: 0.7 }
        ];
      default:
        return [];
    }
  }

  // Moral ambiguity question
  if (questionId === 'moral-ambiguity') {
    switch (optionId) {
      case 'clear-morals':
        return [
          { dimension: 'moralAmbiguity', value: 2, confidence: 0.8 }
        ];
      case 'nuanced-morals':
        return [
          { dimension: 'moralAmbiguity', value: 6, confidence: 0.7 }
        ];
      case 'ambiguous':
        return [
          { dimension: 'moralAmbiguity', value: 9, confidence: 0.8 }
        ];
      default:
        return [];
    }
  }

  // Emotional tone question
  if (questionId === 'emotional-tone') {
    switch (optionId) {
      case 'light-optimistic':
        return [
          { dimension: 'emotionalValence', value: 4, confidence: 0.7 },
          { dimension: 'emotionalIntensity', value: 5, confidence: 0.6 }
        ];
      case 'exciting-uplifting':
        return [
          { dimension: 'emotionalValence', value: 3, confidence: 0.7 },
          { dimension: 'emotionalIntensity', value: 8, confidence: 0.7 }
        ];
      case 'dark-serious':
        return [
          { dimension: 'emotionalValence', value: -3, confidence: 0.8 },
          { dimension: 'emotionalIntensity', value: 7, confidence: 0.7 }
        ];
      case 'bittersweet-reflective':
        return [
          { dimension: 'emotionalValence', value: 0, confidence: 0.6 },
          { dimension: 'emotionalIntensity', value: 6, confidence: 0.6 }
        ];
      default:
        return [];
    }
  }

  // If we don't recognize the question, return empty mappings
  return [];
}

/**
 * Get a comprehensive set of questions for the questionnaire
 */
export function getEmptySampleQuestions(): QuestionWithDimensions[] {
  return [
    // Stage 1 Questions - Basic visual preferences
    {
      id: 'visual_complexity_1',
      type: 'text',
      text: 'How do you prefer visual storytelling?',
      stage: 1,
      targetDimensions: ['visualComplexity', 'colorSaturation'],
      options: [
        {
          id: 'simple',
          text: 'Clean and minimalist',
          mappings: [
            { dimension: 'visualComplexity', value: 3, confidence: 0.7 },
            { dimension: 'colorSaturation', value: 4, confidence: 0.6 }
          ]
        },
        {
          id: 'balanced',
          text: 'Balanced detail',
          mappings: [
            { dimension: 'visualComplexity', value: 5, confidence: 0.7 },
            { dimension: 'colorSaturation', value: 5, confidence: 0.6 }
          ]
        },
        {
          id: 'detailed',
          text: 'Rich and detailed',
          mappings: [
            { dimension: 'visualComplexity', value: 8, confidence: 0.7 },
            { dimension: 'colorSaturation', value: 7, confidence: 0.6 }
          ]
        }
      ]
    },
    {
      id: 'color_palette_1',
      type: 'image',
      text: 'Which color palette do you find most appealing?',
      stage: 1,
      targetDimensions: ['colorSaturation', 'visualComplexity'],
      options: [
        {
          id: 'muted',
          text: 'Muted and subtle',
          imageUrl: 'https://dummyimage.com/600x400/b3b3b3,f5f5f5,dad7cd,adb5bd,7d8597/ffffff&text=Muted+Colors',
          mappings: [
            { dimension: 'colorSaturation', value: 3, confidence: 0.7 },
            { dimension: 'visualComplexity', value: 4, confidence: 0.5 }
          ]
        },
        {
          id: 'balanced_colors',
          text: 'Balanced, natural',
          imageUrl: 'https://dummyimage.com/600x400/588157,3a5a40,a3b18a,dad7cd,97ba91/ffffff&text=Natural+Colors',
          mappings: [
            { dimension: 'colorSaturation', value: 5, confidence: 0.7 },
            { dimension: 'visualComplexity', value: 5, confidence: 0.5 }
          ]
        },
        {
          id: 'vibrant',
          text: 'Vibrant and colorful',
          imageUrl: 'https://dummyimage.com/600x400/f94144,f3722c,f8961e,f9c74f,90be6d,43aa8b,577590/ffffff&text=Vibrant+Colors',
          mappings: [
            { dimension: 'colorSaturation', value: 8, confidence: 0.7 },
            { dimension: 'visualComplexity', value: 7, confidence: 0.5 }
          ]
        }
      ]
    },
    {
      id: 'animation_style_1',
      type: 'text',
      text: 'Which visual style appeals to you most?',
      stage: 1,
      targetDimensions: ['visualPace', 'visualComplexity'],
      options: [
        {
          id: 'fluid_realistic',
          text: 'Fluid and realistic movement',
          mappings: [
            { dimension: 'visualPace', value: 6, confidence: 0.7 },
            { dimension: 'visualComplexity', value: 7, confidence: 0.6 }
          ]
        },
        {
          id: 'stylized',
          text: 'Stylized and expressive',
          mappings: [
            { dimension: 'visualPace', value: 8, confidence: 0.7 },
            { dimension: 'visualComplexity', value: 6, confidence: 0.6 }
          ]
        },
        {
          id: 'detailed_precise',
          text: 'Detailed and precise',
          mappings: [
            { dimension: 'visualPace', value: 5, confidence: 0.7 },
            { dimension: 'visualComplexity', value: 9, confidence: 0.6 }
          ]
        }
      ]
    },

    // Stage 1 Questions - Basic narrative preferences
    {
      id: 'narrative_complexity_1',
      type: 'text',
      text: 'What kind of story complexity do you enjoy?',
      stage: 1,
      targetDimensions: ['narrativeComplexity', 'plotPredictability'],
      options: [
        {
          id: 'straightforward',
          text: 'Simple and straightforward',
          mappings: [
            { dimension: 'narrativeComplexity', value: 3, confidence: 0.7 },
            { dimension: 'plotPredictability', value: 7, confidence: 0.6 }
          ]
        },
        {
          id: 'moderate',
          text: 'Moderately complex',
          mappings: [
            { dimension: 'narrativeComplexity', value: 6, confidence: 0.7 },
            { dimension: 'plotPredictability', value: 5, confidence: 0.6 }
          ]
        },
        {
          id: 'complex',
          text: 'Complex and layered',
          mappings: [
            { dimension: 'narrativeComplexity', value: 9, confidence: 0.7 },
            { dimension: 'plotPredictability', value: 3, confidence: 0.6 }
          ]
        }
      ]
    },
    {
      id: 'pacing_preference_1', 
      type: 'text',
      text: 'How do you prefer the pacing of a story?',
      stage: 1,
      targetDimensions: ['narrativePace', 'emotionalIntensity'],
      options: [
        {
          id: 'slow_thoughtful',
          text: 'Slow and thoughtful',
          mappings: [
            { dimension: 'narrativePace', value: 3, confidence: 0.8 },
            { dimension: 'emotionalIntensity', value: 5, confidence: 0.6 }
          ]
        },
        {
          id: 'balanced_pacing',
          text: 'Balanced pacing',
          mappings: [
            { dimension: 'narrativePace', value: 5, confidence: 0.7 },
            { dimension: 'emotionalIntensity', value: 6, confidence: 0.5 }
          ]
        },
        {
          id: 'fast_exciting',
          text: 'Fast and exciting',
          mappings: [
            { dimension: 'narrativePace', value: 8, confidence: 0.8 },
            { dimension: 'emotionalIntensity', value: 7, confidence: 0.6 }
          ]
        }
      ]
    },
    {
      id: 'plot_predictability_1',
      type: 'text',
      text: 'How do you feel about plot predictability?',
      stage: 1,
      targetDimensions: ['plotPredictability', 'narrativeComplexity'],
      options: [
        {
          id: 'comfort_predictability',
          text: 'I enjoy familiar, comforting stories',
          mappings: [
            { dimension: 'plotPredictability', value: 8, confidence: 0.7 },
            { dimension: 'narrativeComplexity', value: 4, confidence: 0.6 }
          ]
        },
        {
          id: 'balanced_surprise',
          text: 'I like some surprises but appreciate familiar elements',
          mappings: [
            { dimension: 'plotPredictability', value: 5, confidence: 0.7 },
            { dimension: 'narrativeComplexity', value: 6, confidence: 0.6 }
          ]
        },
        {
          id: 'unexpected_twists',
          text: 'I love unexpected twists and surprises',
          mappings: [
            { dimension: 'plotPredictability', value: 2, confidence: 0.7 },
            { dimension: 'narrativeComplexity', value: 8, confidence: 0.6 }
          ]
        }
      ]
    },

    // Stage 1 Questions - Basic emotional preferences
    {
      id: 'emotional_intensity_1',
      type: 'text',
      text: 'How emotionally intense do you like your entertainment?',
      stage: 1,
      targetDimensions: ['emotionalIntensity', 'emotionalValence'],
      options: [
        {
          id: 'mild',
          text: 'Mild and gentle',
          mappings: [
            { dimension: 'emotionalIntensity', value: 3, confidence: 0.7 },
            { dimension: 'emotionalValence', value: 2, confidence: 0.6 }
          ]
        },
        {
          id: 'moderate',
          text: 'Moderately emotional',
          mappings: [
            { dimension: 'emotionalIntensity', value: 6, confidence: 0.7 },
            { dimension: 'emotionalValence', value: 0, confidence: 0.6 }
          ]
        },
        {
          id: 'intense',
          text: 'Very emotional and intense',
          mappings: [
            { dimension: 'emotionalIntensity', value: 9, confidence: 0.7 },
            { dimension: 'emotionalValence', value: -1, confidence: 0.5 }
          ]
        }
      ]
    },
    {
      id: 'emotional_tone_1',
      type: 'text',
      text: 'What emotional tone do you prefer in stories?',
      stage: 1,
      targetDimensions: ['emotionalValence', 'moralAmbiguity'],
      options: [
        {
          id: 'light_hearted',
          text: 'Light-hearted and uplifting',
          mappings: [
            { dimension: 'emotionalValence', value: 4, confidence: 0.8 },
            { dimension: 'moralAmbiguity', value: 3, confidence: 0.6 }
          ]
        },
        {
          id: 'balanced_tone',
          text: 'Balanced with both light and dark moments',
          mappings: [
            { dimension: 'emotionalValence', value: 0, confidence: 0.7 },
            { dimension: 'moralAmbiguity', value: 5, confidence: 0.6 }
          ]
        },
        {
          id: 'dark_serious',
          text: 'Dark and serious',
          mappings: [
            { dimension: 'emotionalValence', value: -4, confidence: 0.8 },
            { dimension: 'moralAmbiguity', value: 7, confidence: 0.6 }
          ]
        }
      ]
    },

    // Stage 2 Questions - Character preferences
    {
      id: 'character_complexity_1',
      type: 'text',
      text: 'How complex do you like your characters?',
      stage: 2,
      targetDimensions: ['characterComplexity', 'characterGrowth'],
      options: [
        {
          id: 'simple_clear',
          text: 'Simple and easy to understand',
          mappings: [
            { dimension: 'characterComplexity', value: 3, confidence: 0.7 },
            { dimension: 'characterGrowth', value: 4, confidence: 0.6 }
          ]
        },
        {
          id: 'moderate_depth',
          text: 'Moderate depth with some complexity',
          mappings: [
            { dimension: 'characterComplexity', value: 6, confidence: 0.7 },
            { dimension: 'characterGrowth', value: 6, confidence: 0.6 }
          ]
        },
        {
          id: 'deep_nuanced',
          text: 'Deep and nuanced with many layers',
          mappings: [
            { dimension: 'characterComplexity', value: 9, confidence: 0.7 },
            { dimension: 'characterGrowth', value: 8, confidence: 0.6 }
          ]
        }
      ]
    },
    {
      id: 'character_growth_1',
      type: 'text',
      text: 'How important is character development to you?',
      stage: 2,
      targetDimensions: ['characterGrowth', 'narrativeComplexity'],
      options: [
        {
          id: 'minimal_growth',
          text: 'I prefer consistent, reliable characters',
          mappings: [
            { dimension: 'characterGrowth', value: 3, confidence: 0.8 },
            { dimension: 'narrativeComplexity', value: 4, confidence: 0.6 }
          ]
        },
        {
          id: 'moderate_growth',
          text: 'Some growth is good but not the main focus',
          mappings: [
            { dimension: 'characterGrowth', value: 6, confidence: 0.7 },
            { dimension: 'narrativeComplexity', value: 5, confidence: 0.6 }
          ]
        },
        {
          id: 'significant_growth',
          text: 'Significant growth and evolution is essential',
          mappings: [
            { dimension: 'characterGrowth', value: 9, confidence: 0.8 },
            { dimension: 'narrativeComplexity', value: 7, confidence: 0.6 }
          ]
        }
      ]
    },
    {
      id: 'moral_complexity_1',
      type: 'text',
      text: 'How do you prefer moral issues to be handled?',
      stage: 2,
      targetDimensions: ['moralAmbiguity', 'characterComplexity'],
      options: [
        {
          id: 'clear_morality',
          text: 'Clear distinction between right and wrong',
          mappings: [
            { dimension: 'moralAmbiguity', value: 2, confidence: 0.8 },
            { dimension: 'characterComplexity', value: 4, confidence: 0.6 }
          ]
        },
        {
          id: 'some_nuance',
          text: 'Some moral gray areas but clear values',
          mappings: [
            { dimension: 'moralAmbiguity', value: 5, confidence: 0.7 },
            { dimension: 'characterComplexity', value: 6, confidence: 0.6 }
          ]
        },
        {
          id: 'complex_morality',
          text: 'Complex moral questions with no easy answers',
          mappings: [
            { dimension: 'moralAmbiguity', value: 9, confidence: 0.8 },
            { dimension: 'characterComplexity', value: 8, confidence: 0.6 }
          ]
        }
      ]
    },

    // Stage 2 Questions - Intellectual vs Emotional
    {
      id: 'intellectual_vs_emotional_1',
      type: 'text',
      text: 'Do you prefer shows that are more intellectual or emotional?',
      stage: 2,
      targetDimensions: ['intellectualEmotional', 'narrativeComplexity'],
      options: [
        {
          id: 'intellectual',
          text: 'Intellectually stimulating with concepts to think about',
          mappings: [
            { dimension: 'intellectualEmotional', value: 4, confidence: 0.7 },
            { dimension: 'narrativeComplexity', value: 7, confidence: 0.6 }
          ]
        },
        {
          id: 'balanced_int_emo',
          text: 'Balance of intellectual concepts and emotional storytelling',
          mappings: [
            { dimension: 'intellectualEmotional', value: 0, confidence: 0.6 },
            { dimension: 'narrativeComplexity', value: 6, confidence: 0.5 }
          ]
        },
        {
          id: 'emotional',
          text: 'Emotionally resonant stories that make me feel deeply',
          mappings: [
            { dimension: 'intellectualEmotional', value: -4, confidence: 0.7 },
            { dimension: 'emotionalIntensity', value: 8, confidence: 0.6 }
          ]
        }
      ]
    },

    // Stage 2 Questions - Fantasy vs Realism
    {
      id: 'fantasy_vs_realism_1',
      type: 'text',
      text: 'What kind of world do you find most compelling in stories?',
      stage: 2,
      targetDimensions: ['fantasyRealism', 'visualComplexity'],
      options: [
        {
          id: 'pure_fantasy',
          text: 'Complete fantasy and imagination',
          mappings: [
            { dimension: 'fantasyRealism', value: 4, confidence: 0.8 },
            { dimension: 'visualComplexity', value: 7, confidence: 0.6 }
          ]
        },
        {
          id: 'blend',
          text: 'A blend of fantasy elements in realistic settings',
          mappings: [
            { dimension: 'fantasyRealism', value: 1, confidence: 0.7 },
            { dimension: 'visualComplexity', value: 6, confidence: 0.6 }
          ]
        },
        {
          id: 'grounded_realism',
          text: 'Grounded in reality',
          mappings: [
            { dimension: 'fantasyRealism', value: -4, confidence: 0.8 },
            { dimension: 'visualComplexity', value: 5, confidence: 0.6 }
          ]
        }
      ]
    },

    // Stage 3 Questions - Scenario based
    {
      id: 'scenario_moral_dilemma_1',
      type: 'scenario',
      text: 'A character must choose between saving one person they love or many strangers. Which outcome would you find more compelling?',
      stage: 3,
      targetDimensions: ['moralAmbiguity', 'emotionalIntensity'],
      options: [
        {
          id: 'save_loved_one',
          text: 'They choose their loved one, exploring the personal cost of that choice',
          mappings: [
            { dimension: 'moralAmbiguity', value: 8, confidence: 0.7 },
            { dimension: 'emotionalIntensity', value: 8, confidence: 0.7 }
          ]
        },
        {
          id: 'save_many',
          text: 'They sacrifice their personal happiness for the greater good',
          mappings: [
            { dimension: 'moralAmbiguity', value: 5, confidence: 0.7 },
            { dimension: 'emotionalValence', value: -2, confidence: 0.6 }
          ]
        },
        {
          id: 'find_third_way',
          text: 'They find a creative solution to save everyone',
          mappings: [
            { dimension: 'moralAmbiguity', value: 3, confidence: 0.7 },
            { dimension: 'emotionalValence', value: 3, confidence: 0.6 }
          ]
        }
      ]
    },
    {
      id: 'scenario_plot_twist_1',
      type: 'scenario',
      text: 'How would you prefer a major plot twist to be handled?',
      stage: 3,
      targetDimensions: ['plotPredictability', 'narrativeComplexity'],
      options: [
        {
          id: 'foreshadowed',
          text: 'Carefully foreshadowed so attentive viewers might guess it',
          mappings: [
            { dimension: 'plotPredictability', value: 6, confidence: 0.7 },
            { dimension: 'narrativeComplexity', value: 7, confidence: 0.7 }
          ]
        },
        {
          id: 'partial_hints',
          text: 'Some subtle hints but still surprising',
          mappings: [
            { dimension: 'plotPredictability', value: 4, confidence: 0.7 },
            { dimension: 'narrativeComplexity', value: 8, confidence: 0.7 }
          ]
        },
        {
          id: 'complete_surprise',
          text: 'Completely unexpected for maximum shock value',
          mappings: [
            { dimension: 'plotPredictability', value: 1, confidence: 0.7 },
            { dimension: 'narrativeComplexity', value: 6, confidence: 0.6 }
          ]
        }
      ]
    },
    {
      id: 'scenario_character_conflict_1',
      type: 'scenario',
      text: 'What type of character conflict interests you most?',
      stage: 3,
      targetDimensions: ['characterComplexity', 'moralAmbiguity'],
      options: [
        {
          id: 'external_conflict',
          text: 'Characters facing external threats or villains',
          mappings: [
            { dimension: 'characterComplexity', value: 5, confidence: 0.6 },
            { dimension: 'moralAmbiguity', value: 4, confidence: 0.6 }
          ]
        },
        {
          id: 'interpersonal_conflict',
          text: 'Conflicts between characters with different goals',
          mappings: [
            { dimension: 'characterComplexity', value: 7, confidence: 0.7 },
            { dimension: 'moralAmbiguity', value: 7, confidence: 0.6 }
          ]
        },
        {
          id: 'internal_conflict',
          text: 'Internal struggles within a character\'s own mind',
          mappings: [
            { dimension: 'characterComplexity', value: 9, confidence: 0.8 },
            { dimension: 'moralAmbiguity', value: 8, confidence: 0.7 }
          ]
        }
      ]
    },

    // Stage 3 Questions - Preference based
    {
      id: 'preference_endings_1',
      type: 'preference',
      text: 'What type of ending do you prefer?',
      stage: 3,
      targetDimensions: ['emotionalValence', 'plotPredictability'],
      options: [
        {
          id: 'happy_ending',
          text: 'Happy and satisfying',
          mappings: [
            { dimension: 'emotionalValence', value: 4, confidence: 0.7 },
            { dimension: 'plotPredictability', value: 7, confidence: 0.6 }
          ]
        },
        {
          id: 'bittersweet',
          text: 'Bittersweet with both triumph and loss',
          mappings: [
            { dimension: 'emotionalValence', value: 0, confidence: 0.7 },
            { dimension: 'plotPredictability', value: 5, confidence: 0.6 }
          ]
        },
        {
          id: 'ambiguous',
          text: 'Open to interpretation',
          mappings: [
            { dimension: 'emotionalValence', value: -1, confidence: 0.6 },
            { dimension: 'plotPredictability', value: 3, confidence: 0.7 }
          ]
        },
        {
          id: 'tragic',
          text: 'Tragic but meaningful',
          mappings: [
            { dimension: 'emotionalValence', value: -3, confidence: 0.7 },
            { dimension: 'emotionalIntensity', value: 9, confidence: 0.7 }
          ]
        }
      ]
    },
    {
      id: 'preference_novelty_familiarity_1',
      type: 'preference',
      text: 'Do you prefer novel concepts or familiar tropes?',
      stage: 3,
      targetDimensions: ['noveltyFamiliarity', 'narrativeComplexity'],
      options: [
        {
          id: 'completely_novel',
          text: 'Completely new and innovative ideas',
          mappings: [
            { dimension: 'noveltyFamiliarity', value: 4, confidence: 0.7 },
            { dimension: 'narrativeComplexity', value: 8, confidence: 0.6 }
          ]
        },
        {
          id: 'fresh_takes',
          text: 'Fresh takes on established ideas',
          mappings: [
            { dimension: 'noveltyFamiliarity', value: 2, confidence: 0.7 },
            { dimension: 'narrativeComplexity', value: 6, confidence: 0.6 }
          ]
        },
        {
          id: 'familiar_comforting',
          text: 'Familiar and comforting tropes executed well',
          mappings: [
            { dimension: 'noveltyFamiliarity', value: -3, confidence: 0.7 },
            { dimension: 'narrativeComplexity', value: 4, confidence: 0.6 }
          ]
        }
      ]
    },

    // Image-based questions
    {
      id: 'visual_preference_images_1',
      type: 'image',
      text: 'Which visual art style connects with you the most?',
      stage: 2,
      targetDimensions: ['visualComplexity', 'colorSaturation'],
      options: [
        {
          id: 'minimalist_style',
          text: 'Minimalist style',
          imageUrl: 'https://dummyimage.com/600x400/f5f5f5/333333&text=Clean,+Simple+Lines',
          mappings: [
            { dimension: 'visualComplexity', value: 3, confidence: 0.7 },
            { dimension: 'colorSaturation', value: 4, confidence: 0.7 }
          ]
        },
        {
          id: 'detailed_fantasy',
          text: 'Rich, detailed fantasy',
          imageUrl: 'https://dummyimage.com/600x400/8a2be2,7b68ee,9370db,ba55d3/ffffff&text=Detailed+Fantasy+World',
          mappings: [
            { dimension: 'visualComplexity', value: 8, confidence: 0.7 },
            { dimension: 'colorSaturation', value: 7, confidence: 0.7 }
          ]
        },
        {
          id: 'realistic_style',
          text: 'Realistic portrayal',
          imageUrl: 'https://dummyimage.com/600x400/2f4f4f,696969,778899,a9a9a9/ffffff&text=Realistic+Portrayal',
          mappings: [
            { dimension: 'visualComplexity', value: 7, confidence: 0.7 },
            { dimension: 'colorSaturation', value: 5, confidence: 0.7 }
          ]
        },
        {
          id: 'abstract_expressive',
          text: 'Bold and expressive',
          imageUrl: 'https://dummyimage.com/600x400/ff4500,ff6347,ff7f50,ff8c00,ffa500/ffffff&text=Bold+Expression',
          mappings: [
            { dimension: 'visualComplexity', value: 6, confidence: 0.7 },
            { dimension: 'colorSaturation', value: 8, confidence: 0.7 }
          ]
        }
      ]
    }
  ];
}

/**
 * Get a question from the question bank by ID
 *
 * @param questions Array of questions to search
 * @param questionId The ID of the question to find
 * @returns The question or undefined if not found
 */
export function getSampleQuestionById(
  questions: QuestionWithDimensions[],
  questionId: string
): QuestionWithDimensions | undefined {
  return questions.find(q => q.id === questionId);
}

/**
 * Select the next question to ask based on the user's profile
 *
 * @param userProfile The user's current profile
 * @param answeredIds IDs of questions already answered
 * @returns The next question to ask
 */
export function selectNextQuestion(
  userProfile: import('./types').Profile,
  answeredIds: string[] = []
): QuestionWithDimensions | null {
  const allQuestions = getQuestionBank();

  // Filter out already answered questions
  const unansweredQuestions = allQuestions.filter(
    q => !answeredIds.includes(q.id) && !userProfile.answeredQuestions.includes(q.id)
  );

  if (unansweredQuestions.length === 0) {
    return null;
  }

  // Find dimensions with lowest confidence
  const confidences = userProfile.confidences || {};
  const dimensionConfidences: Array<{ dimension: string; confidence: number }> =
    Object.entries(confidences).map(([dimension, confidence]) => ({
      dimension,
      confidence: confidence || 0
    }));

  // Sort by confidence (ascending)
  dimensionConfidences.sort((a, b) => a.confidence - b.confidence);

  // Get low-confidence dimensions to target
  const targetDimensions = dimensionConfidences
    .filter(d => d.confidence < 0.5)
    .map(d => d.dimension)
    .slice(0, 3);

  // If we have low-confidence dimensions, prioritize questions targeting them
  if (targetDimensions.length > 0) {
    // Find questions that target these dimensions
    const targetingQuestions = unansweredQuestions.filter(q =>
      q.targetDimensions.some(d => targetDimensions.includes(d))
    );

    if (targetingQuestions.length > 0) {
      // Get random question from targeting questions
      return targetingQuestions[Math.floor(Math.random() * targetingQuestions.length)];
    }
  }

  // If no targeting questions or no low-confidence dimensions,
  // get a question from the earliest stage that hasn't been completed
  const stages = Array.from(new Set(unansweredQuestions.map(q => q.stage))).sort();

  if (stages.length > 0) {
    const earliestStage = stages[0];
    const stageQuestions = unansweredQuestions.filter(q => q.stage === earliestStage);

    // Get random question from stage
    return stageQuestions[Math.floor(Math.random() * stageQuestions.length)];
  }

  // If all else fails, return a random unanswered question
  return unansweredQuestions[Math.floor(Math.random() * unansweredQuestions.length)];
}
