'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
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

export default function QuestionsPage() {
  const router = useRouter();
  const { updateProfile } = useUser();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<QuestionData[]>(mockQuestions);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { sessionId } = useUser();

  useEffect(() => {
    // Fetch questions from API if real API is enabled
    async function fetchQuestions() {
      if (process.env.NEXT_PUBLIC_USE_REAL_API === 'true' && sessionId) {
        try {
          setIsLoading(true);
          console.log('Fetching questions for session:', sessionId);
          
          // Try the direct API path first and fall back to v1 path if needed
          const apiUrl = `/api/questions?sessionId=${sessionId}&count=10`;
          console.log('Fetching questions from:', apiUrl);
          const response = await fetch(apiUrl);
          
          if (!response.ok) {
            console.error('Failed to fetch questions:', response.status);
            // Fall back to mock questions
            return;
          }
          
          const data = await response.json();
          
          if (data.questions && data.questions.length > 0) {
            console.log('Fetched', data.questions.length, 'questions from API');
            setQuestions(data.questions);
          } else {
            console.log('No questions returned from API, using mock questions');
          }
        } catch (error) {
          console.error('Error fetching questions:', error);
          // Keep using mock questions
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
        console.log('Using mock questions (API disabled or no session)');
      }
    }
    
    fetchQuestions();
  }, [sessionId]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswer = async (optionId: string) => {
    if (isTransitioning || !currentQuestion) return;

    setIsTransitioning(true);
    setError(null);

    // Save answer
    const updatedAnswers = {
      ...answers,
      [currentQuestion.id]: optionId
    };
    setAnswers(updatedAnswers);

    // Submit the answer to the API if using real API
    if (process.env.NEXT_PUBLIC_USE_REAL_API === 'true' && sessionId) {
      try {
        console.log(`Submitting answer: ${currentQuestion.id} = ${optionId}`);
        const response = await fetch(`/api/v1/answers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            questionId: currentQuestion.id,
            optionId,
            sessionId
          })
        });
        
        if (!response.ok) {
          console.error('Failed to submit answer:', response.status);
          setError('Failed to save your answer. Please try again.');
          setIsTransitioning(false);
          return;
        }
        
        console.log('Answer submitted successfully');
      } catch (error) {
        console.error('Error submitting answer:', error);
        // Continue even if submission fails
      }
    }

    // If this is the last question, update the profile with all answers and redirect
    if (currentQuestionIndex >= questions.length - 1) {
      try {
        await updateProfile(updatedAnswers);
        router.push('/recommendations');
      } catch (err) {
        console.error('Error updating profile:', err);
        setError('Failed to save your answers. Please try again.');
        setIsTransitioning(false);
        return;
      }
    } else {
      // Add timeout for animation
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
        setIsTransitioning(false);
      }, 500);
    }
  };

  return (
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
            totalSteps={questions.length}
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-700 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading questions...</p>
          </div>
        ) : currentQuestion ? (
          <AnimatePresence mode="wait">
            <Question
              key={currentQuestion.id}
              question={currentQuestion}
              onAnswer={handleAnswer}
              isTransitioning={isTransitioning}
            />
          </AnimatePresence>
        ) : (
          <div className="p-6 bg-white rounded-lg shadow-lg text-center">
            <p className="text-gray-700">No questions available. Please try again later.</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
