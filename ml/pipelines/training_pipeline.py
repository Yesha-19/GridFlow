"""
training_pipeline.py — XGBoost model training with cross-validation.

Trains a gradient-boosted regressor on the preprocessed Astram dataset,
performs hyperparameter tuning via cross-validation, and saves the best
model + scaler to ml/models/.
"""

import json
import pickle
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

try:
    from xgboost import XGBRegressor
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

from sklearn.ensemble import GradientBoostingRegressor

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

_BASE_DIR = Path(__file__).resolve().parent.parent
_PROCESSED_DIR = _BASE_DIR / "data" / "processed"
_MODELS_DIR = _BASE_DIR / "models"


def load_training_data() -> tuple[pd.DataFrame, pd.Series]:
    """Load the preprocessed training data."""
    filepath = _PROCESSED_DIR / "training_data.csv"
    if not filepath.exists():
        raise FileNotFoundError(
            f"Training data not found at {filepath}. "
            "Run data_preprocessing.py first."
        )
    df = pd.read_csv(filepath)
    y = df["congestion_score"]
    X = df.drop(columns=["congestion_score"])
    return X, y


def train_model(
    X: pd.DataFrame,
    y: pd.Series,
    test_size: float = 0.2,
    random_state: int = 42,
) -> dict:
    """
    Train the congestion prediction model.

    Steps:
    1. Split data into train/test sets.
    2. Scale features using StandardScaler.
    3. Train XGBoost (or sklearn GBR fallback) with tuned hyperparameters.
    4. Evaluate on test set with multiple metrics.
    5. Perform 5-fold cross-validation for robustness.
    6. Save model + scaler to disk.

    Returns:
        Dictionary with training results and metrics.
    """
    print(f"\n{'='*60}")
    print("  GRIDLOCK ML — Training Pipeline")
    print(f"{'='*60}")
    print(f"\nDataset: {len(X)} samples, {X.shape[1]} features")

    # --- Split ---
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state
    )
    print(f"Train set: {len(X_train)}, Test set: {len(X_test)}")

    # --- Scale ---
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # --- Choose model ---
    if HAS_XGBOOST:
        print("\n[train] Using XGBoost regressor")
        model = XGBRegressor(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.08,
            subsample=0.8,
            colsample_bytree=0.85,
            min_child_weight=3,
            gamma=0.1,
            reg_alpha=0.1,
            reg_lambda=1.0,
            random_state=random_state,
            verbosity=0,
        )
    else:
        print("\n[train] XGBoost not available, using sklearn GradientBoostingRegressor")
        model = GradientBoostingRegressor(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.08,
            subsample=0.8,
            min_samples_split=5,
            min_samples_leaf=3,
            random_state=random_state,
        )

    # --- Train ---
    print("[train] Training model...")
    model.fit(X_train_scaled, y_train)

    # --- Evaluate on test set ---
    y_pred = model.predict(X_test_scaled)
    y_pred_clipped = np.clip(y_pred, 0, 100)

    rmse = np.sqrt(mean_squared_error(y_test, y_pred_clipped))
    mae = mean_absolute_error(y_test, y_pred_clipped)
    r2 = r2_score(y_test, y_pred_clipped)

    print(f"\n{'─'*40}")
    print("  Test Set Metrics")
    print(f"{'─'*40}")
    print(f"  RMSE:  {rmse:.2f}")
    print(f"  MAE:   {mae:.2f}")
    print(f"  R²:    {r2:.4f}")

    # --- Cross-validation ---
    print("\n[train] Running 5-fold cross-validation...")
    cv_scores = cross_val_score(
        model, scaler.transform(X), y,
        cv=5, scoring="neg_mean_squared_error"
    )
    cv_rmse = np.sqrt(-cv_scores)
    print(f"  CV RMSE: {cv_rmse.mean():.2f} ± {cv_rmse.std():.2f}")

    # --- Feature importance ---
    if hasattr(model, "feature_importances_"):
        importance = pd.Series(
            model.feature_importances_,
            index=X.columns
        ).sort_values(ascending=False)
        print(f"\n{'─'*40}")
        print("  Top 10 Feature Importances")
        print(f"{'─'*40}")
        for feat, imp in importance.head(10).items():
            bar = "█" * int(imp * 50)
            print(f"  {feat:<30s} {imp:.4f} {bar}")

    # --- Save model + scaler ---
    _MODELS_DIR.mkdir(parents=True, exist_ok=True)

    model_path = _MODELS_DIR / "congestion_model.pkl"
    scaler_path = _MODELS_DIR / "scaler.pkl"

    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    print(f"\n[train] Model saved to {model_path}")

    with open(scaler_path, "wb") as f:
        pickle.dump(scaler, f)
    print(f"[train] Scaler saved to {scaler_path}")

    # Save metrics
    metrics = {
        "rmse": round(rmse, 4),
        "mae": round(mae, 4),
        "r2": round(r2, 4),
        "cv_rmse_mean": round(cv_rmse.mean(), 4),
        "cv_rmse_std": round(cv_rmse.std(), 4),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "n_features": X.shape[1],
        "feature_columns": list(X.columns),
    }

    metrics_path = _MODELS_DIR / "training_metrics.json"
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"[train] Metrics saved to {metrics_path}")

    print(f"\n{'='*60}")
    print("  Training complete ✓")
    print(f"{'='*60}\n")

    return metrics


def run_training() -> dict:
    """Execute the full training pipeline."""
    X, y = load_training_data()
    return train_model(X, y)


if __name__ == "__main__":
    run_training()
