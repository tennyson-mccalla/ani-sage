'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import AnimeCard, { AnimeRecommendation } from '../components/recommendations/AnimeCard';
import { apiService } from '../services/api';
import { useUser } from '../context/UserContext';

export default function RecommendationsPage() {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<AnimeRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const { sessionId, updateProfile } = useUser();

  useEffect(() => {
    // Call API to get recommendations
    const fetchRecommendations = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Use session ID from context
        
        // Get recommendations
        const data = await apiService.getRecommendations({}, sessionId);
        setRecommendations(data);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Failed to load recommendations. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const filteredRecommendations = filter === 'all'
    ? recommendations
    : recommendations.filter(rec => rec.genres.includes(filter));

  // Extract unique genres for filtering
  const allGenres = recommendations.flatMap(rec => rec.genres);
  const uniqueGenres = Array.from(new Set(allGenres)).sort();

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-purple-800 mb-4">
            Your Personalized Anime Recommendations
          </h1>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Based on your psychological profile, we've found these anime that align with your preferences
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-700 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Analyzing your psychological profile...</p>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  filter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-purple-100'
                }`}
              >
                All Genres
              </button>
              {uniqueGenres.map(genre => (
                <button
                  key={genre}
                  onClick={() => setFilter(genre)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    filter === genre
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-purple-100'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>

            {/* Recommendations grid */}
            <AnimatePresence>
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {filteredRecommendations.map((recommendation, index) => (
                  <AnimeCard
                    key={recommendation.id}
                    anime={recommendation}
                    index={index}
                  />
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Buttons */}
            <div className="mt-12 flex flex-wrap justify-center gap-4">
              <button
                onClick={() => router.push('/profile')}
                className="px-6 py-2 bg-white border border-purple-600 text-purple-600 hover:bg-purple-50 rounded-md font-medium"
              >
                View Your Profile
              </button>
              <button
                onClick={() => router.push('/questions')}
                className="px-6 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-md font-medium"
              >
                Refine Recommendations
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
