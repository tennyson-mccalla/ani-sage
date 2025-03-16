// Question Bank for Psychological Anime Recommendation System
//
// This file defines the structure and content of the psychological questions
// used to build the user profile without directly referencing anime.

import type { 
  PsychologicalDimension,
  DimensionSet,
  Question,
  QuestionOption,
  OptionMapping
} from './data-models';

// Define our core psychological dimensions
const DIMENSIONS: DimensionSet = {
  // Visual and aesthetic preferences
  visualComplexity: { 
    min: 0, 
    max: 10, 
    description: "Preference for visual complexity vs. simplicity",
    importance: 0.75
  },
  colorSaturation: { 
    min: 0, 
    max: 10, 
    description: "Preference for vibrant vs. muted colors",
    importance: 0.70
  },
  visualPace: { 
    min: 0, 
    max: 10, 
    description: "Preference for rapid visual changes vs. steady imagery",
    importance: 0.80
  },
  
  // Narrative preferences
  narrativeComplexity: { 
    min: 0, 
    max: 10, 
    description: "Preference for complex vs. straightforward narratives",
    importance: 0.85
  },
  narrativePace: { 
    min: 0, 
    max: 10, 
    description: "Preference for fast vs. slow story development",
    importance: 0.80
  },
  plotPredictability: { 
    min: 0, 
    max: 10, 
    description: "Preference for predictable vs. unpredictable developments",
    importance: 0.75
  },
  
  // Character preferences
  characterComplexity: { 
    min: 0, 
    max: 10, 
    description: "Preference for complex vs. archetypal characters",
    importance: 0.90
  },
  characterGrowth: { 
    min: 0, 
    max: 10, 
    description: "Importance of character development",
    importance: 0.85
  },
  
  // Emotional preferences
  emotionalIntensity: { 
    min: 0, 
    max: 10, 
    description: "Preference for intense vs. subdued emotions",
    importance: 0.80
  },
  emotionalValence: { 
    min: -5, 
    max: 5, 
    description: "Preference for positive vs. negative emotions",
    importance: 0.75
  },
  
  // Thematic preferences
  moralAmbiguity: { 
    min: 0, 
    max: 10, 
    description: "Tolerance for moral ambiguity",
    importance: 0.70
  },
  fantasyRealism: { 
    min: -5, 
    max: 5, 
    description: "Preference for fantasy vs. realism",
    importance: 0.85
  },
  
  // Relationship with content
  intellectualEmotional: { 
    min: -5, 
    max: 5, 
    description: "Intellectual vs. emotional engagement",
    importance: 0.70
  },
  noveltyFamiliarity: { 
    min: -5, 
    max: 5, 
    description: "Preference for novel vs. familiar content",
    importance: 0.65
  }
};

// Questions organized by stages
const questions: Question[] = [
  // ============== STAGE 1: Initial Broad Assessment ==============
  {
    id: "q1_visual_preference",
    type: "image",
    text: "Which image appeals to you most?",
    options: [
      {
        id: "v1_simple",
        text: "Image A",
        // Simple, clean, minimalist image
        imageUrl: "/assets/questions/visual/minimal.jpg",
        mappings: [
          { dimension: "visualComplexity", value: 2, confidence: 0.8 },
          { dimension: "colorSaturation", value: 3, confidence: 0.7 }
        ]
      },
      {
        id: "v1_complex",
        text: "Image B",
        // Detailed, ornate, complex image
        imageUrl: "/assets/questions/visual/complex.jpg",
        mappings: [
          { dimension: "visualComplexity", value: 8, confidence: 0.8 },
          { dimension: "colorSaturation", value: 7, confidence: 0.7 }
        ]
      },
      {
        id: "v1_vibrant",
        text: "Image C",
        // Vibrant, colorful, energetic image
        imageUrl: "/assets/questions/visual/vibrant.jpg",
        mappings: [
          { dimension: "visualComplexity", value: 6, confidence: 0.7 },
          { dimension: "colorSaturation", value: 9, confidence: 0.9 },
          { dimension: "emotionalValence", value: 3, confidence: 0.6 }
        ]
      },
      {
        id: "v1_muted",
        text: "Image D",
        // Muted, atmospheric, moody image
        imageUrl: "/assets/questions/visual/muted.jpg",
        mappings: [
          { dimension: "visualComplexity", value: 5, confidence: 0.7 },
          { dimension: "colorSaturation", value: 2, confidence: 0.8 },
          { dimension: "emotionalValence", value: -2, confidence: 0.6 }
        ]
      }
    ],
    targetDimensions: ["visualComplexity", "colorSaturation", "emotionalValence"],
    stage: 1
  },
  
  {
    id: "q1_scenario_approach",
    type: "scenario",
    text: "You discover an unusual door that wasn't there before. What do you do?",
    options: [
      {
        id: "s1_explore",
        text: "Open it immediately and walk through",
        mappings: [
          { dimension: "narrativePace", value: 8, confidence: 0.8 },
          { dimension: "noveltyFamiliarity", value: 4, confidence: 0.7 },
          { dimension: "plotPredictability", value: 2, confidence: 0.8 }
        ]
      },
      {
        id: "s1_cautious",
        text: "Examine the door carefully before deciding",
        mappings: [
          { dimension: "narrativePace", value: 4, confidence: 0.7 },
          { dimension: "narrativeComplexity", value: 7, confidence: 0.6 },
          { dimension: "plotPredictability", value: 6, confidence: 0.7 }
        ]
      },
      {
        id: "s1_research",
        text: "Research if others have encountered similar doors",
        mappings: [
          { dimension: "narrativePace", value: 2, confidence: 0.8 },
          { dimension: "intellectualEmotional", value: 4, confidence: 0.9 },
          { dimension: "narrativeComplexity", value: 8, confidence: 0.7 }
        ]
      },
      {
        id: "s1_ignore",
        text: "Leave it alone, it could be dangerous",
        mappings: [
          { dimension: "narrativePace", value: 3, confidence: 0.6 },
          { dimension: "noveltyFamiliarity", value: -3, confidence: 0.8 },
          { dimension: "emotionalValence", value: -2, confidence: 0.6 }
        ]
      }
    ],
    targetDimensions: ["narrativePace", "noveltyFamiliarity", "plotPredictability", "narrativeComplexity"],
    stage: 1
  },
  
  // ============== STAGE 2: Character & Relationship Assessment ==============
  {
    id: "q2_character_preference",
    type: "preference",
    text: "What quality do you find most compelling in a protagonist?",
    options: [
      {
        id: "c1_growth",
        text: "Someone who transforms and grows throughout their journey",
        mappings: [
          { dimension: "characterGrowth", value: 9, confidence: 0.9 },
          { dimension: "characterComplexity", value: 7, confidence: 0.8 },
          { dimension: "moralAmbiguity", value: 5, confidence: 0.6 }
        ]
      },
      {
        id: "c1_consistent",
        text: "Someone with unwavering principles who stays true to themselves",
        mappings: [
          { dimension: "characterGrowth", value: 3, confidence: 0.7 },
          { dimension: "characterComplexity", value: 5, confidence: 0.7 },
          { dimension: "moralAmbiguity", value: 2, confidence: 0.8 }
        ]
      },
      {
        id: "c1_flawed",
        text: "Someone with significant flaws who struggles with their nature",
        mappings: [
          { dimension: "characterGrowth", value: 7, confidence: 0.8 },
          { dimension: "characterComplexity", value: 9, confidence: 0.9 },
          { dimension: "moralAmbiguity", value: 8, confidence: 0.8 }
        ]
      },
      {
        id: "c1_exceptional",
        text: "Someone with extraordinary abilities who inspires others",
        mappings: [
          { dimension: "characterGrowth", value: 5, confidence: 0.7 },
          { dimension: "characterComplexity", value: 4, confidence: 0.6 },
          { dimension: "emotionalValence", value: 3, confidence: 0.8 }
        ]
      }
    ],
    targetDimensions: ["characterGrowth", "characterComplexity", "moralAmbiguity"],
    stage: 2
  },
  
  // ============== STAGE 3: Emotional & Thematic Preferences ==============
  {
    id: "q3_emotional_preference",
    type: "preference",
    text: "What feeling do you most want to experience from a story?",
    options: [
      {
        id: "e1_excitement",
        text: "Excitement and exhilaration",
        mappings: [
          { dimension: "emotionalIntensity", value: 8, confidence: 0.9 },
          { dimension: "emotionalValence", value: 3, confidence: 0.7 },
          { dimension: "visualPace", value: 8, confidence: 0.6 }
        ]
      },
      {
        id: "e1_wonder",
        text: "Wonder and fascination",
        mappings: [
          { dimension: "emotionalIntensity", value: 6, confidence: 0.8 },
          { dimension: "emotionalValence", value: 4, confidence: 0.8 },
          { dimension: "fantasyRealism", value: 3, confidence: 0.7 }
        ]
      },
      {
        id: "e1_reflection",
        text: "Thoughtful reflection",
        mappings: [
          { dimension: "emotionalIntensity", value: 4, confidence: 0.7 },
          { dimension: "intellectualEmotional", value: 4, confidence: 0.9 },
          { dimension: "narrativePace", value: 3, confidence: 0.7 }
        ]
      },
      {
        id: "e1_catharsis",
        text: "Deep emotional catharsis",
        mappings: [
          { dimension: "emotionalIntensity", value: 9, confidence: 0.9 },
          { dimension: "emotionalValence", value: -1, confidence: 0.7 },
          { dimension: "intellectualEmotional", value: -3, confidence: 0.8 }
        ]
      }
    ],
    targetDimensions: ["emotionalIntensity", "emotionalValence", "intellectualEmotional"],
    stage: 3
  },
  
  // ============== STAGE 4: Visual Preferences Refinement ==============
  {
    id: "q4_color_palette",
    type: "color",
    text: "Which color palette do you find most appealing?",
    options: [
      {
        id: "cp1_vivid",
        text: "Palette A",
        imageUrl: "/assets/questions/colors/vivid.jpg",
        mappings: [
          { dimension: "colorSaturation", value: 9, confidence: 0.9 },
          { dimension: "emotionalValence", value: 3, confidence: 0.7 },
          { dimension: "emotionalIntensity", value: 7, confidence: 0.6 }
        ]
      },
      {
        id: "cp1_pastel",
        text: "Palette B",
        imageUrl: "/assets/questions/colors/pastel.jpg",
        mappings: [
          { dimension: "colorSaturation", value: 5, confidence: 0.8 },
          { dimension: "emotionalValence", value: 4, confidence: 0.8 },
          { dimension: "emotionalIntensity", value: 3, confidence: 0.7 }
        ]
      },
      {
        id: "cp1_dark",
        text: "Palette C",
        imageUrl: "/assets/questions/colors/dark.jpg",
        mappings: [
          { dimension: "colorSaturation", value: 4, confidence: 0.8 },
          { dimension: "emotionalValence", value: -3, confidence: 0.7 },
          { dimension: "emotionalIntensity", value: 6, confidence: 0.8 }
        ]
      },
      {
        id: "cp1_muted",
        text: "Palette D",
        imageUrl: "/assets/questions/colors/muted.jpg",
        mappings: [
          { dimension: "colorSaturation", value: 2, confidence: 0.9 },
          { dimension: "emotionalValence", value: -1, confidence: 0.7 },
          { dimension: "emotionalIntensity", value: 4, confidence: 0.6 }
        ]
      }
    ],
    targetDimensions: ["colorSaturation", "emotionalValence", "emotionalIntensity"],
    prerequisiteScore: [
      { dimension: "colorSaturation", minValue: 0, maxValue: 10 }  // All users qualify
    ],
    stage: 4
  },
  
  // ============== STAGE 5: Final Specific Refinement ==============
  {
    id: "q5_philosophical",
    type: "preference",
    text: "Which philosophical question interests you most?",
    options: [
      {
        id: "p1_identity",
        text: "What makes someone who they are? Can people truly change?",
        mappings: [
          { dimension: "characterComplexity", value: 8, confidence: 0.8 },
          { dimension: "characterGrowth", value: 9, confidence: 0.9 },
          { dimension: "intellectualEmotional", value: 2, confidence: 0.7 }
        ]
      },
      {
        id: "p1_reality",
        text: "What is reality? How do we know what's real?",
        mappings: [
          { dimension: "narrativeComplexity", value: 9, confidence: 0.9 },
          { dimension: "fantasyRealism", value: 2, confidence: 0.7 },
          { dimension: "intellectualEmotional", value: 4, confidence: 0.8 }
        ]
      },
      {
        id: "p1_morality",
        text: "What makes an action right or wrong? Are there universal moral truths?",
        mappings: [
          { dimension: "moralAmbiguity", value: 9, confidence: 0.9 },
          { dimension: "narrativeComplexity", value: 7, confidence: 0.7 },
          { dimension: "intellectualEmotional", value: 3, confidence: 0.8 }
        ]
      },
      {
        id: "p1_meaning",
        text: "What gives life meaning? How do we find purpose?",
        mappings: [
          { dimension: "emotionalIntensity", value: 7, confidence: 0.8 },
          { dimension: "characterGrowth", value: 8, confidence: 0.7 },
          { dimension: "moralAmbiguity", value: 6, confidence: 0.7 }
        ]
      }
    ],
    targetDimensions: ["characterComplexity", "moralAmbiguity", "intellectualEmotional", "narrativeComplexity"],
    prerequisiteScore: [
      { dimension: "narrativeComplexity", minValue: 5, maxValue: 10 }  // Only for users who prefer complexity
    ],
    stage: 5
  },
  
  {
    id: "q3_aesthetic_preference",
    type: "image",
    text: "Which visual style would you prefer in a creative work?",
    options: [
      {
        id: "a1_maximalist",
        text: "Detailed and intricate with many elements",
        imageUrl: "/assets/questions/styles/maximalist.jpg",
        mappings: [
          { dimension: "visualComplexity", value: 9, confidence: 0.9 },
          { dimension: "visualPace", value: 7, confidence: 0.7 },
          { dimension: "narrativeComplexity", value: 6, confidence: 0.6 }
        ]
      },
      {
        id: "a1_stylized",
        text: "Bold, stylized with distinctive artistic flair",
        imageUrl: "/assets/questions/styles/stylized.jpg",
        mappings: [
          { dimension: "visualComplexity", value: 6, confidence: 0.8 },
          { dimension: "noveltyFamiliarity", value: 3, confidence: 0.7 },
          { dimension: "fantasyRealism", value: 2, confidence: 0.8 }
        ]
      },
      {
        id: "a1_realistic",
        text: "Detailed realism with accurate representation",
        imageUrl: "/assets/questions/styles/realistic.jpg",
        mappings: [
          { dimension: "visualComplexity", value: 7, confidence: 0.8 },
          { dimension: "fantasyRealism", value: -4, confidence: 0.9 },
          { dimension: "intellectualEmotional", value: 2, confidence: 0.6 }
        ]
      },
      {
        id: "a1_minimalist",
        text: "Clean and minimalist with essential elements only",
        imageUrl: "/assets/questions/styles/minimalist.jpg",
        mappings: [
          { dimension: "visualComplexity", value: 2, confidence: 0.9 },
          { dimension: "narrativePace", value: 6, confidence: 0.6 },
          { dimension: "intellectualEmotional", value: 3, confidence: 0.7 }
        ]
      }
    ],
    targetDimensions: ["visualComplexity", "fantasyRealism", "intellectualEmotional"],
    stage: 3
  },
  
  {
    id: "q4_narrative_structure",
    type: "preference", 
    text: "Which narrative structure appeals to you most?",
    options: [
      {
        id: "ns1_linear",
        text: "A clear, linear progression from beginning to end",
        mappings: [
          { dimension: "narrativeComplexity", value: 3, confidence: 0.9 },
          { dimension: "plotPredictability", value: 7, confidence: 0.8 },
          { dimension: "narrativePace", value: 6, confidence: 0.7 }
        ]
      },
      {
        id: "ns1_parallel",
        text: "Multiple storylines happening simultaneously",
        mappings: [
          { dimension: "narrativeComplexity", value: 8, confidence: 0.9 },
          { dimension: "plotPredictability", value: 4, confidence: 0.7 },
          { dimension: "intellectualEmotional", value: 2, confidence: 0.8 }
        ]
      },
      {
        id: "ns1_nonlinear",
        text: "Non-linear with jumps in time and perspective",
        mappings: [
          { dimension: "narrativeComplexity", value: 9, confidence: 0.9 },
          { dimension: "plotPredictability", value: 2, confidence: 0.8 },
          { dimension: "intellectualEmotional", value: 4, confidence: 0.7 }
        ]
      },
      {
        id: "ns1_circular",
        text: "Circular, ending where it began but with new understanding",
        mappings: [
          { dimension: "narrativeComplexity", value: 7, confidence: 0.8 },
          { dimension: "noveltyFamiliarity", value: 2, confidence: 0.7 },
          { dimension: "characterGrowth", value: 8, confidence: 0.8 }
        ]
      }
    ],
    targetDimensions: ["narrativeComplexity", "plotPredictability", "intellectualEmotional"],
    stage: 4
  },
  
  {
    id: "q5_conflict_resolution",
    type: "scenario",
    text: "In a story, how do you prefer conflicts to be resolved?",
    options: [
      {
        id: "cr1_direct",
        text: "Through direct confrontation and overcoming obstacles",
        mappings: [
          { dimension: "narrativePace", value: 7, confidence: 0.8 },
          { dimension: "emotionalIntensity", value: 8, confidence: 0.7 },
          { dimension: "moralAmbiguity", value: 4, confidence: 0.6 }
        ]
      },
      {
        id: "cr1_compromise",
        text: "Through dialogue, understanding and compromise",
        mappings: [
          { dimension: "narrativePace", value: 4, confidence: 0.7 },
          { dimension: "emotionalIntensity", value: 5, confidence: 0.7 },
          { dimension: "moralAmbiguity", value: 6, confidence: 0.8 }
        ]
      },
      {
        id: "cr1_personal",
        text: "Through personal growth and internal change",
        mappings: [
          { dimension: "characterGrowth", value: 9, confidence: 0.9 },
          { dimension: "intellectualEmotional", value: -2, confidence: 0.8 },
          { dimension: "emotionalValence", value: 2, confidence: 0.7 }
        ]
      },
      {
        id: "cr1_unresolved",
        text: "Left partially unresolved, reflecting life's complexities",
        mappings: [
          { dimension: "moralAmbiguity", value: 9, confidence: 0.9 },
          { dimension: "plotPredictability", value: 2, confidence: 0.8 },
          { dimension: "narrativeComplexity", value: 8, confidence: 0.7 }
        ]
      }
    ],
    targetDimensions: ["narrativePace", "moralAmbiguity", "characterGrowth", "plotPredictability"],
    stage: 5
  }
  
  // Additional questions would be defined here...
];

/**
 * Gets questions for a specific stage
 * @param stage The stage number (1-5)
 * @return Array of questions for that stage
 */
const getQuestionsByStage = (stage: number): Question[] => {
  return questions.filter(q => q.stage === stage);
};

/**
 * Gets questions that target a specific psychological dimension
 * @param dimension The dimension to target
 * @return Array of questions that target the dimension
 */
const getQuestionsByDimension = (dimension: string): Question[] => {
  return questions.filter(q => q.targetDimensions.includes(dimension));
};

/**
 * Gets questions that are appropriate for a user based on their current profile
 * @param userProfile The user's psychological profile
 * @return Array of appropriate questions
 */
const getQuestionsForProfile = (userProfile: {
  dimensions: { [dimension: string]: number },
  answeredQuestions: string[]
}): Question[] => {
  return questions.filter(question => {
    // Skip questions the user has already answered
    if (userProfile.answeredQuestions.includes(question.id)) {
      return false;
    }
    
    // Check if user meets prerequisites
    if (question.prerequisiteScore) {
      for (const prereq of question.prerequisiteScore) {
        const userValue = userProfile.dimensions[prereq.dimension] || 5; // Default to middle value
        if (userValue < prereq.minValue || userValue > prereq.maxValue) {
          return false;
        }
      }
    }
    
    return true;
  });
};

/**
 * Finds the next best question to ask based on the user profile
 * Prioritizes questions that target dimensions with low confidence
 * 
 * @param userProfile The user's psychological profile
 * @param maxStage Maximum stage to consider (defaults to 5)
 * @return The best next question to ask, or undefined if no appropriate questions
 */
const getBestNextQuestion = (
  userProfile: {
    dimensions: { [dimension: string]: number },
    confidences: { [dimension: string]: number },
    answeredQuestions: string[]
  }, 
  maxStage: number = 5
): Question | undefined => {
  // Get all questions the user hasn't answered yet
  const availableQuestions = getQuestionsForProfile(userProfile).filter(q => q.stage <= maxStage);
  
  if (availableQuestions.length === 0) {
    return undefined;
  }
  
  // Find dimensions with lowest confidence
  const dimensionsWithConfidence = Object.keys(userProfile.confidences)
    .map(dim => ({ 
      dimension: dim, 
      confidence: userProfile.confidences[dim],
      importance: DIMENSIONS[dim]?.importance || 0.5 
    }))
    .sort((a, b) => {
      // Sort by confidence * importance (ascending)
      return (a.confidence * a.importance) - (b.confidence * a.importance);
    });
  
  // Get top 3 dimensions with lowest confidence
  const lowConfidenceDimensions = dimensionsWithConfidence
    .slice(0, 3)
    .map(d => d.dimension);
  
  // Score each question based on how well it targets low-confidence dimensions
  const scoredQuestions = availableQuestions.map(question => {
    let score = 0;
    
    // Award points for targeting low-confidence dimensions
    for (const dim of question.targetDimensions) {
      if (lowConfidenceDimensions.includes(dim)) {
        score += 2;
      }
      
      // Bonus points for dimensions with very low confidence
      const dimConfidence = userProfile.confidences[dim] || 0.1;
      if (dimConfidence < 0.4) {
        score += 1;
      }
      
      // Factor in dimension importance
      score += (DIMENSIONS[dim]?.importance || 0.5) * 2;
    }
    
    // Prefer earlier stages if confidence is generally low
    const avgConfidence = Object.values(userProfile.confidences).reduce((sum, conf) => sum + conf, 0) / 
                         Object.values(userProfile.confidences).length;
    
    if (avgConfidence < 0.5 && question.stage <= 2) {
      score += 1;
    }
    
    return { question, score };
  });
  
  // Sort by score (descending)
  scoredQuestions.sort((a, b) => b.score - a.score);
  
  // Return the highest-scored question
  return scoredQuestions[0]?.question;
};

/**
 * Calculate dimension coverage statistics from the question bank
 * This helps identify dimensions that need more questions
 * 
 * @return Object with statistics about dimension coverage
 */
const calculateDimensionCoverage = (): {
  totalQuestions: number;
  dimensionCounts: { [dimension: string]: number };
  dimensionConfidenceAvg: { [dimension: string]: number };
  dimensionsByStage: { [stage: number]: { [dimension: string]: number } };
  dimensionsNeedingMoreCoverage: string[];
} => {
  const totalQuestions = questions.length;
  const dimensionCounts: { [dimension: string]: number } = {};
  const dimensionConfidenceSum: { [dimension: string]: number } = {};
  const dimensionConfidenceCount: { [dimension: string]: number } = {};
  const dimensionsByStage: { [stage: number]: { [dimension: string]: number } } = {};
  
  // Initialize counters for all dimensions
  Object.keys(DIMENSIONS).forEach(dim => {
    dimensionCounts[dim] = 0;
    dimensionConfidenceSum[dim] = 0;
    dimensionConfidenceCount[dim] = 0;
  });
  
  // Initialize stage counters
  for (let stage = 1; stage <= 5; stage++) {
    dimensionsByStage[stage] = {};
    Object.keys(DIMENSIONS).forEach(dim => {
      dimensionsByStage[stage][dim] = 0;
    });
  }
  
  // Count dimension occurrences across all questions
  questions.forEach(question => {
    const stage = question.stage;
    
    question.options.forEach(option => {
      option.mappings.forEach(mapping => {
        dimensionCounts[mapping.dimension] = (dimensionCounts[mapping.dimension] || 0) + 1;
        dimensionConfidenceSum[mapping.dimension] = (dimensionConfidenceSum[mapping.dimension] || 0) + mapping.confidence;
        dimensionConfidenceCount[mapping.dimension] = (dimensionConfidenceCount[mapping.dimension] || 0) + 1;
        
        dimensionsByStage[stage][mapping.dimension] = (dimensionsByStage[stage][mapping.dimension] || 0) + 1;
      });
    });
  });
  
  // Calculate average confidences
  const dimensionConfidenceAvg: { [dimension: string]: number } = {};
  Object.keys(dimensionConfidenceSum).forEach(dim => {
    if (dimensionConfidenceCount[dim] > 0) {
      dimensionConfidenceAvg[dim] = dimensionConfidenceSum[dim] / dimensionConfidenceCount[dim];
    } else {
      dimensionConfidenceAvg[dim] = 0;
    }
  });
  
  // Identify dimensions needing more coverage
  // We consider a dimension needing more coverage if:
  // 1. It appears in less than 20% of the total possible mappings, OR
  // 2. It has no coverage in at least 3 stages
  const dimensionsNeedingMoreCoverage = Object.keys(DIMENSIONS).filter(dim => {
    const coverage = dimensionCounts[dim] / totalQuestions;
    const stagesWithoutCoverage = Object.keys(dimensionsByStage)
      .filter(stage => dimensionsByStage[parseInt(stage)][dim] === 0)
      .length;
      
    return (coverage < 0.2 || stagesWithoutCoverage >= 3);
  });
  
  return {
    totalQuestions,
    dimensionCounts,
    dimensionConfidenceAvg,
    dimensionsByStage,
    dimensionsNeedingMoreCoverage
  };
};

/**
 * Get a randomized set of questions for a specific stage
 * Ensures variety when asking multiple questions from the same stage
 * 
 * @param stage The stage number (1-5)
 * @param count Number of questions to return
 * @return Array of randomized questions
 */
const getRandomizedQuestionsByStage = (stage: number, count: number = 2): Question[] => {
  const stageQuestions = questions.filter(q => q.stage === stage);
  
  // If we don't have enough questions, return all we have
  if (stageQuestions.length <= count) {
    return stageQuestions;
  }
  
  // Otherwise shuffle and take the requested count
  const shuffled = [...stageQuestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Export the question bank
export {
  DIMENSIONS,
  questions,
  getQuestionsByStage,
  getQuestionsByDimension,
  getQuestionsForProfile,
  getBestNextQuestion,
  calculateDimensionCoverage,
  getRandomizedQuestionsByStage
};