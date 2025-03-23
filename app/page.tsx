'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Home() {
  return (
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
          <Link
            href="/questions"
            className="inline-block px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white text-lg font-medium rounded-md shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            Find Your Perfect Anime
          </Link>

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
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.7 }}
          className="mt-12 bg-white p-5 rounded-lg shadow-md"
        >
          <h2 className="text-lg font-medium mb-3">Debug & Testing Tools</h2>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/test-images" className="bg-blue-100 p-2 rounded hover:bg-blue-200 text-sm">
              API Images Test
            </Link>
            <Link href="/test-manual-images" className="bg-blue-100 p-2 rounded hover:bg-blue-200 text-sm">
              Manual Images Test
            </Link>
            <a href="/debug-recommendations.html" target="_blank" className="bg-blue-100 p-2 rounded hover:bg-blue-200 text-sm font-semibold">
              Debug Recommendations
            </a>
            <a href="/test-tmdb-images.html" target="_blank" className="bg-blue-100 p-2 rounded hover:bg-blue-200 text-sm">
              Direct Image Test
            </a>
            <Link href="/api/v1/debug" className="bg-blue-100 p-2 rounded hover:bg-blue-200 text-sm">
              Debug API
            </Link>
            <Link href="/api/v1/debug/recommendations" className="bg-blue-100 p-2 rounded hover:bg-blue-200 text-sm">
              Debug Recommendations API
            </Link>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            These tools help troubleshoot image loading and recommendation issues
          </div>
        </motion.div>
      </div>
    </div>
  );
}
