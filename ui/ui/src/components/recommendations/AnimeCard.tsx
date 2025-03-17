import { motion } from 'framer-motion';
import { useState } from 'react';

export interface AnimeRecommendation {
  id: string;
  title: string;
  image: string;
  genres: string[];
  score: number;
  synopsis: string;
  match: number;
  reasons: string[];
  trailer?: string;
}

interface AnimeCardProps {
  anime: AnimeRecommendation;
  index: number;
}

export default function AnimeCard({ anime, index }: AnimeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Stagger animation for cards
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        delay: index * 0.15,
        duration: 0.4
      }
    }
  };

  return (
    <motion.div 
      className="h-full flex flex-col bg-white rounded-lg shadow-md overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={cardVariants}
    >
      {/* Poster with match badge */}
      <div className="relative aspect-[2/3] w-full">
        <img 
          src={anime.image} 
          alt={anime.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 bg-purple-600 text-white text-sm font-bold px-2 py-1 rounded-full">
          {anime.match}% Match
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="text-lg font-semibold mb-1">{anime.title}</h3>
        <div className="text-sm text-gray-500 mb-3">
          {anime.genres.join(', ')} • {anime.score}/10
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-700 line-clamp-2">
            {anime.synopsis}
          </p>
          {anime.synopsis.length > 100 && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)} 
              className="text-xs text-purple-600 hover:text-purple-800 mt-1"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {/* Match reasons */}
        <div className="mt-auto">
          <h4 className="text-sm font-medium mb-2">Why we recommended this:</h4>
          <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
            {anime.reasons.map((reason, i) => (
              <li key={i} className="line-clamp-1">{reason}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer with trailer button */}
      <div className="px-4 pb-4">
        <button 
          disabled={!anime.trailer}
          className={`w-full py-2 rounded-md text-sm font-medium flex justify-center items-center gap-2 
            ${anime.trailer 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`
          }
          onClick={() => anime.trailer && window.open(anime.trailer, '_blank')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
          Watch Trailer
        </button>
      </div>

      {/* Expanded synopsis */}
      {isExpanded && (
        <motion.div 
          className="px-4 pb-4"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <div className="text-sm text-gray-700">
            {anime.synopsis}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}