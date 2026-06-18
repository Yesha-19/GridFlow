"""
event_schema.py — Pydantic v2 request/response schemas for the Event domain.
"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator, model_validator

from app.utils.constants import EventStatus, EventType


class EventCreate(BaseModel):
    """Payload for POST /events — creating a new tracked event."""

    name: str = Field(..., min_length=2, max_length=255, description="Event display name")
    event_type: EventType = Field(..., description="Category of the event")
    is_planned: bool = Field(True, description="True for pre-scheduled, False for unplanned")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="WGS-84 latitude")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="WGS-84 longitude")
    location_name: Optional[str] = Field(None, max_length=255, description="Human-readable venue")
    crowd_size: int = Field(..., ge=1, le=10_000_000, description="Expected / actual attendees")
    start_time: datetime = Field(..., description="Event start (ISO-8601 with timezone)")
    duration_hours: float = Field(..., gt=0.0, le=168.0, description="Expected duration in hours")
    description: Optional[str] = Field(None, max_length=2000)

    @field_validator("start_time", mode="before")
    @classmethod
    def ensure_timezone_aware(cls, v: datetime) -> datetime:
        """Reject naive datetimes to prevent timezone ambiguity."""
        if isinstance(v, datetime) and v.tzinfo is None:
            raise ValueError("start_time must include timezone info (e.g. 2024-01-15T18:00:00+05:30)")
        return v

    model_config = {"json_schema_extra": {"example": {
        "name": "IPL Final 2025",
        "event_type": "sports",
        "is_planned": True,
        "latitude": 23.0225,
        "longitude": 72.5714,
        "location_name": "Narendra Modi Stadium, Ahmedabad",
        "crowd_size": 132000,
        "start_time": "2025-05-25T19:00:00+05:30",
        "duration_hours": 5.0,
        "description": "IPL 2025 Final match",
    }}}


class EventUpdate(BaseModel):
    """Payload for PATCH /events/{id} — partial update of an event."""

    name: Optional[str] = Field(None, min_length=2, max_length=255)
    crowd_size: Optional[int] = Field(None, ge=1, le=10_000_000)
    status: Optional[EventStatus] = None
    duration_hours: Optional[float] = Field(None, gt=0.0, le=168.0)
    description: Optional[str] = Field(None, max_length=2000)
    location_name: Optional[str] = Field(None, max_length=255)


class EventResponse(BaseModel):
    """Full event record returned by the API."""

    id: uuid.UUID
    name: str
    event_type: str
    is_planned: bool
    latitude: float
    longitude: float
    location_name: Optional[str]
    crowd_size: int
    start_time: datetime
    duration_hours: float
    status: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EventListResponse(BaseModel):
    """Paginated list of events."""

    total: int
    page: int
    page_size: int
    items: list[EventResponse]