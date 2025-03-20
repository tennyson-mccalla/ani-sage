// Mock data for API fallbacks

export const mockQuestions = [
  {
    id: 'visual-style',
    type: 'text',
    text: 'Which visual style do you prefer in anime?',
    options: [
      { id: 'clean-simple', text: 'Clean and simple visuals, with emphasis on character expressions' },
      { id: 'balanced', text: 'Balanced visuals with moderate detail' },
      { id: 'detailed', text: 'Highly detailed and intricate visuals' },
      { id: 'dynamic', text: 'Dynamic and energetic visuals with lots of movement' }
    ]
  },
  {
    id: 'narrative-complexity',
    type: 'text',
    text: 'How do you feel about complex storylines?',
    options: [
      { id: 'low-complexity', text: 'I prefer straightforward stories that are easy to follow' },
      { id: 'medium-complexity', text: 'I enjoy some complexity but don\'t want to feel lost' },
      { id: 'high-complexity', text: 'I love intricate plots with multiple layers and twists' }
    ]
  },
  {
    id: 'character-depth',
    type: 'text',
    text: 'What kind of characters do you connect with most?',
    options: [
      { id: 'simple-characters', text: 'Clear, straightforward characters with defined traits' },
      { id: 'balanced-characters', text: 'Characters with some depth but still relatable' },
      { id: 'complex-characters', text: 'Deep, nuanced characters with internal conflicts and growth' }
    ]
  },
  {
    id: 'moral-ambiguity',
    type: 'scenario',
    text: 'In stories, do you prefer:',
    options: [
      { id: 'clear-morals', text: 'Clear heroes and villains with defined moral boundaries' },
      { id: 'nuanced-morals', text: 'Characters with understandable motivations even when doing wrong' },
      { id: 'ambiguous', text: 'Morally ambiguous situations where right and wrong aren\'t clear' }
    ]
  },
  {
    id: 'emotional-tone',
    type: 'text',
    text: 'Which emotional tone do you prefer in stories?',
    options: [
      { id: 'light-optimistic', text: 'Light and optimistic' },
      { id: 'exciting-uplifting', text: 'Exciting and uplifting' },
      { id: 'dark-serious', text: 'Dark and serious' },
      { id: 'bittersweet-reflective', text: 'Bittersweet and reflective' }
    ]
  }
];