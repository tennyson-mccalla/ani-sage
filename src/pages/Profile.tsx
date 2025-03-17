import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Progress } from '../components/ui/progress'

// Mock user profile data - would be replaced by your actual profile system
const mockProfile = {
  dimensions: {
    visualComplexity: 7.5,
    narrativeComplexity: 8.2,
    emotionalIntensity: 6.8,
    characterComplexity: 8.5,
    moralAmbiguity: 7.9,
    emotionalValence: -2.1,
    intellectualEmotional: 3.4,
    fantasticRealism: 2.7
  },
  recentlyWatched: [
    'Fullmetal Alchemist: Brotherhood',
    'Steins;Gate',
    'Violet Evergarden'
  ],
  suggestedAdjustments: [
    {
      dimension: 'narrativeComplexity',
      suggestion: 'You seem to enjoy more complex narratives than your current profile suggests.',
      currentValue: 8.2,
      suggestedValue: 9.1
    },
    {
      dimension: 'emotionalValence',
      suggestion: 'You might prefer slightly less dark stories than your current profile indicates.',
      currentValue: -2.1,
      suggestedValue: -1.2
    }
  ]
}

// Dimension labels for display
const dimensionLabels: {[key: string]: string} = {
  visualComplexity: 'Visual Complexity',
  narrativeComplexity: 'Narrative Complexity',
  emotionalIntensity: 'Emotional Intensity',
  characterComplexity: 'Character Complexity',
  moralAmbiguity: 'Moral Ambiguity',
  emotionalValence: 'Emotional Valence',
  intellectualEmotional: 'Intellectual vs. Emotional',
  fantasticRealism: 'Fantastic vs. Realistic'
}

// Helper for dimension scale labels
const getDimensionScaleLabels = (dimension: string): [string, string] => {
  switch (dimension) {
    case 'visualComplexity':
      return ['Simple, Clean', 'Detailed, Complex'];
    case 'narrativeComplexity':
      return ['Straightforward', 'Multi-layered'];
    case 'emotionalIntensity':
      return ['Gentle', 'Intense'];
    case 'characterComplexity':
      return ['Archetypal', 'Nuanced'];
    case 'moralAmbiguity':
      return ['Clear Morals', 'Ambiguous'];
    case 'emotionalValence':
      return ['Dark, Negative', 'Light, Positive'];
    case 'intellectualEmotional':
      return ['Emotional', 'Intellectual'];
    case 'fantasticRealism':
      return ['Realistic', 'Fantastic'];
    default:
      return ['Low', 'High'];
  }
}

export default function Profile() {
  const navigate = useNavigate()

  // Gets normalized value (0-100) for progress bar
  const getNormalizedValue = (dimension: string, value: number): number => {
    // For most dimensions (0-10 scale)
    if (dimension !== 'emotionalValence' && dimension !== 'intellectualEmotional' && dimension !== 'fantasticRealism') {
      return (value / 10) * 100;
    }
    // For dimensions with -5 to 5 scale
    return ((value + 5) / 10) * 100;
  };

  return (
    <motion.div
      className="min-h-screen bg-background p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Your Psychological Profile</h1>
          <p className="text-muted-foreground">This profile helps us find anime that resonates with your preferences</p>
        </header>

        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Your Psychological Dimensions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(mockProfile.dimensions).map(([dimension, value]) => {
                const [lowLabel, highLabel] = getDimensionScaleLabels(dimension);
                const normalizedValue = getNormalizedValue(dimension, value);
                
                return (
                  <div key={dimension} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{dimensionLabels[dimension] || dimension}</span>
                      <span className="text-muted-foreground">{value.toFixed(1)}/10</span>
                    </div>
                    <Progress value={normalizedValue} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{lowLabel}</span>
                      <span>{highLabel}</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Suggested Profile Adjustments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockProfile.suggestedAdjustments.map((adjustment, index) => (
                <div key={index} className="bg-muted p-4 rounded-lg">
                  <h3 className="font-medium mb-2">{dimensionLabels[adjustment.dimension]}</h3>
                  <p className="text-sm mb-3">{adjustment.suggestion}</p>
                  <div className="flex items-center">
                    <span className="text-sm mr-2">Current: {adjustment.currentValue.toFixed(1)}</span>
                    <div className="flex-grow flex items-center">
                      <div className="h-1 bg-secondary flex-grow relative">
                        <div 
                          className="absolute h-3 w-3 rounded-full bg-primary" 
                          style={{ left: `${getNormalizedValue(adjustment.dimension, adjustment.currentValue)}%`, top: '-4px' }}
                        ></div>
                        <div 
                          className="absolute h-3 w-3 rounded-full bg-accent border border-primary" 
                          style={{ left: `${getNormalizedValue(adjustment.dimension, adjustment.suggestedValue)}%`, top: '-4px' }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm ml-2">Suggested: {adjustment.suggestedValue.toFixed(1)}</span>
                  </div>
                </div>
              ))}
              <Button className="w-full mt-2">Apply Suggested Adjustments</Button>
            </CardContent>
          </Card>

          <div className="flex justify-center space-x-4 mt-6">
            <Button onClick={() => navigate('/questions')} variant="outline">
              Retake Questionnaire
            </Button>
            <Button onClick={() => navigate('/recommendations')}>
              View Recommendations
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}