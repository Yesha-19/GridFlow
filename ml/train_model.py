"""
train_model.py — CLI entry point for the Gridlock ML training pipeline.

Usage:
    python ml/train_model.py

This runs the full pipeline:
1. Preprocess the Astram event dataset
2. Engineer features and create target variable
3. Train XGBoost model with cross-validation
4. Save model, scaler, and metrics to ml/models/
"""

import sys
from pathlib import Path

# Add project root to path for imports
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_PROJECT_ROOT))

from ml.pipelines.data_preprocessing import run_preprocessing
from ml.pipelines.training_pipeline import run_training


def main():
    print("╔══════════════════════════════════════════════════════════╗")
    print("║          GRIDLOCK 2.0 — Model Training Pipeline         ║")
    print("║        Event-Driven Congestion Prediction System        ║")
    print("╚══════════════════════════════════════════════════════════╝")

    # Step 1: Preprocess data
    print("\n▶ Step 1/2: Data Preprocessing")
    print("─" * 50)
    try:
        df, X, y = run_preprocessing(save=True)
    except FileNotFoundError as e:
        print(f"\n✗ Error: {e}")
        print("  Make sure the Astram CSV dataset is in the 'datasets/' directory.")
        sys.exit(1)

    # Step 2: Train model
    print("\n▶ Step 2/2: Model Training")
    print("─" * 50)
    metrics = run_training()

    # Summary
    print("\n╔══════════════════════════════════════════════════════════╗")
    print("║                   Training Summary                      ║")
    print("╠══════════════════════════════════════════════════════════╣")
    print(f"║  Dataset:      {len(X):>6} samples                        ║")
    print(f"║  Features:     {X.shape[1]:>6}                               ║")
    print(f"║  RMSE:         {metrics['rmse']:>6.2f}                             ║")
    print(f"║  MAE:          {metrics['mae']:>6.2f}                             ║")
    print(f"║  R²:           {metrics['r2']:>6.4f}                           ║")
    print(f"║  CV RMSE:      {metrics['cv_rmse_mean']:.2f} ± {metrics['cv_rmse_std']:.2f}                      ║")
    print("╠══════════════════════════════════════════════════════════╣")
    print("║  Model:  ml/models/congestion_model.pkl                 ║")
    print("║  Scaler: ml/models/scaler.pkl                           ║")
    print("║  Metrics: ml/models/training_metrics.json               ║")
    print("╚══════════════════════════════════════════════════════════╝")


if __name__ == "__main__":
    main()
