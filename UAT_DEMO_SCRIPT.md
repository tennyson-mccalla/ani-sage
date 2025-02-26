# ani-sage AI Features: User Acceptance Test Demo Script

## Introduction

Welcome to the ani-sage AI Features demonstration! This script provides a step-by-step guide for showcasing the intelligent recommendation system we've built. This demonstration is designed to show how our AI-powered features can enhance the anime discovery experience through sentiment analysis, user preference learning, and personalized recommendations.

**Target Audience:** Anime enthusiasts, product stakeholders, development team members

**Demo Length:** Approximately 15-20 minutes

## Prerequisites

- Python 3.8+ installed
- OpenAI API key (for live demo)
- Internet connection
- ani-sage repository cloned

## Setup Phase (3 minutes)

1. **Navigate to Project Directory**

   ```bash
   cd ani-sage/worktrees/ai-features
   ```

2. **Install Dependencies**

   Show how easy it is to set up the environment:

   ```bash
   # Create a virtual environment and install dependencies
   ./scripts/install_deps.py

   # Activate the virtual environment
   source ./venv/bin/activate  # or activate_venv.sh
   ```

3. **Configure OpenAI API**

   Demonstrate the configuration process:

   ```bash
   # Set up OpenAI API with the interactive script
   ./scripts/setup_openai.py

   # Enter your API key when prompted
   # Optionally, show additional configurations:
   ./scripts/setup_openai.py --model "gpt-4" --temperature 0.7
   ```

   *Highlight:* "Our configuration system supports multiple sources - environment variables, config files, and command-line arguments - ensuring flexibility for different deployment scenarios."

## Core Features Demo (12-15 minutes)

### 1. Sentiment Analysis (4 minutes)

1. **Introduce the Concept**

   "Sentiment analysis allows us to understand the emotional tone, themes, and target audience of anime descriptions. This helps power our recommendation engine."

2. **Command-Line Demo**

   ```bash
   # Analyze Attack on Titan's description
   ./run_all.py sentiment -t "In a world where humanity lives inside cities surrounded by enormous walls due to the Titans, gigantic humanoid creatures who devour humans seemingly without reason, a young boy named Eren Yeager dreams of exploring the outside world beyond the walls. But his peaceful life is shattered when a Titan breaches the wall and his mother is eaten. Vowing revenge and to reclaim the world from the Titans, Eren and his friends Mikasa and Armin enlist in the Scout Regiment, an elite group of soldiers who fight Titans outside the walls."
   ```

3. **Explain the Output**

   *Expected output might show:*
   - Positivity: -0.25 (slightly negative emotional tone)
   - Intensity: 0.85 (high emotional intensity)
   - Top emotions: fear (0.78), anticipation (0.65), determination (0.62)
   - Themes: survival (0.88), revenge (0.75), adventure (0.72), coming-of-age (0.65)
   - Target audience: teens (0.85), young adults (0.75)

4. **Contrast with Different Anime**

   ```bash
   # Analyze a more lighthearted anime like "My Neighbor Totoro"
   ./run_all.py sentiment -t "Two young girls, Satsuki and Mei, move with their father to a new house in the countryside to be closer to their hospitalized mother. They soon discover that the surrounding forests are home to a family of Totoros, magical creatures who can only be seen by children. The Totoros introduce the girls to a series of adventures, including a ride aboard the Cat Bus, a nightly flying bus ride with the biggest Totoro."
   ```

   *Expected contrast:*
   - Positivity: 0.82 (highly positive)
   - Intensity: 0.45 (moderate emotional intensity)
   - Top emotions: joy (0.85), wonder (0.80), comfort (0.75)
   - Themes: adventure (0.70), fantasy (0.85), family (0.75)
   - Target audience: children (0.90), family (0.85)

5. **Show JSON Output Option**

   ```bash
   # Same analysis but in JSON format for integration with other systems
   ./run_all.py sentiment -t "In a world where humanity lives inside..." -j
   ```

   *Highlight:* "The JSON output makes it easy to integrate with other systems or store results for further analysis."

### 2. User Preference System (3 minutes)

1. **Introduce User Preferences**

   "Our system learns what users like through explicit ratings, genre preferences, current mood, and favorite studios."

2. **Demonstrate Preference Storage**

   Show the data model in `src/ai/preferences/user_preferences.py`:

   ```python
   # Code snippet to highlight
   class UserPreferences(BaseModel):
       # User identification
       user_id: str

       # Explicit ratings
       anime_ratings: Dict[str, AnimeRating] = Field(default_factory=dict)

       # Genre preferences
       genre_preferences: Dict[str, float] = Field(default_factory=dict)

       # Current mood
       current_mood: Mood = Field(default=Mood.ANY)

       # Favorite studios
       favorite_studios: Set[str] = Field(default_factory=set)
   ```

3. **Explain Feature Vector Creation**

   ```python
   # Show the code that creates feature vectors
   def get_feature_vector(self) -> Dict[str, float]:
       features = {}
       # Add genre preferences
       for genre, weight in self.genre_preferences.items():
           features[f"genre_{genre}"] = weight
       # Add favorite studios
       for studio in self.favorite_studios:
           features[f"studio_{studio}"] = 1.0
       # Add mood
       features[f"mood_{self.current_mood.value}"] = 1.0
       return features
   ```

   *Highlight:* "This vector representation allows us to mathematically calculate similarity between user preferences and anime characteristics."

### 3. Recommendation Engine (6 minutes)

1. **Introduce the Recommendation System**

   "Our recommendation engine combines multiple factors to suggest anime that users will enjoy. It considers genre preferences, emotional tone, user mood, and more."

2. **Show Core Logic**

   ```python
   # Show the scoring logic
   total_score = (
       options.genre_weight * genre_score +
       options.studio_weight * studio_score +
       options.mood_weight * mood_score +
       options.sentiment_weight * sentiment_score
   ) / (options.genre_weight + options.studio_weight + options.mood_weight + options.sentiment_weight)
   ```

3. **Run the Interactive Demo**

   ```bash
   # Run the full recommendation demo
   ./scripts/demo_recommendations.py
   ```

4. **Set Example Preferences**

   *For the demo, use the following settings:*
   - Strong preference for action (0.9) and adventure (0.8)
   - Dislike horror (-0.7)
   - Neutral on comedy (0.2)
   - Current mood: Excited

5. **Discuss the Results**

   *Expected recommendations:*
   - "Attack on Titan" (matches action, adventure, and high intensity)
   - "My Hero Academia" (matches action, excitement emotions)
   - "Demon Slayer" (matches action, adventure themes)

   *Highlight explanation:* "Notice how each recommendation comes with a personalized explanation of why it was suggested. This transparency helps users understand the system and builds trust."

6. **Adjust Settings and Compare**

   *Change preferences:*
   - Current mood: Relaxed

   *Expected shift in recommendations:*
   - "A Place Further Than The Universe" (matches adventure with comfort emotions)
   - "Violet Evergarden" (matches the more relaxed emotional tone)

### 4. Color Preference Processing (2 minutes)

1. **Introduce the Concept**

   "Beyond content, we also consider visual aspects of anime, like color palettes and visual styles. This is particularly important for users who are drawn to specific visual aesthetics."

2. **Highlight the Code Architecture**

   Show the structure of `src/ai/preferences/color_preferences.py`:

   ```python
   # Show the color palette and visual style enumerations
   class ColorPalette(str, Enum):
       VIBRANT = "vibrant"
       PASTEL = "pastel"
       DARK = "dark"
       MONOCHROME = "monochrome"
       # etc.

   class VisualStyle(str, Enum):
       REALISTIC = "realistic"
       STYLIZED = "stylized"
       MINIMALIST = "minimalist"
       # etc.
   ```

3. **Explain Potential Applications**

   *Highlight:* "This system could analyze screenshots or key frames from anime to match users with visually similar shows. For example, fans of Studio Ghibli's pastel palette might enjoy other anime with similar visual styles, regardless of genre."

## Integration & Architecture (3 minutes)

1. **Configuration Management**

   Show the `OpenAIConfig` class and configuration loading logic:

   ```python
   # Configuration flexibility
   def _load_config(self) -> OpenAIConfig:
       # First try environment variables
       api_key = os.environ.get("OPENAI_API_KEY")

       # Then try config file
       if not api_key:
           config = get_config()
           if hasattr(config, 'openai_api_key'):
               api_key = config.openai_api_key
           # etc.
   ```

2. **Error Handling & Resilience**

   Show the `AnalysisError` class and handler:

   ```python
   # Custom error types
   class AnalysisError(AniSageError):
       """Exception raised for AI analysis errors."""
       def __init__(
           self,
           message: str,
           code: Optional[str] = None,
           details: Optional[Dict[str, Any]] = None,
           model: Optional[str] = None,
       ):
           if model:
               details = details or {}
               details["model"] = model
           super().__init__(message, code or "ANALYSIS_ERROR", details)
   ```

3. **Testing Framework**

   ```bash
   # Run the comprehensive test suite
   ./run_all.py test
   ```

   *Show test output:* "Our tests automatically skip API-dependent tests when no API key is available, allowing for CI/CD integration without exposing secrets."

## Conclusion & Next Steps (2 minutes)

1. **Summarize Key Benefits**

   - Intelligent recommendations based on multiple factors
   - Sentiment analysis for understanding content tone
   - Flexible user preference system
   - Robust architecture with comprehensive testing

2. **Future Enhancements**

   - **Offline Mode:** "We're planning to add support for cached embeddings and local inference models to enable offline recommendations."
   - **Persistent Storage:** "User preferences will soon be stored in a database for long-term learning."
   - **Advanced Visual Analysis:** "We'll extend color preference processing with actual image analysis of anime screenshots."
   - **Collaborative Filtering:** "Adding collaborative filtering will let us recommend anime based on what similar users enjoyed."

3. **Call to Action**

   "We'd love your feedback on the recommendation quality, the user experience, and which features you'd like to see expanded next."

## Q&A Tips

- **On Accuracy:** "The system improves as more anime are analyzed and user preferences are refined."
- **On Privacy:** "User preference data is stored locally by default, with plans for optional cloud syncing."
- **On API Costs:** "The system uses caching to minimize API calls and supports configurable token limits."
- **On Scaling:** "The modular design allows different components to scale independently."

## Technical Fallbacks

In case of API issues:
1. Use cached responses from previous runs
2. Show sample data files in `docs/examples/`
3. Demonstrate with pre-generated sentiment analysis results

## Closing Notes

End by showing the full project repository structure and highlighting how the modular design supports future extensions while maintaining code quality.
