import { motion } from 'framer-motion';

interface QuestionProgressProps {
  currentStep: number;
  totalSteps: number;
}

export default function QuestionProgress({ currentStep, totalSteps }: QuestionProgressProps) {
  const progress = ((currentStep) / totalSteps) * 100;

  return (
    <div className="w-full">
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-purple-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <div className="flex justify-between text-sm text-gray-500 mt-2">
        <span>{currentStep} of {totalSteps}</span>
        <span>{Math.round(progress)}% complete</span>
      </div>
    </div>
  );
}