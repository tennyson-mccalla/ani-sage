#!/usr/bin/env python3
"""
Runner script for ani-sage AI features.

This script provides a command-line interface for running tests, demos,
and other AI feature utilities.
"""

import os
import sys
import argparse
import subprocess
from pathlib import Path


def run_tests(args):
    """Run unit tests for AI features.

    Args:
        args: Command-line arguments
    """
    print("===== Running AI Feature Tests =====")

    # Determine which tests to run
    if args.test:
        test_path = f"tests/test_{args.test}.py"
        if not Path(test_path).exists():
            print(f"Error: Test file {test_path} does not exist.")
            return 1

        cmd = [sys.executable, "-m", "unittest", test_path]
    else:
        cmd = [sys.executable, "-m", "unittest", "discover", "-s", "tests"]

    # Set verbosity
    if args.verbose:
        cmd.append("-v")

    # Run the tests
    return subprocess.call(cmd)


def run_demo(args):
    """Run the demo script.

    Args:
        args: Command-line arguments
    """
    print("===== Running AI Features Demo =====")

    script_path = "scripts/demo_recommendations.py"
    if not Path(script_path).exists():
        print(f"Error: Demo script {script_path} does not exist.")
        return 1

    cmd = [sys.executable, script_path]

    return subprocess.call(cmd)


def run_sentiment_cli(args):
    """Run the sentiment analysis CLI.

    Args:
        args: Command-line arguments
    """
    print("===== Running Sentiment Analysis CLI =====")

    script_path = "src/cli/sentiment_cli.py"
    if not Path(script_path).exists():
        print(f"Error: Sentiment CLI script {script_path} does not exist.")
        return 1

    # Build command
    cmd = [sys.executable, script_path]

    if args.text:
        cmd.extend(["-t", args.text])

    if args.file:
        cmd.extend(["-f", args.file])

    if args.json:
        cmd.append("-j")

    if args.output:
        cmd.extend(["-o", args.output])

    if args.verbose:
        cmd.append("-v")

    return subprocess.call(cmd)


def setup_openai(args):
    """Run the OpenAI API setup script.

    Args:
        args: Command-line arguments
    """
    print("===== Running OpenAI API Setup =====")

    script_path = "scripts/setup_openai.py"
    if not Path(script_path).exists():
        print(f"Error: OpenAI setup script {script_path} does not exist.")
        return 1

    # Build command
    cmd = [sys.executable, script_path]

    if args.api_key:
        cmd.extend(["--api-key", args.api_key])

    if args.organization:
        cmd.extend(["--organization", args.organization])

    if args.model:
        cmd.extend(["--model", args.model])

    if args.embedding_model:
        cmd.extend(["--embedding-model", args.embedding_model])

    if args.max_tokens:
        cmd.extend(["--max-tokens", str(args.max_tokens)])

    if args.temperature:
        cmd.extend(["--temperature", str(args.temperature)])

    if args.verbose:
        cmd.append("--verbose")

    return subprocess.call(cmd)


def run_recommendation_cli(args):
    """Run the recommendation engine CLI.

    Args:
        args: Command-line arguments
    """
    print("===== Running Recommendation Engine CLI =====")

    script_path = "scripts/demo_recommendations.py"
    if not Path(script_path).exists():
        print(f"Error: Recommendation CLI script {script_path} does not exist.")
        return 1

    # Build command
    cmd = [sys.executable, script_path]

    # Add arguments for trailer options
    if args.no_trailers:
        cmd.extend(["--no-trailers"])

    if args.limit:
        cmd.extend(["--limit", str(args.limit)])

    # Add new argument for FZF interface
    if args.interactive:
        cmd.append("--interactive")

    # Add demo mode flag if specified
    if args.demo_mode:
        cmd.append("--demo-mode")

    if args.verbose:
        cmd.append("-v")

    return subprocess.call(cmd)


def check_environment():
    """Check for required environment variables and dependencies.

    Returns:
        bool: True if environment is ready, False otherwise
    """
    # Check for OpenAI API key
    if not os.environ.get("OPENAI_API_KEY"):
        print("Warning: OPENAI_API_KEY environment variable not set.")
        print("Some features may not work correctly.")
        print("Use 'setup-openai' command to configure API keys.")
        print("")

    # Check for required packages
    try:
        import openai
        print(f"Using OpenAI package version: {openai.__version__}")
    except ImportError:
        print("Error: OpenAI package not found. Install with:")
        print("pip install openai>=1.5.0")
        return False

    try:
        import pydantic
        print(f"Using Pydantic package version: {pydantic.__version__}")
    except ImportError:
        print("Error: Pydantic package not found. Install with:")
        print("pip install pydantic>=2.5.0")
        return False

    return True


def main():
    """Run the runner script."""
    # Create main parser
    parser = argparse.ArgumentParser(
        description="Runner for ani-sage AI features"
    )

    # Global verbose flag used by all commands
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable verbose output"
    )

    # Create subparsers for different commands
    subparsers = parser.add_subparsers(
        dest="command",
        help="Command to run"
    )

    # Test command
    test_parser = subparsers.add_parser(
        "test",
        help="Run unit tests"
    )
    test_parser.add_argument(
        "test",
        nargs="?",
        help="Specific test to run (e.g., 'sentiment_analyzer')"
    )
    # Add verbose flag to test command specifically
    test_parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable verbose output for tests"
    )

    # Demo command
    demo_parser = subparsers.add_parser(
        "demo",
        help="Run the demo script"
    )

    # Sentiment CLI command
    sentiment_parser = subparsers.add_parser(
        "sentiment",
        help="Run the sentiment analysis CLI"
    )
    sentiment_parser.add_argument(
        "-t", "--text",
        help="Text to analyze"
    )
    sentiment_parser.add_argument(
        "-f", "--file",
        help="File containing text to analyze"
    )
    sentiment_parser.add_argument(
        "-j", "--json",
        action="store_true",
        help="Output results as JSON"
    )
    sentiment_parser.add_argument(
        "-o", "--output",
        help="Output file path"
    )
    # Add verbose flag to sentiment command specifically
    sentiment_parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable verbose output for sentiment analysis"
    )

    # Recommendation CLI command
    recommendation_parser = subparsers.add_parser(
        "recommend",
        help="Run the recommendation engine CLI"
    )
    recommendation_parser.add_argument(
        "--no-trailers",
        action="store_true",
        help="Disable trailer lookups"
    )
    recommendation_parser.add_argument(
        "--limit",
        type=int,
        default=5,
        help="Maximum number of recommendations to show"
    )
    # Add new argument for FZF interface
    recommendation_parser.add_argument(
        "-i", "--interactive",
        action="store_true",
        help="Use interactive FZF interface for selection"
    )
    # Add demo mode argument
    recommendation_parser.add_argument(
        "--demo-mode",
        action="store_true",
        help="Run in demo mode without API calls"
    )

    # Setup OpenAI command
    setup_parser = subparsers.add_parser(
        "setup-openai",
        help="Set up OpenAI API configuration"
    )
    setup_parser.add_argument(
        "-k", "--api-key",
        help="OpenAI API key"
    )
    setup_parser.add_argument(
        "-o", "--organization",
        help="OpenAI organization ID"
    )
    setup_parser.add_argument(
        "-m", "--model",
        help="Model to use for completions"
    )
    setup_parser.add_argument(
        "-e", "--embedding-model",
        help="Model to use for embeddings"
    )
    setup_parser.add_argument(
        "-t", "--max-tokens",
        type=int,
        help="Maximum tokens for completions"
    )
    setup_parser.add_argument(
        "-p", "--temperature",
        type=float,
        help="Temperature for completions"
    )
    # Add verbose flag to setup command specifically
    setup_parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable verbose output for setup"
    )

    # Parse arguments
    args = parser.parse_args()

    # Check environment
    check_environment()

    # Run the appropriate command
    if args.command == "test":
        return run_tests(args)
    elif args.command == "demo":
        return run_demo(args)
    elif args.command == "sentiment":
        return run_sentiment_cli(args)
    elif args.command == "recommend":
        return run_recommendation_cli(args)
    elif args.command == "setup-openai":
        return setup_openai(args)
    else:
        # If no command specified, print help
        parser.print_help()
        return 0


if __name__ == "__main__":
    sys.exit(main())
