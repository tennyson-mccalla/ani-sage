// Direct recommendation test - no API server required
// This script simulates the profile-based recommendation logic directly

console.log("====== DIRECT RECOMMENDATION TEST ======");
console.log("Testing the recommendation engine with different profiles");
console.log("");

// Mock anime database
const animeDatabase = [
  {
    id: "5114", 
    title: "Fullmetal Alchemist: Brotherhood",
    genres: ["Action", "Adventure", "Drama", "Fantasy"],
    description: "After a terrible alchemical ritual goes wrong...",
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
    genres: ["Action", "Drama", "Fantasy", "Mystery"],
    description: "Centuries ago, mankind was slaughtered to near extinction...",
    traits: {
      visualComplexity: 9.3,
      narrativeComplexity: 9.0,
      emotionalIntensity: 9.5,
      characterComplexity: 8.7,
      moralAmbiguity: 9.2
    }
  },
  {
    id: "97940", 
    title: "Made in Abyss",
    genres: ["Adventure", "Drama", "Fantasy", "Mystery", "Sci-Fi"],
    description: "The Abyss—a gaping chasm stretching down into the depths of the earth...",
    traits: {
      visualComplexity: 9.0,
      narrativeComplexity: 8.0,
      emotionalIntensity: 9.0,
      characterComplexity: 7.5,
      moralAmbiguity: 8.5
    }
  },
  {
    id: "1535", 
    title: "Death Note",
    genres: ["Mystery", "Psychological", "Supernatural", "Thriller"],
    description: "A shinigami, as a god of death, can kill any person...",
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
    genres: ["Comedy", "Music", "Slice of Life"],
    description: "Hirasawa Yui, a young, carefree girl entering high school...",
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
    genres: ["Adventure", "Fantasy", "Slice of Life"],
    description: "In 1950s Japan, university professor Tatsuo Kusakabe and his two daughters...",
    traits: {
      visualComplexity: 8.5,
      narrativeComplexity: 3.5,
      emotionalIntensity: 4.0,
      characterComplexity: 4.5,
      moralAmbiguity: 2.0
    }
  },
  {
    id: "4", 
    title: "Violet Evergarden",
    genres: ["Drama", "Fantasy", "Slice of Life"],
    description: "The Great War finally came to an end after four long years of conflict...",
    traits: {
      visualComplexity: 9.7,
      narrativeComplexity: 7.4,
      emotionalIntensity: 9.0,
      characterComplexity: 8.5,
      moralAmbiguity: 6.0
    }
  },
  {
    id: "7", 
    title: "Your Lie in April",
    genres: ["Drama", "Music", "Romance", "Slice of Life"],
    description: "Music accompanies the path of the human metronome...",
    traits: {
      visualComplexity: 8.0,
      narrativeComplexity: 7.0,
      emotionalIntensity: 9.0,
      characterComplexity: 7.5,
      moralAmbiguity: 4.5
    }
  },
  {
    id: "9253", 
    title: "Steins;Gate",
    genres: ["Sci-Fi", "Thriller", "Drama"],
    description: "Self-proclaimed mad scientist Rintarou Okabe rents out a room...",
    traits: {
      visualComplexity: 7.5,
      narrativeComplexity: 9.4,
      emotionalIntensity: 8.3,
      characterComplexity: 8.9,
      moralAmbiguity: 8.0
    }
  },
  {
    id: "20583", 
    title: "Tokyo Ghoul",
    genres: ["Action", "Horror", "Mystery", "Psychological", "Supernatural"],
    description: "Tokyo has become a cruel and merciless city...",
    traits: {
      visualComplexity: 8.5,
      narrativeComplexity: 8.0,
      emotionalIntensity: 9.0,
      characterComplexity: 7.5,
      moralAmbiguity: 9.0
    }
  }
];

// Profile definitions
const calmSimpleProfile = {
  dimensions: {
    visualComplexity: 3.0,
    narrativeComplexity: 2.5,
    emotionalIntensity: 3.5,
    characterComplexity: 3.0,
    moralAmbiguity: 2.0
  },
  confidences: {
    visualComplexity: 0.8,
    narrativeComplexity: 0.8,
    emotionalIntensity: 0.8,
    characterComplexity: 0.8,
    moralAmbiguity: 0.8
  }
};

const complexIntenseProfile = {
  dimensions: {
    visualComplexity: 8.5,
    narrativeComplexity: 9.0,
    emotionalIntensity: 8.5,
    characterComplexity: 9.0,
    moralAmbiguity: 7.5
  },
  confidences: {
    visualComplexity: 0.8,
    narrativeComplexity: 0.8,
    emotionalIntensity: 0.8,
    characterComplexity: 0.8,
    moralAmbiguity: 0.8
  }
};

// Dimension importance weights for match calculation
const dimensionWeights = {
  'visualComplexity': 0.8,
  'narrativeComplexity': 1.0,
  'emotionalIntensity': 0.9,
  'characterComplexity': 1.0,
  'moralAmbiguity': 0.7
};

// Calculate match score between profile and anime
function calculateMatchScore(profile, anime) {
  // Shared dimensions
  const dimensions = [
    'visualComplexity',
    'narrativeComplexity',
    'emotionalIntensity',
    'characterComplexity',
    'moralAmbiguity'
  ];
  
  let weightedDistanceSum = 0;
  let totalWeight = 0;
  
  const dimensionScores = {};
  
  dimensions.forEach(dim => {
    if (profile.dimensions[dim] !== undefined && anime.traits[dim] !== undefined) {
      // Get values
      const profileValue = profile.dimensions[dim];
      const animeValue = anime.traits[dim];
      
      // Calculate distance (squared to emphasize larger differences)
      const distance = Math.pow(Math.abs(profileValue - animeValue), 2) / 100;
      
      // Get weight for this dimension
      const weight = dimensionWeights[dim] || 1.0;
      
      // Apply weighted distance
      weightedDistanceSum += distance * weight;
      totalWeight += weight;
      
      // Store individual dimension score
      const dimScore = 100 - (distance * 100);
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
  
  return {
    score: Math.round(matchScore),
    dimensionScores
  };
}

// Get recommendations for a profile
function getRecommendationsForProfile(profile, count = 10) {
  // Score each anime based on the profile
  const scoredAnime = animeDatabase.map(anime => {
    const matchResult = calculateMatchScore(profile, anime);
    
    return {
      id: anime.id,
      title: anime.title,
      genres: anime.genres,
      match: matchResult.score,
      dimensionScores: matchResult.dimensionScores
    };
  });
  
  // Sort by match score (descending)
  scoredAnime.sort((a, b) => b.match - a.match);
  
  // Return top matches
  return scoredAnime.slice(0, count);
}

// Get recommendations for both profiles
console.log("Getting recommendations for Calm/Simple profile...");
const calmRecommendations = getRecommendationsForProfile(calmSimpleProfile, 5);

console.log("Getting recommendations for Complex/Intense profile...");
const intenseRecommendations = getRecommendationsForProfile(complexIntenseProfile, 5);

// Display results
console.log("\n===== CALM/SIMPLE PROFILE RECOMMENDATIONS =====");
calmRecommendations.forEach((rec, i) => {
  console.log(`${i+1}. ${rec.title} - ${rec.match}% Match`);
  
  // Log the dimension scores
  const dimensions = Object.keys(rec.dimensionScores);
  dimensions.forEach(dim => {
    const score = rec.dimensionScores[dim];
    console.log(`   - ${dim}: profile=${score.profileValue} anime=${score.animeValue} score=${Math.round(score.score)}%`);
  });
});

console.log("\n===== COMPLEX/INTENSE PROFILE RECOMMENDATIONS =====");
intenseRecommendations.forEach((rec, i) => {
  console.log(`${i+1}. ${rec.title} - ${rec.match}% Match`);
  
  // Log the dimension scores
  const dimensions = Object.keys(rec.dimensionScores);
  dimensions.forEach(dim => {
    const score = rec.dimensionScores[dim];
    console.log(`   - ${dim}: profile=${score.profileValue} anime=${score.animeValue} score=${Math.round(score.score)}%`);
  });
});

// Analyze recommendation overlap
const calmTitles = calmRecommendations.map(rec => rec.title);
const intenseTitles = intenseRecommendations.map(rec => rec.title);

const commonTitles = calmTitles.filter(title => intenseTitles.includes(title));
const uniqueToCalm = calmTitles.filter(title => !intenseTitles.includes(title));
const uniqueToIntense = intenseTitles.filter(title => !calmTitles.includes(title));

const overlapPercentage = (commonTitles.length / Math.min(calmTitles.length, intenseTitles.length)) * 100;

console.log("\n===== RECOMMENDATION ANALYSIS =====");
console.log(`Calm Profile Recommendations: ${calmTitles.length}`);
console.log(`Complex Profile Recommendations: ${intenseTitles.length}`);
console.log(`Common recommendations: ${commonTitles.length} titles`);
console.log(`Unique to calm profile: ${uniqueToCalm.length} titles - ${uniqueToCalm.join(', ')}`);
console.log(`Unique to complex profile: ${uniqueToIntense.length} titles - ${uniqueToIntense.join(', ')}`);
console.log(`Overlap percentage: ${overlapPercentage.toFixed(1)}%`);
console.log(`Differentiation: ${(100 - overlapPercentage).toFixed(1)}%`);

// Save results to files for analysis
const fs = require('fs');

try {
  // Create directory if it doesn't exist
  if (!fs.existsSync('test-results')) {
    fs.mkdirSync('test-results');
  }
  
  // Write results to JSON files
  fs.writeFileSync(
    'test-results/calm-profile-recommendations.json', 
    JSON.stringify({ recommendations: calmRecommendations }, null, 2)
  );
  
  fs.writeFileSync(
    'test-results/intense-profile-recommendations.json', 
    JSON.stringify({ recommendations: intenseRecommendations }, null, 2)
  );
  
  console.log("Results saved to test-results directory");
} catch (err) {
  console.error("Error saving results:", err);
}

console.log("\nTest completed!");