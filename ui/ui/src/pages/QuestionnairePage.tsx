import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from '../components/layout/Layout';
import Question, { QuestionData } from '../components/question-flow/Question';
import QuestionProgress from '../components/question-flow/QuestionProgress';
import { useUser } from '../context/UserContext';

// Mock questions - would be fetched from API in production
const mockQuestions: QuestionData[] = [
  {
    id: 'visual-style',
    type: 'text',
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
    type: 'text',
    text: 'How do you feel about complex storylines?',
    options: [
      { id: 'low-complexity', text: 'I prefer straightforward stories that are easy to follow' },
      { id: 'medium-complexity', text: 'I enjoy some complexity but don\'t want to feel lost' },
      { id: 'high-complexity', text: 'I love intricate plots with multiple layers and twists' }
    ]
  },
  {
    id: 'character-depth',
    type: 'text',
    text: 'What kind of characters do you connect with most?',
    options: [
      { id: 'simple-characters', text: 'Clear, straightforward characters with defined traits' },
      { id: 'balanced-characters', text: 'Characters with some depth but still relatable' },
      { id: 'complex-characters', text: 'Deep, nuanced characters with internal conflicts and growth' }
    ]
  },
  {
    id: 'moral-ambiguity',
    type: 'scenario',
    text: 'In stories, do you prefer:',
    options: [
      { id: 'clear-morals', text: 'Clear heroes and villains with defined moral boundaries' },
      { id: 'nuanced-morals', text: 'Characters with understandable motivations even when doing wrong' },
      { id: 'ambiguous', text: 'Morally ambiguous situations where right and wrong aren\'t clear' }
    ]
  },
  {
    id: 'emotional-tone',
    type: 'text',
    text: 'Which emotional tone do you prefer in stories?',
    options: [
      { id: 'light-optimistic', text: 'Light and optimistic' },
      { id: 'exciting-uplifting', text: 'Exciting and uplifting' },
      { id: 'dark-serious', text: 'Dark and serious' },
      { id: 'bittersweet-reflective', text: 'Bittersweet and reflective' }
    ]
  }
];

export default function QuestionnairePage() {
  const navigate = useNavigate();
  const { updateProfile } = useUser();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = mockQuestions[currentQuestionIndex];

  const handleAnswer = async (optionId: string) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setError(null);
    
    // Save answer
    const updatedAnswers = {
      ...answers,
      [currentQuestion.id]: optionId
    };
    setAnswers(updatedAnswers);

    // If this is the last question, update the profile with all answers
    if (currentQuestionIndex >= mockQuestions.length - 1) {
      try {
        await updateProfile(updatedAnswers);
        navigate('/recommendations', { state: { answers: updatedAnswers } });
      } catch (err) {
        console.error('Error updating profile:', err);
        setError('Failed to save your answers. Please try again.');
        setIsTransitioning(false);
        return;
      }
    }

    // Add timeout for animation
    setTimeout(() => {
      if (currentQuestionIndex < mockQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
      setIsTransitioning(false);
    }, 500);
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-64px)] bg-purple-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-purple-800 mb-6 text-center">
              Discover Your Perfect Anime
            </h1>
            <p className="text-gray-600 text-center mb-8">
              Answer these questions to help us understand your preferences
            </p>
            
            <QuestionProgress 
              currentStep={currentQuestionIndex + 1} 
              totalSteps={mockQuestions.length} 
            />
          </div>

          <AnimatePresence mode="wait">
            <Question 
              key={currentQuestion.id} 
              question={currentQuestion} 
              onAnswer={handleAnswer} 
              isTransitioning={isTransitioning} 
            />
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}