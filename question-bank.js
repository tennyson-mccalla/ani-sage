/**
 * Sample Question Bank for Psychological Anime Recommendation System
 * 
 * This file defines the structure and content of the psychological questions
 * used to build the user profile without directly referencing anime.
 */

// Define our core psychological dimensions
const DIMENSIONS = {
  // Visual and aesthetic preferences
  visualComplexity: { min: 0, max: 10, description: "Preference for visual complexity vs. simplicity" },
  colorSaturation: { min: 0, max: 10, description: "Preference for vibrant vs. muted colors" },
  visualPace: { min: 0, max: 10, description: "Preference for rapid visual changes vs. steady imagery" },
  
  // Narrative preferences
  narrativeComplexity: { min: 0, max: 10, description: "Preference for complex vs. straightforward narratives" },
  narrativePace: { min: 0, max: 10, description: "Preference for fast vs. slow story development" },
  plotPredictability: { min: 0, max: 10, description: "Preference for predictable vs. unpredictable developments" },
  
  // Character preferences
  characterComplexity: { min: 0, max: 10, description: "Preference for complex vs. archetypal characters" },
  characterGrowth: { min: 0, max: 10, description: "Importance of character development" },
  
  // Emotional preferences
  emotionalIntensity: { min: 0, max: 10, description: "Preference for intense vs. subdued emotions" },
  emotionalValence: { min: -5, max: 5, description: "Preference for positive vs. negative emotions" },
  
  // Thematic preferences
  moralAmbiguity: { min: 0, max: 10, description: "Tolerance for moral ambiguity" },
  fantasyRealism: { min: -5, max: 5, description: "Preference for fantasy vs. realism" },
  
  // Relationship with content
  intellectualEmotional: { min: -5, max: 5, description: "Intellectual vs. emotional engagement" },
  noveltyFamiliarity: { min: -5, max: 5, description: "Preference for novel vs. familiar content" }
};

// Sample questions organized by stages
const questions = [
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
          { dimension: "visualComplexity", value: 2 },
          { dimension: "colorSaturation", value: 3 }
        ]
      },
      {
        id: "v1_complex",
        text: "Image B",
        // Detailed, ornate, complex image
        imageUrl: "/assets/questions/visual/complex.jpg",
        mappings: [
          { dimension: "visualComplexity", value: 8 },
          { dimension: "colorSaturation", value: 7 }
        ]
      },
      {
        id: "v1_vibrant",
        text: "Image C",
        // Vibrant, colorful, energetic image
        imageUrl: "/assets/questions/visual/vibrant.jpg",
        mappings: [
          { dimension: "visualComplexity", value: 6 },
          { dimension: "colorSaturation", value: 9 },
          { dimension: "emotionalValence", value: 3 }
        ]
      },
      {
        id: "v1_muted",
        text: "Image D",
        // Muted, atmospheric, moody image
        imageUrl: "/assets/questions/visual/muted.jpg",
        mappings: [
          { dimension: "visualComplexity", value: 5 },
          { dimension: "colorSaturation", value: 2 },
          { dimension: "emotionalValence", value: -2 }
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
          { dimension: "narrativePace", value: 8 },
          { dimension: "noveltyFamiliarity", value: 4 },
          { dimension: "plotPredictability", value: 2 }
        ]
      },
      {
        id: "s1_cautious",
        text: "Examine the door carefully before deciding",
        mappings: [
          { dimension: "narrativePace", value: 4 },
          { dimension: "narrativeComplexity", value: 7 },
          { dimension: "plotPredictability", value: 6 }
        ]
      },
      {
        id: "s1_research",
        text: "Research if others have encountered similar doors",
        mappings: [
          { dimension: "narrativePace", value: 2 },
          { dimension: "intellectualEmotional", value: 4 },
          { dimension: "narrativeComplexity", value: 8 }
        ]
      },
      {
        id: "s1_ignore",
        text: "Leave it alone, it could be dangerous",
        mappings: [
          { dimension: "narrativePace", value: 3 },
          { dimension: "noveltyFamiliarity", value: -3 },
          { dimension: "emotionalValence", value: -2 }
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
          { dimension: "characterGrowth", value: 9 },
          { dimension: "characterComplexity", value: 7 },
          { dimension: "moralAmbiguity", value: 5 }
        ]
      },
      {
        id: "c1_consistent",
        text: "Someone with unwavering principles who stays true to themselves",
        mappings: [
          { dimension: "characterGrowth", value: 3 },
          { dimension: "characterComplexity", value: 5 },
          { dimension: "moralAmbiguity", value: 2 }
        ]
      },
      {
        id: "c1_flawed",
        text: "Someone with significant flaws who struggles with their nature",
        mappings: [
          { dimension: "characterGrowth", value: 7 },
          { dimension: "characterComplexity", value: 9 },
          { dimension: "moralAmbiguity", value: 8 }
        ]
      },
      {
        id: "c1_exceptional",
        text: "Someone with extraordinary abilities who inspires others",
        mappings: [
          { dimension: "characterGrowth", value: 5 },
          { dimension: "characterComplexity", value: 4 },
          { dimension: "emotionalValence", value: 3 }
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
          { dimension: "emotionalIntensity", value: 8 },
          { dimension: "emotionalValence", value: 3 },
          { dimension: "visualPace", value: 8 }
        ]
      },
      {
        id: "e1_wonder",
        text: "Wonder and fascination",
        mappings: [
          { dimension: "emotionalIntensity", value: 6 },
          { dimension: "emotionalValence", value: 4 },
          { dimension: "fantasyRealism", value: 3 }
        ]
      },
      {
        id: "e1_reflection",
        text: "Thoughtful reflection",
        mappings: [
          { dimension: "emotionalIntensity", value: 4 },
          { dimension: "intellectualEmotional", value: 4 },
          { dimension: "narrativePace", value: 3 }
        ]
      },
      {
        id: "e1_catharsis",
        text: "Deep emotional catharsis",
        mappings: [
          { dimension: "emotionalIntensity", value: 9 },
          { dimension: "emotionalValence", value: -1 },
          { dimension: "intellectualEmotional", value: -3 }
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
          { dimension: "colorSaturation", value: 9 },
          { dimension: "emotionalValence", value: 3 },
          { dimension: "emotionalIntensity", value: 7 }
        ]
      },
      {
        id: "cp1_pastel",
        text: "Palette B",
        imageUrl: "/assets/questions/colors/pastel.jpg",
        mappings: [
          { dimension: "colorSaturation", value: 5 },
          { dimension: "emotionalValence", value: 4 },
          { dimension: "emotionalIntensity", value: 3 }
        ]
      },
      {
        id: "cp1_dark",
        text: "Palette C",
        imageUrl: "/assets/questions/colors/dark.jpg",
        mappings: [
          { dimension: "colorSaturation", value: 4 },
          { dimension: "emotionalValence", value: -3 },
          { dimension: "emotionalIntensity", value: 6 }
        ]
      },
      {
        id: "cp1_muted",
        text: "Palette D",
        imageUrl: "/assets/questions/colors/muted.jpg",
        mappings: [
          { dimension: "colorSaturation", value: 2 },
          { dimension: "emotionalValence", value: -1 },
          { dimension: "emotionalIntensity", value: 4 }
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
          { dimension: "characterComplexity", value: 8 },
          { dimension: "characterGrowth", value: 9 },
          { dimension: "intellectualEmotional", value: 2 }
        ]
      },
      {
        id: "p1_reality",
        text: "What is reality? How do we know what's real?",
        mappings: [
          { dimension: "narrativeComplexity", value: 9 },
          { dimension: "fantasyRealism", value: 2 },
          { dimension: "intellectualEmotional", value: 4 }
        ]
      },
      {
        id: "p1_morality",
        text: "What makes an action right or wrong? Are there universal moral truths?",
        mappings: [
          { dimension: "moralAmbiguity", value: 9 },
          { dimension: "narrativeComplexity", value: 7 },
          { dimension: "intellectualEmotional", value: 3 }
        ]
      },
      {
        id: "p1_meaning",
        text: "What gives life meaning? How do we find purpose?",
        mappings: [
          { dimension: "emotionalIntensity", value: 7 },
          { dimension: "characterGrowth", value: 8 },
          { dimension: "moralAmbiguity", value: 6 }
        ]
      }
    ],
    targetDimensions: ["characterComplexity", "moralAmbiguity", "intellectualEmotional", "narrativeComplexity"],
    prerequisiteScore: [
      { dimension: "narrativeComplexity", minValue: 5, maxValue: 10 }  // Only for users who prefer complexity
    ],
    stage: 5
  }
  
  // Additional questions would be defined here...
];

// Define the importance/predictiveness of each dimension
const dimensionPredictiveness = {
  visualComplexity: 0.75,
  colorSaturation: 0.70,
  visualPace: 0.80,
  narrativeComplexity: 0.85,
  narrativePace: 0.80,
  plotPredictability: 0.75,
  characterComplexity: 0.90,
  characterGrowth: 0.85,
  emotionalIntensity: 0.80,
  emotionalValence: 0.75,
  moralAmbiguity: 0.70,
  fantasyRealism: 0.85,
  intellectualEmotional: 0.70,
  noveltyFamiliarity: 0.65
};

module.exports = {
  DIMENSIONS,
  questions,
  dimensionPredictiveness
};
