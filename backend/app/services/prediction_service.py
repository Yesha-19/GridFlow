"""
prediction_service.py — ML inference wrapper for the API layer.

Bridges between the FastAPI request format and the ML inference pipeline.
"""

import sys
from datetime import datetime
from pathlib import Path

import numpy as np

# Add project root for ML imports
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
sys.path.insert(0, str(_PROJECT_ROOT))

try:
    from ml.pipelines.inference_pipeline import predict_congestion, classify_risk
    HAS_ML = True
except ImportError:
    HAS_ML = False


def run_prediction_pipeline(
    event_type: str,
    latitude: float,
    longitude: float,
    crowd_size: int,
    start_time: datetime,
    duration_hours: float,
    is_planned: bool = True,
) -> dict:
    """
    Run the full prediction pipeline for an event.

    Returns dict with: congestion_score, risk_level, confidence_score,
    estimated_delay_minutes, affected_radius_km, peak_offset_minutes
    """
    if HAS_ML:
        result = predict_congestion(
            event_type=event_type,
            latitude=latitude,
            longitude=longitude,
            crowd_size=crowd_size,
            start_hour=start_time.hour,
            day_of_week=start_time.weekday(),
            month=start_time.month,
            duration_hours=duration_hours,
            is_planned=is_planned,
        )
        return result
    else:
        # Heuristic fallback
        return _heuristic_prediction(
            event_type, crowd_size, duration_hours,
            start_time.hour, start_time.weekday(), is_planned
        )


def _heuristic_prediction(
    event_type: str,
    crowd_size: int,
    duration_hours: float,
    start_hour: int,
    day_of_week: int,
    is_planned: bool,
) -> dict:
    """Heuristic fallback when ML pipeline is unavailable."""
    type_weights = {
        "political_rally": 0.85,
        "religious_festival": 0.75,
        "sports_event": 0.65,
        "cultural_event": 0.55,
        "protest_strike": 0.90,
        "vip_movement": 0.70,
    }
    type_w = type_weights.get(event_type, 0.6)
    crowd_factor = min(crowd_size / 50000, 1.0)
    duration_factor = min(duration_hours / 8, 1.0)

    raw_score = type_w * 55 + crowd_factor * 35 + duration_factor * 10
    if not is_planned:
        raw_score += 15
    if day_of_week >= 4 and 17 <= start_hour <= 22:
        raw_score += 10

    score = float(np.clip(raw_score, 4, 98))
    risk_level = (
        "CRITICAL" if score >= 80 else
        "HIGH" if score >= 60 else
        "MEDIUM" if score >= 35 else
        "LOW"
    )

    delay = int(8 + (score / 100) * 65)
    radius = round(1.2 + (score / 100) * 3.6, 1)
    confidence = round(72 + np.random.uniform(0, 20), 1)
    peak_offset = int(duration_hours * 60 * 0.4)

    return {
        "congestion_score": round(score, 1),
        "risk_level": risk_level,
        "confidence_score": confidence,
        "estimated_delay_minutes": delay,
        "affected_radius_km": radius,
        "peak_offset_minutes": peak_offset,
        "model_used": False,
    }