import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card'
import { Button } from '../components/ui/button'

// Mock recommendation interface - would be replaced by your actual data model
interface Recommendation {
  id: string
  title: string
  image: string
  genres: string[]
  score: number
  synopsis: string
  match: number
  reasons: string[]
}

// Mock data - would be replaced by API calls to your backend
const mockRecommendations: Recommendation[] = [
  {
    id: '1',
    title: 'Fullmetal Alchemist: Brotherhood',
    image: 'https://via.placeholder.com/250x350?text=Anime+Poster',
    genres: ['Action', 'Adventure', 'Drama', 'Fantasy'],
    score: 9.1,
    synopsis: 'Two brothers search for a Philosopher\'s Stone after an attempt to revive their deceased mother goes wrong, changing their bodies.',
    match: 98,
    reasons: [
      'This anime\'s complex moral situations match your psychological preferences',
      'The detailed visuals and dynamic animation style aligns with your preferences',
      'Features the type of character development you enjoy'
    ]
  },
  {
    id: '2',
    title: 'Steins;Gate',
    image: 'https://via.placeholder.com/250x350?text=Anime+Poster',
    genres: ['Sci-Fi', 'Thriller', 'Drama'],
    score: 9.0,
    synopsis: 'A group of friends accidentally create a time machine, leading to dramatic consequences as they attempt to prevent global disaster.',
    match: 95,
    reasons: [
      'The narrative complexity aligns perfectly with your preferences',
      'Features the morally ambiguous situations you enjoy exploring',
      'The emotional tone matches your preferred storytelling style'
    ]
  },
  {
    id: '3',
    title: 'Violet Evergarden',
    image: 'https://via.placeholder.com/250x350?text=Anime+Poster',
    genres: ['Drama', 'Fantasy', 'Slice of Life'],
    score: 8.9,
    synopsis: 'A former soldier becomes a letter writer and explores the meaning of love as she recovers from the war.',
    match: 92,
    reasons: [
      'The beautiful, detailed visuals match your aesthetic preferences',
      'Features the character-driven storytelling you connect with',
      'The emotional tone resonates with your preferences'
    ]
  }
]

export default function Recommendations() {
  const location = useLocation()
  const navigate = useNavigate()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)

  // In a real implementation, this would make an actual API call
  // using the answers from the questionnaire
  useEffect(() => {
    const answers = location.state?.answers || {}
    console.log('Answers received:', answers)
    
    // Simulate API call delay
    setTimeout(() => {
      setRecommendations(mockRecommendations)
      setLoading(false)
    }, 1500)
  }, [location.state])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  }

  return (
    <motion.div
      className="min-h-screen bg-background p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Your Personalized Anime Recommendations</h1>
          <p className="text-muted-foreground">Based on your psychological profile, we've found these anime that might resonate with you</p>
        </header>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Analyzing your psychological profile...</p>
            </div>
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {recommendations.map((rec) => (
              <motion.div key={rec.id} variants={item}>
                <Card className="h-full flex flex-col">
                  <div className="relative aspect-[2/3] w-full">
                    <img 
                      src={rec.image} 
                      alt={rec.title}
                      className="absolute inset-0 w-full h-full object-cover rounded-t-lg"
                    />
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-sm font-bold px-2 py-1 rounded-full">
                      {rec.match}% Match
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle>{rec.title}</CardTitle>
                    <CardDescription>{rec.genres.join(', ')} • {rec.score}/10</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{rec.synopsis}</p>
                    <div>
                      <h4 className="font-medium mb-2 text-sm">Why we recommended this:</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {rec.reasons.map((reason, index) => (
                          <li key={index}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter className="mt-auto">
                    <Button variant="outline" className="w-full">Watch Trailer</Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        <div className="mt-12 flex justify-center">
          <Button onClick={() => navigate('/profile')} variant="secondary" className="mr-4">
            View Full Profile
          </Button>
          <Button onClick={() => navigate('/questions')}>
            Refine Recommendations
          </Button>
        </div>
      </div>
    </motion.div>
  )
}