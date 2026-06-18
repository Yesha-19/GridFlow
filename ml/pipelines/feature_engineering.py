"""
feature_engineering.py — Feature extraction pipeline for inference.

This module provides functions to transform a new event input (from the API)
into the same feature vector format used during training, ensuring consistency
between training and inference.
"""

import numpy as np
import pandas as pd
from pathlib import Path

# ---------------------------------------------------------------------------
# Feature columns — must match training pipeline output exactly
# ---------------------------------------------------------------------------

TRAINING_FEATURE_COLUMNS = [
    # Temporal
    "hour_of_day", "day_of_week", "is_weekend", "month",
    "is_peak_hour", "is_night",
    # Spatial
    "is_corridor", "zone_event_density", "junction_event_density",
    # Event properties
    "duration_hours", "requires_road_closure",
    # Cause one-hot
    "cause_vehicle_breakdown", "cause_accident", "cause_tree_fall",
    "cause_road_damage", "cause_waterlogging", "cause_fire",
    "cause_construction", "cause_others", "cause_other",
]

# Map frontend event types to closest event cause categories
EVENT_TYPE_TO_CAUSE = {
    "political_rally": "others",
    "religious_festival": "others",
    "sports_event": "others",
    "cultural_event": "others",
    "protest_strike": "protest",
    "vip_movement": "others",
    "concert": "others",
    "sports": "others",
    "festival": "others",
    "marathon": "others",
    "parade": "others",
    "exhibition": "others",
    "emergency": "accident",
    "construction": "construction",
    "accident": "accident",
}

# Event type severity overrides for planned events
EVENT_TYPE_SEVERITY = {
    "political_rally": 0.85,
    "religious_festival": 0.75,
    "sports_event": 0.65,
    "cultural_event": 0.55,
    "protest_strike": 0.90,
    "vip_movement": 0.70,
    "concert": 0.60,
    "sports": 0.65,
    "festival": 0.75,
    "marathon": 0.70,
    "parade": 0.65,
    "exhibition": 0.45,
    "emergency": 0.95,
    "construction": 0.60,
    "accident": 0.90,
}


def extract_features_for_event(
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
) -> pd.DataFrame:
    """
    Transform a single event input into a model-ready feature vector.

    Args:
        event_type: Type of event (from frontend dropdown).
        latitude: Event location latitude.
        longitude: Event location longitude.
        crowd_size: Expected number of attendees.
        start_hour: Hour of day (0-23).
        day_of_week: 0=Monday, 6=Sunday.
        month: Month number (1-12).
        duration_hours: Expected duration in hours.
        is_planned: Whether the event is planned in advance.
        requires_road_closure: Whether road closure is needed.
        corridor: Corridor name if on a known corridor.
        zone: City zone name.
        junction: Nearest junction name.

    Returns:
        Single-row DataFrame with features matching TRAINING_FEATURE_COLUMNS.
    """
    # Temporal features
    is_weekend = int(day_of_week >= 5)
    is_peak_hour = int(8 <= start_hour <= 10 or 17 <= start_hour <= 20)
    is_night = int(start_hour >= 23 or start_hour <= 5)

    # Spatial features
    is_corridor_flag = int(corridor != "Non-corridor")

    # For planned events, estimate zone/junction density from crowd size
    # (in production, these would come from historical data lookup)
    crowd_density_proxy = min(1.0, crowd_size / 100000.0)
    zone_event_density = crowd_density_proxy * 0.8 + 0.2
    junction_event_density = crowd_density_proxy * 0.7 + 0.1

    # Event cause mapping
    mapped_cause = EVENT_TYPE_TO_CAUSE.get(event_type, "others")

    # Build cause one-hot
    cause_columns = {
        "cause_vehicle_breakdown": int(mapped_cause == "vehicle_breakdown"),
        "cause_accident": int(mapped_cause == "accident"),
        "cause_tree_fall": int(mapped_cause == "tree_fall"),
        "cause_road_damage": int(mapped_cause == "road_damage"),
        "cause_waterlogging": int(mapped_cause == "waterlogging"),
        "cause_fire": int(mapped_cause == "fire"),
        "cause_construction": int(mapped_cause == "construction"),
        "cause_others": int(mapped_cause == "others"),
        "cause_other": int(mapped_cause not in [
            "vehicle_breakdown", "accident", "tree_fall",
            "road_damage", "waterlogging", "fire",
            "construction", "others",
        ]),
    }

    # Assemble row
    row = {
        "hour_of_day": float(start_hour),
        "day_of_week": float(day_of_week),
        "is_weekend": float(is_weekend),
        "month": float(month),
        "is_peak_hour": float(is_peak_hour),
        "is_night": float(is_night),
        "is_corridor": float(is_corridor_flag),
        "zone_event_density": float(zone_event_density),
        "junction_event_density": float(junction_event_density),
        "duration_hours": float(duration_hours),
        "requires_road_closure": float(requires_road_closure),
        **{k: float(v) for k, v in cause_columns.items()},
    }

    # Build DataFrame with correct column order
    df = pd.DataFrame([row])
    for col in TRAINING_FEATURE_COLUMNS:
        if col not in df.columns:
            df[col] = 0.0
    return df[TRAINING_FEATURE_COLUMNS].astype("float64")


def compute_crowd_adjustment(
    base_score: float,
    crowd_size: int,
    event_type: str,
    is_planned: bool,
) -> float:
    """
    Adjust the model's base prediction using crowd size and event type context.

    The ML model was trained on unplanned events (breakdowns, accidents) which
    don't have crowd size. For planned events with large crowds, we apply a
    calibrated adjustment.

    Args:
        base_score: Raw XGBoost prediction (0-100).
        crowd_size: Expected number of attendees.
        event_type: Event type string.
        is_planned: Whether event is planned.

    Returns:
        Adjusted congestion score (0-100).
    """
    # Event type severity multiplier
    type_severity = EVENT_TYPE_SEVERITY.get(event_type, 0.5)

    # Crowd size contribution (logarithmic scale)
    crowd_factor = min(1.0, np.log1p(crowd_size) / np.log1p(200000))

    # For planned events, blend model prediction with crowd-based estimate
    crowd_estimate = crowd_factor * type_severity * 100

    if is_planned:
        # Weight: 40% model, 60% crowd-based for planned events
        adjusted = base_score * 0.4 + crowd_estimate * 0.6
    else:
        # Weight: 70% model, 30% crowd-based for unplanned events
        adjusted = base_score * 0.7 + crowd_estimate * 0.3

    # Unplanned events get +15 urgency bonus
    if not is_planned:
        adjusted += 15

    return float(np.clip(adjusted, 2, 98))
