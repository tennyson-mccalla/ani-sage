"""
CLI tool for anime sentiment analysis.

This module provides a command-line interface for analyzing the sentiment
of anime descriptions using the sentiment analysis system.
"""

import argparse
import json
import os
import sys
from typing import Optional, TextIO

from src.ai.sentiment.analyzer import get_sentiment_analyzer
from src.utils.errors import handle_exception, AnalysisError
from src.utils.logging import get_logger, configure_logging

logger = get_logger(__name__)


def analyze_text(text: str, output_format: str = 'text') -> str:
    """Analyze the sentiment of the given text.

    Args:
        text: The text to analyze
        output_format: Output format (text or json)

    Returns:
        str: Formatted analysis results
    """
    analyzer = get_sentiment_analyzer()

    try:
        # Perform analysis
        result = analyzer.analyze(text)

        # Format output
        if output_format == 'json':
            return json.dumps(result.dict(), indent=2)
        else:
            # Text output
            lines = [
                f"Sentiment Analysis Results:",
                f"-------------------------",
                f"Positivity: {result.positivity:.2f} (-1.0 to 1.0)",
                f"Intensity: {result.intensity:.2f} (0.0 to 1.0)",
                f"",
                f"Top Emotions:",
                f"------------"
            ]

            # Sort emotions by score
            sorted_emotions = sorted(
                result.emotions.items(),
                key=lambda x: x[1],
                reverse=True
            )
            for emotion, score in sorted_emotions[:5]:
                if score > 0.1:  # Only show significant emotions
                    lines.append(f"{emotion.capitalize()}: {score:.2f}")

            lines.extend([
                f"",
                f"Themes:",
                f"-------"
            ])

            # Sort themes by score
            sorted_themes = sorted(
                result.themes.items(),
                key=lambda x: x[1],
                reverse=True
            )
            for theme, score in sorted_themes[:5]:
                if score > 0.2:  # Only show significant themes
                    lines.append(f"{theme.replace('_', ' ').capitalize()}: {score:.2f}")

            lines.extend([
                f"",
                f"Target Audience:",
                f"--------------"
            ])

            # Sort audience by score
            sorted_audience = sorted(
                result.target_audience.items(),
                key=lambda x: x[1],
                reverse=True
            )
            for audience, score in sorted_audience[:3]:
                if score > 0.3:  # Only show significant audience groups
                    lines.append(f"{audience.replace('_', ' ').capitalize()}: {score:.2f}")

            return "\n".join(lines)

    except Exception as e:
        handle_exception(e, AnalysisError)
        return f"Error: {str(e)}"


def main():
    """Run the sentiment analysis CLI."""
    parser = argparse.ArgumentParser(
        description="Analyze sentiment of anime descriptions"
    )

    parser.add_argument(
        "-t", "--text",
        help="Text to analyze (if not provided, will read from stdin)"
    )
    parser.add_argument(
        "-f", "--file",
        help="File containing text to analyze"
    )
    parser.add_argument(
        "-j", "--json",
        action="store_true",
        help="Output results as JSON"
    )
    parser.add_argument(
        "-o", "--output",
        help="Output file path (default: stdout)"
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable verbose output"
    )

    args = parser.parse_args()

    # Configure logging
    log_level = "DEBUG" if args.verbose else "INFO"
    configure_logging(log_level=log_level)

    # Get text to analyze
    text = None
    if args.text:
        text = args.text
    elif args.file:
        try:
            with open(args.file, 'r', encoding='utf-8') as f:
                text = f.read()
        except Exception as e:
            logger.error(f"Error reading file: {e}")
            sys.exit(1)
    else:
        # Read from stdin
        logger.info("Reading from stdin (press Ctrl+D to end input)...")
        try:
            text = sys.stdin.read()
        except KeyboardInterrupt:
            logger.info("Input cancelled")
            sys.exit(0)

    if not text or not text.strip():
        logger.error("No text provided for analysis")
        sys.exit(1)

    # Analyze text
    output_format = 'json' if args.json else 'text'
    result = analyze_text(text, output_format)

    # Output results
    if args.output:
        try:
            with open(args.output, 'w', encoding='utf-8') as f:
                f.write(result)
            logger.info(f"Results written to {args.output}")
        except Exception as e:
            logger.error(f"Error writing to output file: {e}")
            sys.exit(1)
    else:
        # Write to stdout
        print(result)


if __name__ == "__main__":
    main()
