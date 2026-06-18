"""
evaluate.py — Model evaluation and reporting.

Usage:
    python ml/evaluate.py

Loads the trained model and scaler, runs evaluation on the test set,
and generates a comprehensive evaluation report.
"""

import json
import pickle
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_PROJECT_ROOT))

_BASE_DIR = Path(__file__).resolve().parent
_MODELS_DIR = _BASE_DIR / "models"
_PROCESSED_DIR = _BASE_DIR / "data" / "processed"


def load_model():
    """Load trained model and scaler."""
    model_path = _MODELS_DIR / "congestion_model.pkl"
    scaler_path = _MODELS_DIR / "scaler.pkl"

    if not model_path.exists():
        raise FileNotFoundError(f"Model not found at {model_path}. Run train_model.py first.")

    with open(model_path, "rb") as f:
        model = pickle.load(f)

    scaler = None
    if scaler_path.exists():
        with open(scaler_path, "rb") as f:
            scaler = pickle.load(f)

    return model, scaler


def evaluate():
    """Run comprehensive model evaluation."""
    print("╔══════════════════════════════════════════════════════════╗")
    print("║          GRIDLOCK 2.0 — Model Evaluation Report         ║")
    print("╚══════════════════════════════════════════════════════════╝")

    # Load model
    model, scaler = load_model()
    print("✓ Model loaded successfully")

    # Load data
    data_path = _PROCESSED_DIR / "training_data.csv"
    if not data_path.exists():
        raise FileNotFoundError(f"Training data not found at {data_path}")

    df = pd.read_csv(data_path)
    y = df["congestion_score"]
    X = df.drop(columns=["congestion_score"])
    print(f"✓ Dataset loaded: {len(X)} samples, {X.shape[1]} features")

    # Scale features
    if scaler:
        X_scaled = scaler.transform(X)
    else:
        X_scaled = X.values

    # Predict
    y_pred = np.clip(model.predict(X_scaled), 0, 100)

    # Overall metrics
    rmse = np.sqrt(mean_squared_error(y, y_pred))
    mae = mean_absolute_error(y, y_pred)
    r2 = r2_score(y, y_pred)

    print(f"\n{'─'*50}")
    print("  Overall Performance")
    print(f"{'─'*50}")
    print(f"  RMSE:           {rmse:.2f}")
    print(f"  MAE:            {mae:.2f}")
    print(f"  R² Score:       {r2:.4f}")
    print(f"  Mean Abs Error: {mae:.2f} points on 0-100 scale")

    # Tier accuracy
    tier_actual = pd.Series(y).apply(classify_tier)
    tier_pred = pd.Series(y_pred).apply(classify_tier)
    tier_accuracy = (tier_actual == tier_pred).mean() * 100

    print(f"\n{'─'*50}")
    print("  Severity Tier Classification")
    print(f"{'─'*50}")
    print(f"  Tier accuracy:  {tier_accuracy:.1f}%")

    # Per-tier breakdown
    for tier in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]:
        mask = tier_actual == tier
        if mask.sum() > 0:
            tier_rmse = np.sqrt(mean_squared_error(y[mask], y_pred[mask]))
            tier_acc = (tier_pred[mask] == tier).mean() * 100
            print(f"  {tier:<10s} ({mask.sum():>4d} samples): RMSE={tier_rmse:.2f}, Tier Accuracy={tier_acc:.1f}%")

    # Error distribution
    errors = y_pred - y.values
    print(f"\n{'─'*50}")
    print("  Error Distribution")
    print(f"{'─'*50}")
    print(f"  Mean error:     {errors.mean():.2f}")
    print(f"  Std error:      {errors.std():.2f}")
    print(f"  Within ±5pts:   {(np.abs(errors) <= 5).mean() * 100:.1f}%")
    print(f"  Within ±10pts:  {(np.abs(errors) <= 10).mean() * 100:.1f}%")
    print(f"  Within ±15pts:  {(np.abs(errors) <= 15).mean() * 100:.1f}%")

    # Feature importance
    if hasattr(model, "feature_importances_"):
        importance = pd.Series(
            model.feature_importances_, index=X.columns
        ).sort_values(ascending=False)

        print(f"\n{'─'*50}")
        print("  Feature Importance Ranking")
        print(f"{'─'*50}")
        for i, (feat, imp) in enumerate(importance.items()):
            bar = "█" * int(imp * 40)
            print(f"  {i+1:>2d}. {feat:<30s} {imp:.4f} {bar}")

    # Save evaluation report
    report = {
        "overall": {
            "rmse": round(rmse, 4),
            "mae": round(mae, 4),
            "r2": round(r2, 4),
            "tier_accuracy_pct": round(tier_accuracy, 2),
        },
        "error_distribution": {
            "mean_error": round(errors.mean(), 4),
            "std_error": round(errors.std(), 4),
            "within_5pts_pct": round((np.abs(errors) <= 5).mean() * 100, 2),
            "within_10pts_pct": round((np.abs(errors) <= 10).mean() * 100, 2),
            "within_15pts_pct": round((np.abs(errors) <= 15).mean() * 100, 2),
        },
        "n_samples": len(X),
    }

    report_path = _MODELS_DIR / "evaluation_report.json"
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
    print(f"\n✓ Evaluation report saved to {report_path}")


def classify_tier(score: float) -> str:
    if score >= 80:
        return "CRITICAL"
    elif score >= 60:
        return "HIGH"
    elif score >= 35:
        return "MEDIUM"
    return "LOW"


if __name__ == "__main__":
    evaluate()
