import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'

// Mock question interface - would come from your real question bank
interface Question {
  id: string
  text: string
  options: {
    id: string
    text: string
  }[]
}

// Mock questions - replace with real questions from your question bank
const mockQuestions: Question[] = [
  {
    id: 'visual-style',
    text: 'Which visual style do you prefer in anime?',
    options: [
      { id: 'clean-simple', text: 'Clean and simple visuals, with emphasis on character expressions' },
      { id: 'balanced', text: 'Balanced visuals with moderate detail' },
      { id: 'detailed', text: 'Highly detailed and intricate visuals' },
      { id: 'dynamic', text: 'Dynamic and energetic visuals with lots of movement' }
    ]
  },
  {
    id: 'narrative-complexity',
    text: 'How do you feel about complex storylines?',
    options: [
      { id: 'low-complexity', text: 'I prefer straightforward stories that are easy to follow' },
      { id: 'medium-complexity', text: 'I enjoy some complexity but don\'t want to feel lost' },
      { id: 'high-complexity', text: 'I love intricate plots with multiple layers and twists' }
    ]
  },
  {
    id: 'character-depth',
    text: 'What kind of characters do you connect with most?',
    options: [
      { id: 'simple-characters', text: 'Clear, straightforward characters with defined traits' },
      { id: 'balanced-characters', text: 'Characters with some depth but still relatable' },
      { id: 'complex-characters', text: 'Deep, nuanced characters with internal conflicts and growth' }
    ]
  },
  {
    id: 'moral-ambiguity',
    text: 'In stories, do you prefer:',
    options: [
      { id: 'clear-morals', text: 'Clear heroes and villains with defined moral boundaries' },
      { id: 'nuanced-morals', text: 'Characters with understandable motivations even when doing wrong' },
      { id: 'ambiguous', text: 'Morally ambiguous situations where right and wrong aren\'t clear' }
    ]
  },
  {
    id: 'emotional-tone',
    text: 'Which emotional tone do you prefer in stories?',
    options: [
      { id: 'light-optimistic', text: 'Light and optimistic' },
      { id: 'exciting-uplifting', text: 'Exciting and uplifting' },
      { id: 'dark-serious', text: 'Dark and serious' },
      { id: 'bittersweet-reflective', text: 'Bittersweet and reflective' }
    ]
  }
]

export default function Questionnaire() {
  const navigate = useNavigate()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<{[key: string]: string}>({})
  const [isTransitioning, setIsTransitioning] = useState(false)

  const currentQuestion = mockQuestions[currentQuestionIndex]
  const progress = ((currentQuestionIndex) / mockQuestions.length) * 100

  const handleAnswer = (optionId: string) => {
    setIsTransitioning(true)
    
    // Save answer
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionId
    }))

    // Wait for animation before moving to next question
    setTimeout(() => {
      if (currentQuestionIndex < mockQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1)
      } else {
        // Last question answered, proceed to recommendations
        navigate('/recommendations', { state: { answers } })
      }
      setIsTransitioning(false)
    }, 500)
  }

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center bg-background p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-full max-w-3xl mx-auto">
        <div className="mb-8">
          <Progress value={progress} className="h-2 mb-2" />
          <p className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {mockQuestions.length}
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="bg-card rounded-lg shadow-lg p-8"
          >
            <h2 className="text-2xl font-semibold mb-6">
              {currentQuestion.text}
            </h2>

            <div className="flex flex-col gap-3">
              {currentQuestion.options.map((option) => (
                <Button 
                  key={option.id}
                  onClick={() => !isTransitioning && handleAnswer(option.id)}
                  variant="outline" 
                  className="justify-start p-4 text-left h-auto"
                  disabled={isTransitioning}
                >
                  {option.text}
                </Button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}