/**
 * Question Bank
 *
 * This module defines the psychological profiling questions used to determine
 * user preferences and build their psychological profile.
 */

import type { Question, QuestionOption } from './types';

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
 * Get a set of empty sample questions (structure without mappings)
 */
export function getEmptySampleQuestions(): QuestionWithDimensions[] {
  return [
    {
      id: 'visual-style',
      type: 'image',
      text: 'Which visual style do you prefer in anime?',
      targetDimensions: ['visualComplexity', 'colorSaturation'],
      stage: 1,
      options: [
        { id: 'clean-simple', text: 'Clean and simple visuals, with emphasis on character expressions', mappings: [] },
        { id: 'balanced', text: 'Balanced visuals with moderate detail', mappings: [] },
        { id: 'detailed', text: 'Highly detailed and intricate visuals', mappings: [] },
        { id: 'dynamic', text: 'Dynamic and energetic visuals with lots of movement', mappings: [] }
      ]
    },
    {
      id: 'narrative-complexity',
      type: 'text',
      text: 'How do you feel about complex storylines?',
      targetDimensions: ['narrativeComplexity', 'plotPredictability'],
      stage: 1,
      options: [
        { id: 'low-complexity', text: 'I prefer straightforward stories that are easy to follow', mappings: [] },
        { id: 'medium-complexity', text: 'I enjoy some complexity but don\'t want to feel lost', mappings: [] },
        { id: 'high-complexity', text: 'I love intricate plots with multiple layers and twists', mappings: [] }
      ]
    },
    {
      id: 'character-depth',
      type: 'text',
      text: 'What kind of characters do you connect with most?',
      targetDimensions: ['characterComplexity', 'characterGrowth'],
      stage: 1,
      options: [
        { id: 'simple-characters', text: 'Clear, straightforward characters with defined traits', mappings: [] },
        { id: 'balanced-characters', text: 'Characters with some depth but still relatable', mappings: [] },
        { id: 'complex-characters', text: 'Deep, nuanced characters with internal conflicts and growth', mappings: [] }
      ]
    },
    {
      id: 'moral-ambiguity',
      type: 'scenario',
      text: 'In stories, do you prefer:',
      targetDimensions: ['moralAmbiguity'],
      stage: 2,
      options: [
        { id: 'clear-morals', text: 'Clear heroes and villains with defined moral boundaries', mappings: [] },
        { id: 'nuanced-morals', text: 'Characters with understandable motivations even when doing wrong', mappings: [] },
        { id: 'ambiguous', text: 'Morally ambiguous situations where right and wrong aren\'t clear', mappings: [] }
      ]
    },
    {
      id: 'emotional-tone',
      type: 'preference',
      text: 'Which emotional tone do you prefer in stories?',
      targetDimensions: ['emotionalValence', 'emotionalIntensity'],
      stage: 2,
      options: [
        { id: 'light-optimistic', text: 'Light and optimistic', mappings: [] },
        { id: 'exciting-uplifting', text: 'Exciting and uplifting', mappings: [] },
        { id: 'dark-serious', text: 'Dark and serious', mappings: [] },
        { id: 'bittersweet-reflective', text: 'Bittersweet and reflective', mappings: [] }
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
