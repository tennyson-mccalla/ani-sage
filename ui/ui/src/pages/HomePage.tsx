import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="w-full max-w-3xl text-center">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-purple-800 mb-6">
              Ani-Sage
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-6">
              Discover anime that resonates with your psychological profile
            </p>
            <p className="text-lg text-gray-600 mb-12">
              Our unique algorithm matches you with anime based on your psychological preferences,
              not just genre tags or explicit ratings.
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="space-y-6"
          >
            <button
              onClick={() => navigate('/questions')}
              className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white text-lg font-medium rounded-md shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              Find Your Perfect Anime
            </button>
            
            <p className="text-sm text-gray-500">
              Answer a few questions to get personalized recommendations
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <div className="bg-white p-5 rounded-lg shadow-md">
              <div className="text-purple-600 text-3xl font-bold mb-2">1.</div>
              <h3 className="font-medium text-lg mb-2">Answer Questions</h3>
              <p className="text-gray-600 text-sm">No explicit preferences needed, just respond to our uniquely designed questions.</p>
            </div>
            
            <div className="bg-white p-5 rounded-lg shadow-md">
              <div className="text-purple-600 text-3xl font-bold mb-2">2.</div>
              <h3 className="font-medium text-lg mb-2">Build Your Profile</h3>
              <p className="text-gray-600 text-sm">We analyze your responses to create your unique psychological profile.</p>
            </div>
            
            <div className="bg-white p-5 rounded-lg shadow-md">
              <div className="text-purple-600 text-3xl font-bold mb-2">3.</div>
              <h3 className="font-medium text-lg mb-2">Get Recommendations</h3>
              <p className="text-gray-600 text-sm">Receive personalized anime recommendations that truly match your preferences.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}