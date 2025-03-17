import { motion } from 'framer-motion';

// Define question and option types
export interface QuestionOption {
  id: string;
  text: string;
  imageUrl?: string;
}

export interface QuestionData {
  id: string;
  type: 'text' | 'image' | 'color' | 'scenario';
  text: string;
  options: QuestionOption[];
}

interface QuestionProps {
  question: QuestionData;
  onAnswer: (optionId: string) => void;
  isTransitioning: boolean;
}

export default function Question({ question, onAnswer, isTransitioning }: QuestionProps) {
  const wrapperVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };
  
  const optionVariants = {
    initial: { opacity: 0, y: 20 },
    animate: (i: number) => ({ 
      opacity: 1, 
      y: 0,
      transition: { 
        delay: 0.1 + i * 0.1,
        duration: 0.3
      }
    })
  };

  return (
    <motion.div 
      className="bg-white rounded-lg shadow-lg p-6 md:p-8"
      variants={wrapperVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-6">
        {question.text}
      </h2>

      <div className="flex flex-col gap-3">
        {question.options.map((option, index) => (
          <motion.button 
            key={option.id}
            onClick={() => !isTransitioning && onAnswer(option.id)}
            disabled={isTransitioning}
            className={`flex items-start py-3 px-4 rounded-md border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors text-left ${
              isTransitioning ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            variants={optionVariants}
            initial="initial"
            animate="animate"
            custom={index}
          >
            {option.imageUrl ? (
              <div className="flex items-center w-full">
                <img 
                  src={option.imageUrl} 
                  alt={option.text} 
                  className="w-16 h-16 object-cover rounded-md mr-4" 
                />
                <span>{option.text}</span>
              </div>
            ) : (
              <span>{option.text}</span>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}