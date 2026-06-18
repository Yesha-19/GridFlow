"""
helpers.py — Pure utility functions used across the Gridlock MVP backend.

All functions here are stateless, side-effect-free, and thoroughly typed so
they can be unit-tested in isolation without any database or model fixtures.
"""

import math
from datetime import datetime, timezone
from typing import Any

from app.utils.constants import (
    EARTH_RADIUS_KM,
    MAX_IMPACT_RADIUS_KM,
    MIN_IMPACT_RADIUS_KM,
    CROWD_RADIUS_SCALE_KM_PER_1K,
    RISK_SCORE_LOW_THRESHOLD,
    RISK_SCORE_MEDIUM_THRESHOLD,
    RISK_SCORE_HIGH_THRESHOLD,
    DeploymentPriority,
)


# ---------------------------------------------------------------------------
# Geo utilities
# ---------------------------------------------------------------------------

def haversine_distance_km(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float,
) -> float:
    """Compute the great-circle distance between two WGS-84 coordinates.

    Uses the Haversine formula which is accurate to within ~0.5 % for
    distances up to a few hundred kilometres — more than sufficient for
    city-scale traffic modelling.

    Args:
        lat1: Latitude of point A (degrees, −90 to 90).
        lon1: Longitude of point A (degrees, −180 to 180).
        lat2: Latitude of point B (degrees).
        lon2: Longitude of point B (degrees).

    Returns:
        Distance in kilometres.
    """
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return EARTH_RADIUS_KM * c


def is_point_inside_radius(
    event_lat: float,
    event_lon: float,
    point_lat: float,
    point_lon: float,
    radius_km: float,
) -> bool:
    """Return True if *point* lies within *radius_km* of the event centre.

    Args:
        event_lat: Event epicentre latitude.
        event_lon: Event epicentre longitude.
        point_lat: Test point latitude.
        point_lon: Test point longitude.
        radius_km: Impact radius in kilometres.

    Returns:
        Boolean containment result.
    """
    return haversine_distance_km(event_lat, event_lon, point_lat, point_lon) <= radius_km


def compute_impact_radius_km(crowd_size: int, risk_score: float) -> float:
    """Estimate the spatial impact radius for a congestion event.

    The radius grows linearly with crowd size and is scaled upward when the
    risk score is high, then clamped to a physically meaningful range.

    Args:
        crowd_size: Number of expected attendees.
        risk_score: Predicted congestion risk score (0–100).

    Returns:
        Impact radius in kilometres, clamped to
        [MIN_IMPACT_RADIUS_KM, MAX_IMPACT_RADIUS_KM].
    """
    base_radius = (crowd_size / 1_000) * CROWD_RADIUS_SCALE_KM_PER_1K
    # Apply a risk multiplier: 1.0 at score 0, 2.0 at score 100.
    risk_multiplier = 1.0 + (risk_score / 100.0)
    radius = base_radius * risk_multiplier
    return float(max(MIN_IMPACT_RADIUS_KM, min(MAX_IMPACT_RADIUS_KM, radius)))


# ---------------------------------------------------------------------------
# Risk score classification
# ---------------------------------------------------------------------------

def classify_risk_score(score: float) -> str:
    """Map a numeric congestion risk score to a human-readable label.

    Args:
        score: Congestion risk score in [0, 100].

    Returns:
        One of ``"low"``, ``"medium"``, ``"high"``, or ``"critical"``.
    """
    if score <= RISK_SCORE_LOW_THRESHOLD:
        return "low"
    elif score <= RISK_SCORE_MEDIUM_THRESHOLD:
        return "medium"
    elif score <= RISK_SCORE_HIGH_THRESHOLD:
        return "high"
    else:
        return "critical"


def deployment_priority_from_risk(score: float) -> DeploymentPriority:
    """Derive a :class:`DeploymentPriority` from a risk score.

    Args:
        score: Congestion risk score in [0, 100].

    Returns:
        A :class:`DeploymentPriority` enum member.
    """
    label = classify_risk_score(score)
    return DeploymentPriority(label)


# ---------------------------------------------------------------------------
# Datetime helpers
# ---------------------------------------------------------------------------

def utc_now() -> datetime:
    """Return the current UTC timestamp as a timezone-aware :class:`datetime`.

    Always prefer this function over ``datetime.utcnow()`` (which is
    timezone-naive and therefore ambiguous).
    """
    return datetime.now(timezone.utc)


def safe_isoformat(dt: datetime | None) -> str | None:
    """Serialise a datetime to ISO-8601, returning ``None`` if input is None.

    Args:
        dt: Datetime object to serialise (may be None).

    Returns:
        ISO-8601 string or None.
    """
    return dt.isoformat() if dt is not None else None


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------

def compute_accuracy_percentage(
    predicted_score: float,
    actual_score: float,
) -> float:
    """Calculate how accurate a congestion prediction was post-event.

    Accuracy is defined as ``100 − |predicted − actual|``, clamped to [0, 100].
    A perfect prediction (delta = 0) yields 100 %; a prediction that is off by
    ≥ 100 points yields 0 %.

    Args:
        predicted_score: The XGBoost model's predicted congestion risk score.
        actual_score: The ground-truth congestion score recorded post-event.

    Returns:
        Accuracy percentage in [0.0, 100.0].
    """
    delta = abs(predicted_score - actual_score)
    return float(max(0.0, min(100.0, 100.0 - delta)))


# ---------------------------------------------------------------------------
# Serialisation helpers
# ---------------------------------------------------------------------------

def sanitise_for_json(obj: Any) -> Any:
    """Recursively convert non-serialisable types (e.g. numpy floats) to Python
    builtins so the response can be safely passed through ``json.dumps``.

    Args:
        obj: Any Python object.

    Returns:
        A JSON-safe equivalent.
    """
    import numpy as np  # lazy import — only used in serialisation path

    if isinstance(obj, (np.floating,)):
        return float(obj)
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, dict):
        return {k: sanitise_for_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [sanitise_for_json(v) for v in obj]
    return obj