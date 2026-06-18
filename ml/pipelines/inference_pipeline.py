"""
inference_pipeline.py — Real-time prediction pipeline for new events.

Loads the trained model and scaler, accepts event parameters, and returns
a congestion prediction with confidence score.
"""

import pickle
from pathlib import Path
from typing import Optional

import numpy as np

from ml.pipelines.feature_engineering import (
    extract_features_for_event,
    compute_crowd_adjustment,
    EVENT_TYPE_SEVERITY,
)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

_BASE_DIR = Path(__file__).resolve().parent.parent
_MODELS_DIR = _BASE_DIR / "models"

# Module-level singletons
_model = None
_scaler = None
_load_attempted = False


def _load_artefacts():
    """Load model + scaler from disk (lazy singleton)."""
    global _model, _scaler, _load_attempted
    _load_attempted = True

    model_path = _MODELS_DIR / "congestion_model.pkl"
    scaler_path = _MODELS_DIR / "scaler.pkl"

    if model_path.exists():
        with open(model_path, "rb") as f:
            _model = pickle.load(f)
        print(f"[inference] Model loaded from {model_path}")

    if scaler_path.exists():
        with open(scaler_path, "rb") as f:
            _scaler = pickle.load(f)
        print(f"[inference] Scaler loaded from {scaler_path}")


def predict_congestion(
    event_type: str,
    latitude: float,
    longitude: float,
    crowd_size: int,
    start_hour: int,
    day_of_week: int,
    month: int,
    duration_hours: float,
    is_planned: bool = True,
    requires_road_closure: bool = False,
    corridor: str = "Non-corridor",
    zone: str = "Unknown",
    junction: str = "Unknown",
) -> dict:
    """
    Predict congestion severity for a new event.

    Returns:
        Dictionary with:
        - congestion_score (float): 0-100 severity
        - risk_level (str): LOW/MEDIUM/HIGH/CRITICAL
        - confidence_score (float): 0-100 model confidence
        - estimated_delay_minutes (int): predicted traffic delay
        - affected_radius_km (float): spatial impact radius
        - peak_offset_minutes (int): minutes after start when congestion peaks
    """
    global _load_attempted
    if not _load_attempted:
        _load_artefacts()

    # Extract features
    features_df = extract_features_for_event(
        event_type=event_type,
        latitude=latitude,
        longitude=longitude,
        crowd_size=crowd_size,
        start_hour=start_hour,
        day_of_week=day_of_week,
        month=month,
        duration_hours=duration_hours,
        is_planned=is_planned,
        requires_road_closure=requires_road_closure,
        corridor=corridor,
        zone=zone,
        junction=junction,
    )

    features_np = features_df.values

    # Scale features
    if _scaler is not None:
        try:
            features_np = _scaler.transform(features_np)
        except Exception:
            pass  # Use raw features if scaler fails

    # Predict
    if _model is not None:
        raw_score = float(_model.predict(features_np)[0])
        base_score = float(np.clip(raw_score, 0, 100))
        use_model = True
    else:
        # Heuristic fallback
        base_score = _heuristic_score(
            event_type, crowd_size, duration_hours,
            start_hour, day_of_week, is_planned
        )
        use_model = False

    # Adjust for crowd size and event type
    congestion_score = compute_crowd_adjustment(
        base_score, crowd_size, event_type, is_planned
    )

    # Derive outputs
    risk_level = classify_risk(congestion_score)
    confidence = _compute_confidence(congestion_score, use_model, crowd_size)
    delay = _estimate_delay(congestion_score, crowd_size, duration_hours)
    radius = _compute_radius(congestion_score, crowd_size)
    peak_offset = int(duration_hours * 60 * 0.40)

    return {
        "congestion_score": round(congestion_score, 1),
        "risk_level": risk_level,
        "confidence_score": round(confidence, 1),
        "estimated_delay_minutes": delay,
        "affected_radius_km": round(radius, 1),
        "peak_offset_minutes": peak_offset,
        "model_used": use_model,
    }


def classify_risk(score: float) -> str:
    """Map numeric score to severity tier."""
    if score >= 80:
        return "CRITICAL"
    elif score >= 60:
        return "HIGH"
    elif score >= 35:
        return "MEDIUM"
    else:
        return "LOW"


def _compute_confidence(score: float, use_model: bool, crowd_size: int) -> float:
    """Estimate prediction confidence."""
    base = 85 if use_model else 65
    # Extreme scores are less reliable
    extremity_penalty = abs(score - 50) * 0.2
    # Larger crowds have more uncertainty
    crowd_penalty = min(10, crowd_size / 50000 * 10)
    confidence = base - extremity_penalty - crowd_penalty
    return float(np.clip(confidence, 45, 96))


def _estimate_delay(score: float, crowd_size: int, duration_hours: float) -> int:
    """Estimate traffic delay in minutes."""
    base_delay = (score / 100) * 45
    crowd_factor = min(30, (crowd_size / 50000) * 30)
    duration_factor = min(15, duration_hours * 2)
    return int(np.clip(base_delay + crowd_factor + duration_factor, 5, 120))


def _compute_radius(score: float, crowd_size: int) -> float:
    """Compute spatial impact radius in km."""
    base = 0.5 + (crowd_size / 100000) * 2.0
    risk_mult = 1.0 + (score / 100)
    return float(np.clip(base * risk_mult, 0.5, 8.0))


def _heuristic_score(
    event_type: str,
    crowd_size: int,
    duration_hours: float,
    start_hour: int,
    day_of_week: int,
    is_planned: bool,
) -> float:
    """Fallback heuristic when no trained model is available."""
    type_severity = EVENT_TYPE_SEVERITY.get(event_type, 0.5)
    crowd_factor = min(crowd_size / 2000, 50.0)
    duration_factor = min(max(duration_hours - 2.0, 0.0), 20.0)
    unplanned_bonus = 15.0 if not is_planned else 0.0
    peak_bonus = 10.0 if (day_of_week >= 4 and 17 <= start_hour <= 22) else 0.0

    score = (
        crowd_factor +
        duration_factor +
        unplanned_bonus +
        peak_bonus +
        type_severity * 20
    )
    return float(np.clip(score, 0, 100))
