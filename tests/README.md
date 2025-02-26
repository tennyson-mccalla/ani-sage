# ani-sage AI Features Tests

This directory contains unit tests for the ani-sage AI features.

## Running Tests

To run all tests in this directory, use the following command from the project root directory:

```bash
python -m unittest discover -s worktrees/ai-features/tests
```

To run a specific test file:

```bash
python -m unittest worktrees/ai-features/tests/test_sentiment_analyzer.py
```

To run a specific test case:

```bash
python -m unittest worktrees/ai-features/tests.test_sentiment_analyzer.TestSentimentAnalyzer
```

To run a specific test method:

```bash
python -m unittest worktrees/ai-features/tests.test_sentiment_analyzer.TestSentimentAnalyzer.test_analyze_success
```

## Test Requirements

The tests require the following:

1. Access to all ani-sage modules
2. For the full test suite, an OpenAI API key set in the `OPENAI_API_KEY` environment variable
3. Python unittest package (included in standard library)

If the OpenAI API key is not provided, tests that require API access will be skipped.

## Test Coverage

The tests cover the following components:

- **Sentiment Analyzer**: Tests for analyzing text sentiment, handling errors, and processing different types of content.
- **Recommendation Engine**: Tests for generating recommendations based on different user preferences and criteria.
- **User Preferences**: Tests for storing, updating, and retrieving user preferences.

## Mock Testing

Many tests use the `unittest.mock` module to mock API calls to external services, particularly OpenAI's API. This allows testing functionality without making actual API calls.

## Adding New Tests

When adding new tests:

1. Create a new test file with the prefix `test_` (e.g., `test_new_feature.py`)
2. Create a test class that inherits from `unittest.TestCase`
3. Add test methods with names starting with `test_`
4. Run the tests to ensure they pass

## Continuous Integration

In a CI environment, you can run the tests with this command:

```bash
python -m unittest discover -s worktrees/ai-features/tests
```

Set the `OPENAI_API_KEY` environment variable to enable full test coverage.
