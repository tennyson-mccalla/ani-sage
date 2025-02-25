"""
OpenAI API client for ani-sage AI features.

This module provides a client for interacting with OpenAI's API services,
including embeddings and text generation capabilities.
"""

import os
from typing import Dict, List, Optional, Any, Union

import openai
from openai import OpenAI
from pydantic import BaseModel

from src.utils.config import get_config
from src.utils.errors import APIError, ConfigError
from src.utils.logging import get_logger

logger = get_logger(__name__)


class OpenAIConfig(BaseModel):
    """Configuration for the OpenAI client."""
    api_key: str
    model: str = "gpt-3.5-turbo"
    embedding_model: str = "text-embedding-ada-002"
    max_tokens: int = 1024
    temperature: float = 0.7


class OpenAIClient:
    """OpenAI API client for text generation."""

    def __init__(self, config: Optional[OpenAIConfig] = None):
        """Initialize the OpenAI client.

        Args:
            config: Configuration for the client.
                If None, will load from environment variables.
        """
        self.config = config or self._load_config()

        # Initialize client with simple configuration
        self.client = OpenAI(
            api_key=self.config.api_key,
            max_retries=3,
            timeout=60.0
        )
        logger.debug("OpenAI client initialized")

    def _load_config(self) -> OpenAIConfig:
        """Load configuration from environment variables or config file.

        Returns:
            OpenAIConfig: Configuration for the OpenAI client

        Raises:
            ConfigError: If the API key is not found
        """
        # First try environment variables
        api_key = os.environ.get("OPENAI_API_KEY")
        model = os.environ.get("OPENAI_MODEL", "gpt-3.5-turbo")

        # Initialize config variable for future checks
        config = None

        # Then try config file
        if not api_key or not model:
            config = get_config()

            # Try to get API key from config
            if not api_key:
                if hasattr(config, 'openai_api_key'):
                    api_key = config.openai_api_key
                elif hasattr(config, 'get_section'):
                    try:
                        # Try accessing from an AI section if it exists
                        ai_config = config.get_section('ai')
                        logger.debug(f"AI config section: {ai_config}")

                        # Check if the API key is directly in the ai section
                        if 'openai_api_key' in ai_config:
                            api_key = ai_config['openai_api_key']
                        # Check if there's an openai subsection with the api_key
                        elif 'openai' in ai_config and 'api_key' in ai_config['openai']:
                            api_key = ai_config['openai']['api_key']
                    except Exception as e:
                        logger.debug(f"Error accessing AI section: {e}")
                        # If ai section doesn't exist or other error, try legacy dict access
                        try:
                            legacy_config = config.get_section('apis')
                            if 'openai' in legacy_config and 'api_key' in legacy_config['openai']:
                                api_key = legacy_config['openai']['api_key']
                        except Exception as e:
                            logger.debug(f"Error accessing legacy APIs section: {e}")
                            # Unable to find API key in config
                            pass

        if not api_key:
            raise ConfigError("OpenAI API key not found in environment or config. Set OPENAI_API_KEY environment variable.")

        # Get model from config if needed
        if config and not model:
            if hasattr(config, 'openai_model') and config.openai_model:
                model = config.openai_model
            elif hasattr(config, 'get_section'):
                try:
                    ai_config = config.get_section('ai')
                    if 'openai_model' in ai_config:
                        model = ai_config['openai_model']
                    elif 'openai' in ai_config and 'model' in ai_config['openai']:
                        model = ai_config['openai']['model']
                except Exception as e:
                    logger.debug(f"Error accessing model from AI section: {e}")

        # Get embedding model
        embedding_model = os.environ.get("OPENAI_EMBEDDING_MODEL", "text-embedding-ada-002")
        if config:
            if hasattr(config, 'openai_embedding_model') and config.openai_embedding_model:
                embedding_model = config.openai_embedding_model
            elif hasattr(config, 'get_section'):
                try:
                    ai_config = config.get_section('ai')
                    if 'openai_embedding_model' in ai_config:
                        embedding_model = ai_config['openai_embedding_model']
                    elif 'openai' in ai_config and 'embedding_model' in ai_config['openai']:
                        embedding_model = ai_config['openai']['embedding_model']
                except Exception as e:
                    logger.debug(f"Error accessing embedding model from AI section: {e}")

        # Get max tokens
        max_tokens = os.environ.get("OPENAI_MAX_TOKENS")
        if max_tokens:
            max_tokens = int(max_tokens)
        else:
            max_tokens = 1024
            if config:
                if hasattr(config, 'openai_max_tokens') and config.openai_max_tokens:
                    max_tokens = config.openai_max_tokens
                elif hasattr(config, 'get_section'):
                    try:
                        ai_config = config.get_section('ai')
                        if 'openai_max_tokens' in ai_config:
                            max_tokens = ai_config['openai_max_tokens']
                        elif 'openai' in ai_config and 'max_tokens' in ai_config['openai']:
                            max_tokens = ai_config['openai']['max_tokens']
                    except Exception as e:
                        logger.debug(f"Error accessing max tokens from AI section: {e}")

        # Get temperature
        temperature = os.environ.get("OPENAI_TEMPERATURE")
        if temperature:
            temperature = float(temperature)
        else:
            temperature = 0.7
            if config:
                if hasattr(config, 'openai_temperature') and config.openai_temperature:
                    temperature = config.openai_temperature
                elif hasattr(config, 'get_section'):
                    try:
                        ai_config = config.get_section('ai')
                        if 'openai_temperature' in ai_config:
                            temperature = ai_config['openai_temperature']
                        elif 'openai' in ai_config and 'temperature' in ai_config['openai']:
                            temperature = ai_config['openai']['temperature']
                    except Exception as e:
                        logger.debug(f"Error accessing temperature from AI section: {e}")

        return OpenAIConfig(
            api_key=api_key,
            model=model,
            embedding_model=embedding_model,
            max_tokens=max_tokens,
            temperature=temperature
        )

    def get_embedding(self, text: str) -> List[float]:
        """Get an embedding vector for the given text.

        Args:
            text: The text to get an embedding for.

        Returns:
            List[float]: The embedding vector.

        Raises:
            APIError: If there's an error communicating with the OpenAI API.
        """
        try:
            logger.debug(f"Getting embedding for text (length: {len(text)})")
            response = self.client.embeddings.create(
                model=self.config.embedding_model,
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Error getting embedding: {e}")
            raise APIError(f"Error getting embedding from OpenAI: {e}")

    def analyze_text(self, text: str, prompt: Optional[str] = None) -> str:
        """Analyze text using the OpenAI model.

        Args:
            text: The text to analyze.
            prompt: Optional prompt to guide the analysis.

        Returns:
            str: The analysis result.

        Raises:
            APIError: If there's an error communicating with the OpenAI API.
        """
        content = prompt + "\n\n" + text if prompt else text

        try:
            logger.debug(f"Analyzing text with OpenAI (length: {len(text)})")
            response = self.client.chat.completions.create(
                model=self.config.model,
                messages=[{"role": "user", "content": content}],
                max_tokens=self.config.max_tokens,
                temperature=self.config.temperature
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error analyzing text: {e}")
            raise APIError(f"Error analyzing text with OpenAI: {e}")


# Singleton instance for reuse
_openai_client = None


def get_openai_client() -> OpenAIClient:
    """Get a singleton instance of the OpenAI client.

    Returns:
        OpenAIClient: The OpenAI client instance.
    """
    global _openai_client
    if _openai_client is None:
        _openai_client = OpenAIClient()
    return _openai_client
