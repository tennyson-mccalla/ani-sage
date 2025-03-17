import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import './App.css'

// Pages
import Home from './pages/Home'
import Questionnaire from './pages/Questionnaire'
import Recommendations from './pages/Recommendations'
import Profile from './pages/Profile'

function App() {
  // Mock user state that would normally come from context/auth
  const [user, setUser] = useState<{loggedIn: boolean}>({loggedIn: false})

  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Home user={user} setUser={setUser} />} />
          <Route path="/questions" element={<Questionnaire />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </AnimatePresence>
    </Router>
  )
}

export default App