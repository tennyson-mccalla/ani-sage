import { motion } from 'framer-motion'
import { Button } from '../components/ui/button'
import { useNavigate } from 'react-router-dom'

interface HomeProps {
  user: { loggedIn: boolean }
  setUser: (user: { loggedIn: boolean }) => void
}

export default function Home({ user, setUser }: HomeProps) {
  const navigate = useNavigate()

  const handleStart = () => {
    // If not logged in, simulated login
    if (!user.loggedIn) {
      setUser({ loggedIn: true })
    }
    navigate('/questions')
  }

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center bg-background p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="max-w-2xl mx-auto text-center">
        <motion.div 
          initial={{ y: -20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Ani-Sage
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Discover anime that resonates with your psychological profile
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ delay: 0.4 }}
        >
          <Button onClick={handleStart} size="lg" className="text-lg px-8 py-6">
            Find Your Perfect Anime
          </Button>
          
          <p className="mt-4 text-sm text-muted-foreground">
            Answer a few questions to get personalized recommendations
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}