'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

export interface AnimeRecommendation {
  id: string;
  title: string;
  image: string;
  genres: string[];
  score?: number;
  scores?: {
    anilist?: number;
    mal?: number;
    tmdb?: number;
    [key: string]: number | undefined;
  };
  externalIds?: {
    mal?: number;
    tmdb?: number;
    anilist?: number;
    [key: string]: number | undefined;
  };
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
  
  // Function to render scores from different sources
  const renderScores = () => {
    // If we have the new scores object
    if (anime.scores) {
      // Create an array of score elements
      const scoreElements = [];
      
      if (anime.scores.anilist) {
        scoreElements.push(
          <span key="anilist" className="ml-2 inline-flex items-center">
            • <span className="font-semibold mr-1">AL</span> 
            {(anime.scores.anilist).toFixed(1)}
          </span>
        );
      }
      
      if (anime.scores.mal) {
        scoreElements.push(
          <span key="mal" className="ml-2 inline-flex items-center">
            • <span className="font-semibold mr-1">MAL</span> 
            {(anime.scores.mal).toFixed(1)}
          </span>
        );
      }
      
      if (anime.scores.tmdb) {
        scoreElements.push(
          <span key="tmdb" className="ml-2 inline-flex items-center">
            • <span className="font-semibold mr-1">TMDb</span> 
            {(anime.scores.tmdb).toFixed(1)}
          </span>
        );
      }
      
      return scoreElements.length > 0 ? scoreElements : null;
    }
    
    // Legacy support for the old score property
    if (anime.score) {
      return (
        <span className="ml-2 inline-flex items-center">
          • <span className="font-semibold mr-1">AL</span> 
          {typeof anime.score === 'number' ? anime.score.toFixed(1) : anime.score}
        </span>
      );
    }
    
    return null;
  };

  return (
    <motion.div
      className="h-full flex flex-col bg-white rounded-lg shadow-md overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={cardVariants}
    >
      {/* Poster with match badge */}
      <div className="relative aspect-[2/3] w-full bg-gray-200">
        <img
          src={anime.image}
          alt={anime.title}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.onerror = null; 
            e.currentTarget.src = `https://dummyimage.com/600x900/${['3498db', 'e74c3c', '27ae60', '8e44ad'][Math.floor(Math.random() * 4)]}/ffffff&text=${encodeURIComponent(anime.title)}`;
          }}
        />
        <div className="absolute top-2 right-2 bg-purple-600 text-white text-sm font-bold px-2 py-1 rounded-full">
          {anime.match}% Match
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="text-lg font-semibold mb-1">{anime.title}</h3>
        <div className="text-sm text-gray-500 mb-3">
          {anime.genres.join(', ')}
          {renderScores()}
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-700 line-clamp-2">
            {anime.synopsis ? anime.synopsis.replace(/<[^>]*>/g, '') : ''}
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

      {/* External links */}
      {anime.externalIds && (
        <div className="px-4 pb-2 flex space-x-2 text-xs">
          {anime.externalIds.mal && (
            <a 
              href={`https://myanimelist.net/anime/${anime.externalIds.mal}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View on MAL
            </a>
          )}
          {anime.externalIds.tmdb && (
            <a 
              href={`https://www.themoviedb.org/tv/${anime.externalIds.tmdb}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View on TMDB
            </a>
          )}
        </div>
      )}

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
            {anime.synopsis ? anime.synopsis.replace(/<[^>]*>/g, '') : ''}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
