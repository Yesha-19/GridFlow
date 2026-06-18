"""
data_preprocessing.py — ETL pipeline for the Astram event dataset.

Reads the raw CSV, cleans and transforms it into training-ready features,
and engineers a congestion severity target variable from available signals.
"""

import os
import re
import sys
from pathlib import Path

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

_BASE_DIR = Path(__file__).resolve().parent.parent
_RAW_DATA_DIR = _BASE_DIR / "data" / "raw"
_PROCESSED_DIR = _BASE_DIR / "data" / "processed"
_DATASET_DIR = _BASE_DIR.parent / "datasets"


# ---------------------------------------------------------------------------
# Event cause severity weights (higher = more congestion impact)
# ---------------------------------------------------------------------------

CAUSE_SEVERITY = {
    "accident": 0.95,
    "tree_fall": 0.75,
    "road_damage": 0.70,
    "waterlogging": 0.80,
    "fire": 0.85,
    "protest": 0.90,
    "vehicle_breakdown": 0.50,
    "construction": 0.60,
    "others": 0.40,
}

PRIORITY_WEIGHT = {
    "Critical": 1.0,
    "High": 0.75,
    "Medium": 0.50,
    "Low": 0.25,
}

CORRIDOR_WEIGHT = {
    "Non-corridor": 0.3,
}


def find_dataset_file() -> Path:
    """Locate the Astram CSV file in the datasets directory."""
    for f in _DATASET_DIR.iterdir():
        if f.suffix == ".csv" and "astram" in f.name.lower():
            return f
    raise FileNotFoundError(
        f"No Astram CSV file found in {_DATASET_DIR}. "
        "Ensure the dataset file is present."
    )


def load_raw_data(filepath: Path = None) -> pd.DataFrame:
    """Load the raw CSV dataset."""
    if filepath is None:
        filepath = find_dataset_file()
    print(f"[preprocessing] Loading dataset from {filepath}")
    df = pd.read_csv(filepath, low_memory=False)
    print(f"[preprocessing] Loaded {len(df)} rows, {len(df.columns)} columns")
    return df


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Clean and standardize the raw dataframe."""
    # Keep essential columns
    keep_cols = [
        "id", "event_type", "latitude", "longitude",
        "endlatitude", "endlongitude", "address",
        "event_cause", "requires_road_closure",
        "start_datetime", "end_datetime", "status",
        "priority", "corridor", "zone", "junction",
        "direction", "description",
    ]
    existing_cols = [c for c in keep_cols if c in df.columns]
    df = df[existing_cols].copy()

    # Parse datetimes
    df["start_datetime"] = pd.to_datetime(df["start_datetime"], errors="coerce", utc=True)
    df["end_datetime"] = pd.to_datetime(df["end_datetime"], errors="coerce", utc=True)

    # Drop rows with no valid start datetime or coordinates
    df = df.dropna(subset=["start_datetime", "latitude", "longitude"])

    # Filter invalid coordinates (Bengaluru bounding box ~12.7–13.2 lat, 77.3–77.9 lng)
    df = df[
        (df["latitude"].between(12.5, 13.5)) &
        (df["longitude"].between(77.0, 78.2))
    ]

    # Clean event_cause
    df["event_cause"] = (
        df["event_cause"]
        .fillna("others")
        .str.strip()
        .str.lower()
        .str.replace(r"[^a-z_]", "", regex=True)
    )

    # Clean priority
    df["priority"] = df["priority"].fillna("Low").str.strip().str.title()

    # Clean road closure flag
    df["requires_road_closure"] = (
        df["requires_road_closure"]
        .fillna(False)
        .replace({"TRUE": True, "FALSE": False, "True": True, "False": False})
        .astype(bool)
    )

    # Clean corridor
    df["corridor"] = df["corridor"].fillna("Non-corridor").str.strip()

    # Clean zone
    df["zone"] = df["zone"].fillna("Unknown").str.strip()

    # Clean junction
    df["junction"] = df["junction"].fillna("Unknown").str.strip()

    # Clean status
    df["status"] = df["status"].fillna("unknown").str.strip().str.lower()

    print(f"[preprocessing] After cleaning: {len(df)} rows")
    return df


def compute_duration(df: pd.DataFrame) -> pd.DataFrame:
    """Compute event duration in hours from start/end datetimes."""
    # For rows with end_datetime, compute actual duration
    mask = df["end_datetime"].notna()
    df.loc[mask, "duration_hours"] = (
        (df.loc[mask, "end_datetime"] - df.loc[mask, "start_datetime"])
        .dt.total_seconds() / 3600.0
    )

    # For rows without end_datetime, estimate from event cause
    default_durations = {
        "accident": 2.5,
        "tree_fall": 3.0,
        "vehicle_breakdown": 1.5,
        "road_damage": 4.0,
        "waterlogging": 5.0,
        "fire": 3.5,
        "construction": 6.0,
        "others": 2.0,
    }
    for cause, dur in default_durations.items():
        idx = (~mask) & (df["event_cause"] == cause)
        df.loc[idx, "duration_hours"] = dur

    # Fill any remaining NaN
    df["duration_hours"] = df["duration_hours"].fillna(2.0)

    # Clamp to reasonable range (0.1 to 48 hours)
    df["duration_hours"] = df["duration_hours"].clip(0.1, 48.0)

    return df


def extract_temporal_features(df: pd.DataFrame) -> pd.DataFrame:
    """Extract time-based features from start_datetime."""
    dt = df["start_datetime"]
    df["hour_of_day"] = dt.dt.hour
    df["day_of_week"] = dt.dt.dayofweek  # 0=Monday, 6=Sunday
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
    df["month"] = dt.dt.month

    # Peak hours: morning rush (8-10) and evening rush (17-20)
    df["is_peak_hour"] = (
        df["hour_of_day"].between(8, 10) |
        df["hour_of_day"].between(17, 20)
    ).astype(int)

    # Night time (23:00 - 05:00) — less traffic impact
    df["is_night"] = (
        (df["hour_of_day"] >= 23) | (df["hour_of_day"] <= 5)
    ).astype(int)

    return df


def extract_spatial_features(df: pd.DataFrame) -> pd.DataFrame:
    """Extract spatial features from coordinates and location metadata."""
    # Corridor: whether on a major corridor or not
    df["is_corridor"] = (df["corridor"] != "Non-corridor").astype(int)

    # Zone encoding — map to numeric density proxy
    zone_counts = df["zone"].value_counts()
    df["zone_event_density"] = df["zone"].map(zone_counts).fillna(1).astype(float)
    # Normalize to 0-1
    max_density = df["zone_event_density"].max()
    if max_density > 0:
        df["zone_event_density"] = df["zone_event_density"] / max_density

    # Junction encoding — count events per junction as proxy for congestion-prone areas
    junction_counts = df["junction"].value_counts()
    df["junction_event_density"] = df["junction"].map(junction_counts).fillna(1).astype(float)
    max_j = df["junction_event_density"].max()
    if max_j > 0:
        df["junction_event_density"] = df["junction_event_density"] / max_j

    return df


def compute_congestion_target(df: pd.DataFrame) -> pd.DataFrame:
    """
    Engineer the congestion severity score (0-100) as the target variable.

    This synthesized target combines multiple real signals:
    - Event cause severity
    - Priority level
    - Road closure requirement
    - Duration of impact
    - Peak hour overlap
    - Corridor location
    - Zone/junction density
    """
    # Base score from event cause severity (0-1)
    cause_score = df["event_cause"].map(CAUSE_SEVERITY).fillna(0.4)

    # Priority multiplier (0.25-1.0)
    priority_score = df["priority"].map(PRIORITY_WEIGHT).fillna(0.5)

    # Road closure adds significant impact
    closure_bonus = df["requires_road_closure"].astype(float) * 0.25

    # Duration factor — longer events cause more congestion (log scale)
    duration_factor = np.clip(np.log1p(df["duration_hours"]) / np.log1p(12), 0, 1)

    # Peak hour amplifier
    peak_amplifier = 1.0 + df["is_peak_hour"] * 0.3

    # Corridor impact — events on corridors affect more traffic
    corridor_bonus = df["is_corridor"].astype(float) * 0.15

    # Zone density factor
    zone_factor = df["zone_event_density"] * 0.2

    # Junction density factor
    junction_factor = df["junction_event_density"] * 0.15

    # Night time reduction
    night_reduction = df["is_night"].astype(float) * (-0.25)

    # Weekend slight reduction
    weekend_factor = df["is_weekend"].astype(float) * (-0.1)

    # Composite score
    raw_score = (
        cause_score * 35 +
        priority_score * 25 +
        closure_bonus * 15 +
        duration_factor * 10 +
        corridor_bonus * 5 +
        zone_factor * 5 +
        junction_factor * 5
    ) * peak_amplifier

    # Add noise for realism and clip to 0-100
    np.random.seed(42)
    noise = np.random.normal(0, 3, len(df))
    raw_score = raw_score + night_reduction * 10 + weekend_factor * 5 + noise

    df["congestion_score"] = np.clip(raw_score, 2, 98).round(1)

    return df


def encode_event_causes(df: pd.DataFrame) -> pd.DataFrame:
    """One-hot encode event cause categories."""
    top_causes = [
        "vehicle_breakdown", "accident", "tree_fall",
        "road_damage", "waterlogging", "fire",
        "construction", "others",
    ]
    for cause in top_causes:
        df[f"cause_{cause}"] = (df["event_cause"] == cause).astype(int)

    # Catch-all for unlisted causes
    df["cause_other"] = (~df["event_cause"].isin(top_causes)).astype(int)

    return df


def build_feature_matrix(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    """Extract the final feature matrix X and target vector y."""
    feature_cols = [
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

    # Ensure boolean columns are numeric
    for col in feature_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    existing_features = [c for c in feature_cols if c in df.columns]
    X = df[existing_features].astype("float64")
    y = df["congestion_score"].astype("float64")

    return X, y


def run_preprocessing(save: bool = True) -> tuple[pd.DataFrame, pd.DataFrame, pd.Series]:
    """Execute the full preprocessing pipeline."""
    # Load
    df = load_raw_data()

    # Clean
    df = clean_data(df)

    # Feature engineering
    df = compute_duration(df)
    df = extract_temporal_features(df)
    df = extract_spatial_features(df)
    df = encode_event_causes(df)
    df = compute_congestion_target(df)

    # Build feature matrix
    X, y = build_feature_matrix(df)

    print(f"\n[preprocessing] Feature matrix shape: {X.shape}")
    print(f"[preprocessing] Target variable stats:")
    print(f"  Mean: {y.mean():.1f}, Std: {y.std():.1f}")
    print(f"  Min: {y.min():.1f}, Max: {y.max():.1f}")
    print(f"  Median: {y.median():.1f}")

    if save:
        _PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
        # Save processed dataset
        processed = pd.concat([X, y], axis=1)
        processed.to_csv(_PROCESSED_DIR / "training_data.csv", index=False)
        print(f"\n[preprocessing] Saved training data to {_PROCESSED_DIR / 'training_data.csv'}")

        # Also save the full cleaned dataframe with all metadata for seeding
        meta_cols = ["id", "latitude", "longitude", "address", "event_cause",
                     "start_datetime", "zone", "junction", "corridor", "priority",
                     "congestion_score", "duration_hours"]
        meta_existing = [c for c in meta_cols if c in df.columns]
        df[meta_existing].to_csv(_PROCESSED_DIR / "events_metadata.csv", index=False)
        print(f"[preprocessing] Saved events metadata to {_PROCESSED_DIR / 'events_metadata.csv'}")

    return df, X, y


if __name__ == "__main__":
    run_preprocessing(save=True)
