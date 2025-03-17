import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import Layout from '../components/layout/Layout';
import DimensionDisplay from '../components/profile/DimensionDisplay';
import { useUser } from '../context/UserContext';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile, isLoading, error, applyAdjustments } = useUser();
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyAdjustments = async () => {
    try {
      setIsApplying(true);
      await applyAdjustments();
    } catch (err) {
      console.error('Error applying adjustments:', err);
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-12 px-4 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-700 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !profile) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-12 px-4 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Failed to load profile'}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-purple-800 mb-4">
              Your Psychological Profile
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              This profile helps us find anime that resonates with your unique preferences
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-12">
            <motion.div 
              className="bg-white rounded-lg shadow-md p-6 md:col-span-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-xl font-semibold mb-6 text-gray-800">Your Psychological Dimensions</h2>
              <div className="space-y-4">
                {profile.dimensions.map((dimension, index) => (
                  <DimensionDisplay 
                    key={dimension.name} 
                    dimension={dimension} 
                    index={index} 
                  />
                ))}
              </div>
            </motion.div>

            <motion.div 
              className="bg-white rounded-lg shadow-md p-6 md:col-span-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h2 className="text-xl font-semibold mb-6 text-gray-800">Profile Summary</h2>
              
              <div className="mb-6">
                <h3 className="font-medium text-gray-700 mb-2">Your Top Traits</h3>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-purple-600"></span>
                    <span className="text-sm text-gray-600">Preference for complex narratives</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-purple-600"></span>
                    <span className="text-sm text-gray-600">Enjoy nuanced characters</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-purple-600"></span>
                    <span className="text-sm text-gray-600">Appreciate moral ambiguity</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-purple-600"></span>
                    <span className="text-sm text-gray-600">Favor intellectual engagement</span>
                  </li>
                </ul>
              </div>
              
              {profile.suggestedAdjustments.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-700 mb-2">Suggested Adjustments</h3>
                  {profile.suggestedAdjustments.map((adjustment, index) => (
                    <div key={index} className="bg-purple-50 p-3 rounded-md mb-3">
                      <p className="text-sm font-medium text-purple-800">{adjustment.dimension}</p>
                      <p className="text-xs text-gray-600 mb-2">{adjustment.explanation}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <span>Current: {adjustment.currentValue.toFixed(1)}</span>
                        <div className="mx-2 h-[1px] flex-grow bg-gray-300"></div>
                        <span>Suggested: {adjustment.suggestedValue.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={handleApplyAdjustments}
                    disabled={isApplying}
                    className={`w-full mt-2 py-2 rounded-md text-sm font-medium ${
                      isApplying 
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                        : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                    }`}
                  >
                    {isApplying ? 'Applying...' : 'Apply Suggested Adjustments'}
                  </button>
                </div>
              )}
            </motion.div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => navigate('/questions')}
              className="px-6 py-2 bg-white border border-purple-600 text-purple-600 hover:bg-purple-50 rounded-md font-medium"
            >
              Retake Questionnaire
            </button>
            <button 
              onClick={() => navigate('/recommendations')}
              className="px-6 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-md font-medium"
            >
              View Recommendations
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}