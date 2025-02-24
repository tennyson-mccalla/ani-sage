class APIError(Exception):
    """Base exception for API-related errors."""
    def __init__(self, message: str, status_code: int = None):
        super().__init__(message)
        self.status_code = status_code

class RateLimitError(APIError):
    """Exception raised when API rate limit is exceeded."""
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(message, status_code=429)

class AuthenticationError(APIError):
    """Exception raised for authentication failures."""
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, status_code=401)

class ValidationError(APIError):
    """Exception raised for invalid request data."""
    def __init__(self, message: str = "Invalid request data"):
        super().__init__(message, status_code=400)

class NotFoundError(APIError):
    """Exception raised when requested resource is not found."""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status_code=404)
