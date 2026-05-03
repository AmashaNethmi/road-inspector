"""
random_forest_predictor.py
Random Forest model for road repair duration prediction.

Trains a multi-input RF regressor to predict repair duration (minutes)
given defect characteristics + weather + traffic features. Also classifies
the optimal paving window.

Researcher: Manathunga M.A.D.V.G (IT22207968)
Research Novelty: Analysis & Prediction Engine
"""

from __future__ import annotations

import json
import os
import pickle
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from loguru import logger
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


# ─── Feature Schema ────────────────────────────────────────────────────────────
# Input features for the repair duration predictor.
# Combines physical defect data with environmental and traffic context.

FEATURE_COLUMNS = [
    # Physical defect features (from segmentation module)
    "defect_area_m2",
    "defect_volume_m3",
    "defect_class_encoded",         # 0=pothole, 1=longitudinal_crack, 2=transverse, 3=raveling
    "road_type_encoded",            # 0=highway, 1=urban_arterial, 2=residential
    "severity_encoded",             # 0=low, 1=medium, 2=high, 3=critical

    # Weather features (from OpenWeather)
    "temperature_c",
    "humidity_pct",
    "rainfall_mm_1h",
    "wind_speed_ms",
    "cloud_cover_pct",
    "is_raining",

    # Traffic features (from TomTom)
    "jam_factor",
    "congestion_ratio",
    "is_peak_hour",

    # Temporal features
    "hour_of_day",
    "day_of_week",
    "is_weekend"
]

TARGET_COLUMN = "repair_duration_minutes"


@dataclass
class PredictionResult:
    """Result from the repair duration predictor."""
    defect_id: str
    predicted_duration_minutes: float
    confidence_interval_lower: float
    confidence_interval_upper: float
    feature_importances: Dict[str, float]
    model_version: str = "v1.0"

    @property
    def predicted_duration_hours(self) -> float:
        return self.predicted_duration_minutes / 60.0

    def to_dict(self) -> dict:
        return {
            "defect_id": self.defect_id,
            "predicted_duration_min": round(self.predicted_duration_minutes, 1),
            "predicted_duration_hr": round(self.predicted_duration_hours, 2),
            "ci_lower_min": round(self.confidence_interval_lower, 1),
            "ci_upper_min": round(self.confidence_interval_upper, 1),
            "model_version": self.model_version
        }


class RepairDurationPredictor:
    """
    Random Forest-based predictor for road repair duration.

    Algorithm Selection Rationale (Breiman, 2001):
    - Random Forests handle non-linear relationships between mixed
      continuous (weather, traffic) and categorical (road type, defect class)
      features without requiring explicit feature scaling.
    - Ensemble averaging reduces overfitting risk on small training datasets.
    - Built-in feature importance scores aid explainability for road authorities.

    Training Data Sources:
    - Historical repair logs from municipal road authorities.
    - Matched with weather records (OpenWeather archive API).
    - Matched with traffic records (TomTom historical flow API).
    """

    MODEL_FILE = "model_artifacts/repair_duration_rf.pkl"
    SCALER_FILE = "model_artifacts/feature_scaler.pkl"
    METADATA_FILE = "model_artifacts/model_metadata.json"

    def __init__(self, model_dir: str = "."):
        self.model_dir = Path(model_dir)
        self.regressor: Optional[RandomForestRegressor] = None
        self.scaler: Optional[StandardScaler] = None
        self.label_encoders: Dict[str, LabelEncoder] = {}
        self._is_trained = False
        self._feature_importances: Dict[str, float] = {}

        logger.info("RepairDurationPredictor initialized. Model dir: {}", self.model_dir)

    def train(
        self,
        training_data: pd.DataFrame,
        n_estimators: int = 200,
        max_depth: int = 15,
        test_size: float = 0.2,
        random_state: int = 42
    ) -> dict:
        """
        Train the Random Forest regressor on historical repair data.

        Args:
            training_data: DataFrame with FEATURE_COLUMNS + TARGET_COLUMN.
            n_estimators: Number of trees in the forest.
            max_depth: Maximum depth of each tree.
            test_size: Fraction held out for validation.
            random_state: Reproducibility seed.

        Returns:
            Evaluation metrics dictionary.
        """
        logger.info("Starting RF training. Samples: {}", len(training_data))

        # Validate required columns
        missing = set(FEATURE_COLUMNS + [TARGET_COLUMN]) - set(training_data.columns)
        if missing:
            raise ValueError(f"Training data missing columns: {missing}")

        X = training_data[FEATURE_COLUMNS].copy()
        y = training_data[TARGET_COLUMN].values

        # Scale features
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        # Train/validation split
        X_train, X_val, y_train, y_val = train_test_split(
            X_scaled, y, test_size=test_size, random_state=random_state
        )

        # Fit Random Forest
        self.regressor = RandomForestRegressor(
            n_estimators=n_estimators,
            max_depth=max_depth,
            min_samples_split=5,
            min_samples_leaf=2,
            max_features="sqrt",
            n_jobs=-1,
            random_state=random_state,
            oob_score=True             # Out-of-bag estimate (no extra validation set needed)
        )
        self.regressor.fit(X_train, y_train)

        # Evaluate
        y_pred = self.regressor.predict(X_val)
        metrics = {
            "mae_minutes": float(mean_absolute_error(y_val, y_pred)),
            "rmse_minutes": float(np.sqrt(mean_squared_error(y_val, y_pred))),
            "r2_score": float(r2_score(y_val, y_pred)),
            "oob_score": float(self.regressor.oob_score_),
            "n_estimators": n_estimators,
            "n_training_samples": len(X_train),
            "n_val_samples": len(X_val)
        }

        # Feature importances
        self._feature_importances = dict(
            zip(FEATURE_COLUMNS, self.regressor.feature_importances_)
        )
        top_features = sorted(
            self._feature_importances.items(), key=lambda x: x[1], reverse=True
        )[:5]

        self._is_trained = True
        logger.success("Training complete. MAE={:.1f}min RMSE={:.1f}min R²={:.3f}",
                        metrics["mae_minutes"], metrics["rmse_minutes"], metrics["r2_score"])
        logger.info("Top features: {}", top_features)

        return metrics

    def predict(
        self,
        defect_id: str,
        features: Dict[str, float]
    ) -> PredictionResult:
        """
        Predict repair duration for a single defect.

        Args:
            defect_id: Unique defect identifier.
            features: Feature dict matching FEATURE_COLUMNS.

        Returns:
            PredictionResult with duration estimate and confidence interval.
        """
        if not self._is_trained:
            raise RuntimeError("Model not trained. Call train() or load() first.")

        X = np.array([[features.get(col, 0.0) for col in FEATURE_COLUMNS]])
        X_scaled = self.scaler.transform(X)

        # Point prediction
        prediction = float(self.regressor.predict(X_scaled)[0])

        # Confidence interval using per-tree predictions (percentile method)
        tree_preds = np.array([
            tree.predict(X_scaled)[0]
            for tree in self.regressor.estimators_
        ])
        ci_lower = float(np.percentile(tree_preds, 10))
        ci_upper = float(np.percentile(tree_preds, 90))

        return PredictionResult(
            defect_id=defect_id,
            predicted_duration_minutes=max(0, prediction),
            confidence_interval_lower=max(0, ci_lower),
            confidence_interval_upper=ci_upper,
            feature_importances=self._feature_importances
        )

    def save(self) -> None:
        """Persist the trained model to disk."""
        artifacts_dir = self.model_dir / "model_artifacts"
        artifacts_dir.mkdir(parents=True, exist_ok=True)

        with open(artifacts_dir / "repair_duration_rf.pkl", "wb") as f:
            pickle.dump(self.regressor, f)
        with open(artifacts_dir / "feature_scaler.pkl", "wb") as f:
            pickle.dump(self.scaler, f)

        metadata = {
            "model_type": "RandomForestRegressor",
            "feature_columns": FEATURE_COLUMNS,
            "target_column": TARGET_COLUMN,
            "feature_importances": self._feature_importances,
            "researcher": "Manathunga M.A.D.V.G (IT22207968)"
        }
        with open(artifacts_dir / "model_metadata.json", "w") as f:
            json.dump(metadata, f, indent=2)

        logger.success("Model saved to: {}", artifacts_dir)

    def load(self) -> None:
        """Load a previously trained model from disk."""
        artifacts_dir = self.model_dir / "model_artifacts"

        with open(artifacts_dir / "repair_duration_rf.pkl", "rb") as f:
            self.regressor = pickle.load(f)
        with open(artifacts_dir / "feature_scaler.pkl", "rb") as f:
            self.scaler = pickle.load(f)

        with open(artifacts_dir / "model_metadata.json") as f:
            metadata = json.load(f)
            self._feature_importances = metadata.get("feature_importances", {})

        self._is_trained = True
        logger.success("Model loaded from: {}", artifacts_dir)
