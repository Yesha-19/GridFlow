"""
prediction_schema.py — Pydantic v2 schemas for the Prediction domain.
"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class PredictionResponse(BaseModel):
    """Full prediction record including all engine outputs."""

    id: uuid.UUID
    event_id: uuid.UUID
    congestion_risk_score: float = Field(..., ge=0.0, le=100.0)
    risk_level: str                             # low / medium / high / critical
    peak_congestion_time: Optional[datetime]
    congestion_duration_minutes: Optional[int]
    impact_radius_km: float
    model_version: str
    confidence_score: Optional[float]
    created_at: datetime

    model_config = {"from_attributes": True}


class ResourcePlanResponse(BaseModel):
    """Recommended resource allocation for an event."""

    id: uuid.UUID
    event_id: uuid.UUID
    required_officers: int
    required_barricades: int
    deployment_priority: str
    deployment_notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class RouteAlternateResponse(BaseModel):
    """A single alternate route recommendation."""

    id: uuid.UUID
    event_id: uuid.UUID
    route_name: str
    route_index: int
    estimated_distance_km: Optional[float]
    estimated_duration_minutes: Optional[int]
    avoidance_description: Optional[str]
    waypoints_json: Optional[str]   # JSON string — parsed by the frontend
    created_at: datetime

    model_config = {"from_attributes": True}


class ValidationCreate(BaseModel):
    """Payload for POST /validation/{event_id} — submit post-event ground truth."""

    actual_congestion_score: float = Field(..., ge=0.0, le=100.0)
    actual_peak_time: Optional[datetime] = None
    actual_duration_minutes: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = Field(None, max_length=2000)

    model_config = {"json_schema_extra": {"example": {
        "actual_congestion_score": 72.5,
        "actual_peak_time": "2025-05-25T20:30:00+05:30",
        "actual_duration_minutes": 180,
        "notes": "Traffic cleared by 23:00",
    }}}


class ValidationResponse(BaseModel):
    """Post-event validation result."""

    id: uuid.UUID
    event_id: uuid.UUID
    prediction_id: Optional[uuid.UUID]
    actual_congestion_score: float
    accuracy_percentage: float
    score_delta: float
    requires_review: bool
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class FullPredictionBundle(BaseModel):
    """Composite response returned by the predict endpoint.

    Bundles the prediction, resource plan, and alternate routes in a single
    response so the frontend dashboard can populate all panels in one request.
    """

    event_id: uuid.UUID
    prediction: PredictionResponse
    resource_plan: ResourcePlanResponse
    alternate_routes: list[RouteAlternateResponse]