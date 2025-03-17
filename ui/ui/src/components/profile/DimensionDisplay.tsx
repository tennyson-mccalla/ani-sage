import { motion } from 'framer-motion';

export interface Dimension {
  name: string;
  value: number;
  min: number;
  max: number;
  lowLabel: string;
  highLabel: string;
}

interface DimensionDisplayProps {
  dimension: Dimension;
  index: number;
}

export default function DimensionDisplay({ dimension, index }: DimensionDisplayProps) {
  // Calculate normalized percentage for the progress bar
  const normalizedValue = ((dimension.value - dimension.min) / (dimension.max - dimension.min)) * 100;
  
  // Animation
  const barVariants = {
    initial: { width: 0 },
    animate: { 
      width: `${normalizedValue}%`,
      transition: { 
        delay: index * 0.1,
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };
  
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{dimension.name}</span>
        <span className="text-sm text-gray-500">{dimension.value.toFixed(1)}</span>
      </div>
      
      <div className="relative h-2 bg-gray-200 rounded-full">
        <motion.div 
          className="absolute h-full bg-purple-600 rounded-full"
          variants={barVariants}
          initial="initial"
          animate="animate"
        />
      </div>
      
      <div className="flex justify-between mt-1 text-xs text-gray-500">
        <span>{dimension.lowLabel}</span>
        <span>{dimension.highLabel}</span>
      </div>
    </div>
  );
}