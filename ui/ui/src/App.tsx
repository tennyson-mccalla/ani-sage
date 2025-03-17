import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-purple-50 p-6">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-purple-800 mb-6">
          Ani-Sage
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Discover anime that resonates with your psychological profile
        </p>

        <button 
          onClick={() => setCount(count + 1)} 
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg px-8 py-6 rounded-md"
        >
          Find Your Perfect Anime
        </button>
        
        <p className="mt-4 text-sm text-gray-500">
          Answer a few questions to get personalized recommendations
        </p>
        
        <p className="mt-8">Button clicked: {count} times</p>
      </div>
    </div>
  )
}

export default App