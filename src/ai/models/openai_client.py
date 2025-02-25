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
    organization: Optional[str] = None
    model: str = "gpt-3.5-turbo"
    embedding_model: str = "text-embedding-ada-002"
    max_tokens: int = 256
    temperature: float = 0.7


class OpenAIClient:
    """Client for interacting with OpenAI APIs."""

    def __init__(self, config: Optional[OpenAIConfig] = None):
        """Initialize the OpenAI client with the given configuration.

        Args:
            config: OpenAI configuration. If not provided, will be loaded from
                environment variables or the configuration file.
        """
        self.config = config or self._load_config()
        self.client = OpenAI(
            api_key=self.config.api_key,
            organization=self.config.organization
        )
        logger.debug("OpenAI client initialized")

    def _load_config(self) -> OpenAIConfig:
        """Load OpenAI configuration from environment or config file.

        Returns:
            OpenAIConfig: The loaded configuration.

        Raises:
            ConfigError: If the API key is not provided.
        """
        # Try to get API key from environment
        api_key = os.environ.get("OPENAI_API_KEY")

        # Try to get from config system if available
        if not api_key:
            config = get_config()
            # Check for OPENAI_API_KEY in field attributes
            if hasattr(config, 'openai_api_key') and config.openai_api_key:
                api_key = config.openai_api_key
            # If not available as field, try dict-like access
            elif hasattr(config, 'get_section'):
                try:
                    # Try accessing from an AI section if it exists
                    ai_config = config.get_section('ai')
                    if 'openai_api_key' in ai_config:
                        api_key = ai_config['openai_api_key']
                except:
                    # If ai section doesn't exist or other error, try legacy dict access
                    try:
                        legacy_config = config.get_section('apis')
                        if 'openai' in legacy_config and 'api_key' in legacy_config['openai']:
                            api_key = legacy_config['openai']['api_key']
                    except:
                        # Unable to find API key in config
                        pass

        if not api_key:
            raise ConfigError("OpenAI API key not found in environment or config. Set OPENAI_API_KEY environment variable.")

        # Get organization
        organization = os.environ.get("OPENAI_ORGANIZATION")
        if not organization:
            config = get_config()
            if hasattr(config, 'openai_organization') and config.openai_organization:
                organization = config.openai_organization
            elif hasattr(config, 'get_section'):
                try:
                    ai_config = config.get_section('ai')
                    if 'openai_organization' in ai_config:
                        organization = ai_config['openai_organization']
                except:
                    pass

        # Get other settings
        model = os.environ.get("OPENAI_MODEL", "gpt-3.5-turbo")
        embedding_model = os.environ.get("OPENAI_EMBEDDING_MODEL", "text-embedding-ada-002")
        max_tokens = int(os.environ.get("OPENAI_MAX_TOKENS", "256"))
        temperature = float(os.environ.get("OPENAI_TEMPERATURE", "0.7"))

        # Try to get other settings from config if they exist
        config = get_config()
        if hasattr(config, 'openai_model'):
            model = config.openai_model
        if hasattr(config, 'openai_embedding_model'):
            embedding_model = config.openai_embedding_model
        if hasattr(config, 'openai_max_tokens'):
            max_tokens = config.openai_max_tokens
        if hasattr(config, 'openai_temperature'):
            temperature = config.openai_temperature

        # If get_section is available, try that as well
        if hasattr(config, 'get_section'):
            try:
                ai_config = config.get_section('ai')
                model = ai_config.get('openai_model', model)
                embedding_model = ai_config.get('openai_embedding_model', embedding_model)
                max_tokens = ai_config.get('openai_max_tokens', max_tokens)
                temperature = ai_config.get('openai_temperature', temperature)
            except:
                pass

        return OpenAIConfig(
            api_key=api_key,
            organization=organization,
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
