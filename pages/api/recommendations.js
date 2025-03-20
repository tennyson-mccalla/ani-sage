// Simple recommendations API endpoint that returns mock data with trailers

export default function handler(req, res) {
  // Get session ID from query params
  const { sessionId } = req.query;
  
  if (!sessionId) {
    return res.status(400).json({ 
      error: 'bad_request',
      message: 'Missing sessionId' 
    });
  }
  
  // Log that we're using the fallback API
  console.log('Using Pages API for recommendations with sessionId:', sessionId);
  
  // Return mock recommendations with trailers
  const mockRecommendations = [
    {
      id: '1',
      title: 'Fullmetal Alchemist: Brotherhood',
      image: 'https://cdn.myanimelist.net/images/anime/1223/96541.jpg',
      genres: ['Action', 'Adventure', 'Drama', 'Fantasy'],
      score: 9.1,
      synopsis: 'Two brothers search for a Philosopher\'s Stone after an attempt to revive their deceased mother goes wrong, changing their bodies.',
      match: 98,
      reasons: [
        'The moral complexities align with your preferences',
        'The detailed visuals match your aesthetic taste',
        'The character growth elements you value'
      ],
      trailer: 'https://www.youtube.com/watch?v=--IcmZkvL0Q'
    },
    {
      id: '2',
      title: 'Steins;Gate',
      image: 'https://cdn.myanimelist.net/images/anime/5/73199.jpg',
      genres: ['Sci-Fi', 'Thriller', 'Drama'],
      score: 9.0,
      synopsis: 'A group of friends accidentally create a time machine, leading to dramatic consequences as they attempt to prevent global disaster.',
      match: 95,
      reasons: [
        'The narrative complexity that engages you',
        'The emotional intensity you prefer',
        'The character dynamics you connect with'
      ],
      trailer: 'https://www.youtube.com/watch?v=27OZc-ku6is'
    },
    {
      id: '3',
      title: 'Violet Evergarden',
      image: 'https://cdn.myanimelist.net/images/anime/1795/95088.jpg',
      genres: ['Drama', 'Fantasy', 'Slice of Life'],
      score: 8.9,
      synopsis: 'A former soldier becomes a letter writer and explores the meaning of love as she recovers from the war.',
      match: 92,
      reasons: [
        'The emotional depth that resonates with you',
        'The detailed visuals that match your preferences',
        'The character-driven narrative you enjoy'
      ],
      trailer: 'https://www.youtube.com/watch?v=0CJeDetA45Q'
    },
    {
      id: '4',
      title: 'Attack on Titan',
      image: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg',
      genres: ['Action', 'Drama', 'Fantasy', 'Mystery'],
      score: 8.5,
      synopsis: 'In a world where humanity lives within cities surrounded by enormous walls due to the Titans, gigantic humanoid creatures who devour humans seemingly without reason.',
      match: 90,
      reasons: [
        'The intense action sequences match your preferences',
        'The moral ambiguity aligns with your taste',
        'The mystery elements keep you engaged'
      ],
      trailer: 'https://www.youtube.com/watch?v=MGRm4IzK1SQ'
    },
    {
      id: '5',
      title: 'Your Name',
      image: 'https://cdn.myanimelist.net/images/anime/5/87048.jpg',
      genres: ['Romance', 'Supernatural', 'Drama'],
      score: 9.0,
      synopsis: 'Two strangers find themselves linked in a bizarre way. When a connection forms, will distance be the only thing to keep them apart?',
      match: 88,
      reasons: [
        'The beautiful visuals align with your preferences',
        'The emotional depth resonates with your taste',
        'The supernatural elements add intrigue'
      ],
      trailer: 'https://www.youtube.com/watch?v=xU47nhruN-Q'
    }
  ];
  
  return res.status(200).json({
    recommendations: mockRecommendations
  });
}