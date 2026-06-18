"""
constants.py — Application-wide constants for the Gridlock MVP backend.

All magic numbers and configuration literals live here so they can be
updated in a single place and referenced consistently across services.
"""

from enum import Enum


# ---------------------------------------------------------------------------
# Event types
# ---------------------------------------------------------------------------

class EventType(str, Enum):
    """Enumeration of supported event categories.

    Values must match the labels used to train the XGBoost model so that
    one-hot / label encoding is consistent between training and inference.
    """
    CONCERT = "concert"
    SPORTS = "sports"
    POLITICAL_RALLY = "political_rally"
    FESTIVAL = "festival"
    MARATHON = "marathon"
    PARADE = "parade"
    EXHIBITION = "exhibition"
    EMERGENCY = "emergency"          # Unplanned — highest priority
    CONSTRUCTION = "construction"    # Unplanned — road closure
    ACCIDENT = "accident"            # Unplanned — incident


class EventStatus(str, Enum):
    """Lifecycle states for a tracked event."""
    PLANNED = "planned"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class DeploymentPriority(str, Enum):
    """Traffic resource deployment urgency levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# ---------------------------------------------------------------------------
# Congestion / risk scoring thresholds
# ---------------------------------------------------------------------------

# Congestion Risk Score is a continuous value in [0, 100].
RISK_SCORE_LOW_THRESHOLD: float = 30.0      # 0–30  → low
RISK_SCORE_MEDIUM_THRESHOLD: float = 60.0   # 31–60 → medium
RISK_SCORE_HIGH_THRESHOLD: float = 80.0     # 61–80 → high
                                             # 81–100 → critical

# Radius (km) added to predicted impact radius per 1 000 crowd members
CROWD_RADIUS_SCALE_KM_PER_1K: float = 0.15

# Minimum and maximum allowed impact radii (km)
MIN_IMPACT_RADIUS_KM: float = 0.5
MAX_IMPACT_RADIUS_KM: float = 10.0


# ---------------------------------------------------------------------------
# Resource calculation constants
# ---------------------------------------------------------------------------

# Officers required per 1 000 attendees (base rate; scaled by risk score)
OFFICERS_PER_1K_ATTENDEES: float = 2.5

# Extra officers per congestion risk point above 60
OFFICERS_PER_RISK_POINT: float = 0.1

# Barricades per 100 metres of estimated perimeter
BARRICADES_PER_100M_PERIMETER: float = 4.0

# Approximate perimeter (m) per km of impact radius
PERIMETER_SCALE_FACTOR: float = 6_283.0   # 2π × 1 000

# Absolute minima so a deployment is never under-resourced
MIN_OFFICERS: int = 5
MIN_BARRICADES: int = 10


# ---------------------------------------------------------------------------
# Route diversion constants
# ---------------------------------------------------------------------------

# Penalty multiplier applied to edges inside the congestion zone
# (makes the router strongly prefer edges outside the impact area)
CONGESTION_EDGE_PENALTY: float = 1_000.0

# Maximum number of alternate routes returned by the routing engine
MAX_ALTERNATE_ROUTES: int = 3

# Node spacing (degrees) used when generating the synthetic road graph
ROAD_GRAPH_NODE_SPACING_DEG: float = 0.005   # ≈ 500 m at the equator

# Grid extent around the event epicentre (degrees)
ROAD_GRAPH_EXTENT_DEG: float = 0.15          # ≈ 15 km bounding box


# ---------------------------------------------------------------------------
# ML model artefacts
# ---------------------------------------------------------------------------

import os as _os

_BASE_DIR = _os.path.dirname(_os.path.abspath(__file__))

MODEL_PATH: str = _os.getenv(
    "MODEL_PATH",
    _os.path.join(_BASE_DIR, "../../../ml/models/congestion_model.pkl"),
)
SCALER_PATH: str = _os.getenv(
    "SCALER_PATH",
    _os.path.join(_BASE_DIR, "../../../ml/models/scaler.pkl"),
)

# Feature columns expected by the trained XGBoost model (order matters).
MODEL_FEATURE_COLUMNS: list[str] = [
    "crowd_size",
    "duration_hours",
    "hour_of_day",
    "day_of_week",
    "is_weekend",
    "event_type_concert",
    "event_type_sports",
    "event_type_political_rally",
    "event_type_festival",
    "event_type_marathon",
    "event_type_parade",
    "event_type_exhibition",
    "event_type_emergency",
    "event_type_construction",
    "event_type_accident",
]


# ---------------------------------------------------------------------------
# Validation engine
# ---------------------------------------------------------------------------

# Accuracy is capped at 100 and floored at 0 after delta calculation.
VALIDATION_DELTA_PERFECT: float = 0.0       # 0-point delta → 100 % accuracy
VALIDATION_ACCURACY_SCALE: float = 100.0

# If actual congestion score differs by more than this, flag for review.
VALIDATION_REVIEW_THRESHOLD: float = 20.0


# ---------------------------------------------------------------------------
# API pagination defaults
# ---------------------------------------------------------------------------

DEFAULT_PAGE_SIZE: int = 20
MAX_PAGE_SIZE: int = 100


# ---------------------------------------------------------------------------
# Geo helpers
# ---------------------------------------------------------------------------

EARTH_RADIUS_KM: float = 6_371.0