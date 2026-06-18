"""
validation.py — Validation API endpoints.

GET  /api/validation/history — past predictions with accuracy
POST /api/validation/{id}   — log actual outcomes, compute accuracy
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.db import get_db
from app.database.models import Event, Prediction, Validation

router = APIRouter()


class ValidationHistoryItem(BaseModel):
    id: str
    eventName: str
    eventType: str
    eventDate: str | None
    predictedRiskScore: int
    predictedDelayMinutes: int
    actualRiskScore: int | None
    actualDelayMinutes: int | None
    accuracyPercent: int | None
    validated: bool


class ActualOutcomeInput(BaseModel):
    actualRiskScore: float
    actualDelayMinutes: int


class ActualOutcomeResponse(BaseModel):
    id: str
    actualRiskScore: float
    actualDelayMinutes: int
    validated: bool
    accuracyPercent: int | None


@router.get("/validation/history", response_model=list[ValidationHistoryItem])
async def get_validation_history(db: AsyncSession = Depends(get_db)):
    """Return past events with predicted vs actual outcomes."""
    result = await db.execute(
        select(Event, Prediction, Validation)
        .join(Prediction, Prediction.event_id == Event.id)
        .outerjoin(Validation, Validation.event_id == Event.id)
        .where(Event.status == "completed")
        .order_by(Event.start_time.desc())
        .limit(20)
    )
    rows = result.all()

    history = []
    for event, prediction, validation in rows:
        item = ValidationHistoryItem(
            id=event.id,
            eventName=event.name,
            eventType=event.event_type,
            eventDate=event.start_time.isoformat() if event.start_time else None,
            predictedRiskScore=round(prediction.congestion_risk_score),
            predictedDelayMinutes=prediction.estimated_delay_minutes or 0,
            actualRiskScore=round(validation.actual_congestion_score) if validation and validation.actual_congestion_score is not None else None,
            actualDelayMinutes=validation.actual_delay_minutes if validation else None,
            accuracyPercent=round(validation.accuracy_percentage) if validation and validation.accuracy_percentage is not None else None,
            validated=bool(validation and validation.validated),
        )
        history.append(item)

    return history


@router.post("/validation/{event_id}", response_model=ActualOutcomeResponse)
async def submit_actual_outcome(
    event_id: str,
    actuals: ActualOutcomeInput,
    db: AsyncSession = Depends(get_db),
):
    """Log actual congestion outcome for a completed event."""
    # Find the event
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Find the prediction
    result = await db.execute(
        select(Prediction)
        .where(Prediction.event_id == event_id)
        .order_by(Prediction.created_at.desc())
        .limit(1)
    )
    prediction = result.scalar_one_or_none()

    # Find or create validation record
    result = await db.execute(select(Validation).where(Validation.event_id == event_id))
    validation = result.scalar_one_or_none()

    predicted_score = prediction.congestion_risk_score if prediction else 50
    predicted_delay = prediction.estimated_delay_minutes if prediction else 30

    # Compute accuracy
    risk_error = abs(predicted_score - actuals.actualRiskScore) / 100
    delay_error = abs(predicted_delay - actuals.actualDelayMinutes) / max(predicted_delay, actuals.actualDelayMinutes, 1)
    blended = 1 - (risk_error * 0.6 + delay_error * 0.4)
    accuracy = round(min(99, max(40, blended * 100)))

    if validation:
        validation.actual_congestion_score = actuals.actualRiskScore
        validation.actual_delay_minutes = actuals.actualDelayMinutes
        validation.accuracy_percentage = accuracy
        validation.score_delta = round(predicted_score - actuals.actualRiskScore, 1)
        validation.validated = True
    else:
        validation = Validation(
            event_id=event_id,
            prediction_id=prediction.id if prediction else None,
            actual_congestion_score=actuals.actualRiskScore,
            actual_delay_minutes=actuals.actualDelayMinutes,
            accuracy_percentage=accuracy,
            score_delta=round(predicted_score - actuals.actualRiskScore, 1),
            validated=True,
        )
        db.add(validation)

    # Update event status
    event.status = "completed"
    await db.commit()

    return ActualOutcomeResponse(
        id=event_id,
        actualRiskScore=actuals.actualRiskScore,
        actualDelayMinutes=actuals.actualDelayMinutes,
        validated=True,
        accuracyPercent=accuracy,
    )
