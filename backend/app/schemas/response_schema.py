"""
response_schema.py — Generic API response envelope for the Gridlock MVP.

Every endpoint wraps its payload in :class:`APIResponse` so the frontend
can rely on a consistent ``{ success, message, data, error }`` shape
regardless of which endpoint was called.
"""

from typing import Any, Generic, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """Standard API response envelope.

    Attributes:
        success: ``True`` when the request was handled without error.
        message: Human-readable status message.
        data:    The actual payload (generic — any Pydantic model or dict).
        error:   Error detail string, present only when ``success`` is False.
    """

    success: bool
    message: str
    data: Optional[T] = None
    error: Optional[str] = None

    @classmethod
    def ok(cls, data: Any = None, message: str = "Success") -> "APIResponse":
        """Construct a successful response.

        Args:
            data:    Response payload.
            message: Optional human-readable status line.

        Returns:
            :class:`APIResponse` with ``success=True``.
        """
        return cls(success=True, message=message, data=data)

    @classmethod
    def fail(cls, error: str, message: str = "Request failed") -> "APIResponse":
        """Construct an error response.

        Args:
            error:   Developer-facing error detail.
            message: User-facing status line.

        Returns:
            :class:`APIResponse` with ``success=False``.
        """
        return cls(success=False, message=message, error=error)


class HealthResponse(BaseModel):
    """Liveness / readiness probe response."""

    status: str             # "ok" | "degraded"
    version: str
    database: str           # "connected" | "unavailable"
    model_loaded: bool