import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from '../components/layout/Layout';
import Question, { QuestionData } from '../components/question-flow/Question';
import QuestionProgress from '../components/question-flow/QuestionProgress';
import { useUser } from '../context/UserContext';
import { apiService } from '../services/api';

export default function QuestionnairePage() {
  const navigate = useNavigate();
  const { updateProfile } = useUser();
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch questions from API
  useEffect(() => {
    async function fetchQuestions() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch questions from the API
        const questionsData = await apiService.getQuestions(5);
        
        // Map API response to match our QuestionData interface
        const mappedQuestions: QuestionData[] = questionsData.map((q: any) => ({
          id: q.id,
          type: q.type || 'text',
          text: q.text,
          options: q.options.map((opt: any) => ({
            id: opt.id,
            text: opt.text,
            imageUrl: opt.imageUrl
          }))
        }));
        
        setQuestions(mappedQuestions);
      } catch (err) {
        console.error('Error fetching questions:', err);
        setError('Failed to load questions. Please try again.');
        
        // Fallback: use mock questions if API fails
        setQuestions([
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
        ]);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchQuestions();
  }, []);

  // Show loading state if questions are not yet loaded
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-64px)] bg-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-700 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading questions...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Make sure we have questions before rendering
  if (questions.length === 0) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-64px)] bg-purple-50 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Unable to load questions</h2>
            <p className="text-gray-700 mb-6">{error || 'Please try again later.'}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-md font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswer = async (optionId: string) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setError(null);
    
    try {
      // Submit answer directly to API
      await apiService.submitAnswer(currentQuestion.id, optionId);
      
      // Also save answer in local state
      const updatedAnswers = {
        ...answers,
        [currentQuestion.id]: optionId
      };
      setAnswers(updatedAnswers);

      // If this is the last question, navigate to recommendations
      if (currentQuestionIndex >= questions.length - 1) {
        navigate('/recommendations', { state: { profileUpdated: true } });
        return;
      }

      // Add timeout for animation and proceed to next question
      setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
        }
        setIsTransitioning(false);
      }, 500);
    } catch (err) {
      console.error('Error submitting answer:', err);
      setError('Failed to save your answer. Please try again.');
      setIsTransitioning(false);
    }
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
              totalSteps={questions.length} 
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