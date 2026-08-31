"""
Module 3 — Engines 1, 2 & 3
─────────────────────────────────────────────────────────────────────────────
Engine 1 : Material Volume Estimation   (CIDA SCA/5 standard)
Engine 2 : Dispatch Temperature         (1-D Transient Heat Conduction / Fourier)
Engine 3 : Compaction Window            (XGBoost scaffold — physics placeholder)
─────────────────────────────────────────────────────────────────────────────
"""

import math
import os
import joblib
import pandas as pd
import numpy as np

class MaterialHeatEstimator:
    """
    Encapsulates Engines 1-3 for Module 3.
    All Sri Lankan road construction norms are sourced from CIDA SCA/5.
    """

    # ── Engine 1 constants (CIDA SCA/5) ────────────────────────────────────
    ASPHALT_DENSITY_T_M3 = 2.35       # Compacted HMA bulk density  (t/m³)
    COMPACTION_FACTOR    = 0.20        # +20 % for in-place compaction loss
    WASTAGE_FACTOR       = 0.10        # +10 % material wastage allowance
    BITUMEN_RATIO        = 0.05        # 5 % bitumen by mass (60/70 grade)
    BITUMEN_DENSITY_KG_L = 1.03        # ≈ 1.03 kg/L for bitumen / tar
    AGGREGATE_DENSITY    = 1.60        # Bulk density of loose aggregate (t/m³)

    # ── Engine 2 constants (Fourier heat conduction) ────────────────────────
    THERMAL_DIFFUSIVITY  = 5.5e-7      # α for HMA  (m²/s)
    TARGET_ARRIVAL_TEMP  = 145.0       # Minimum compaction temp at site (°C)
    MAX_SAFE_DISPATCH    = 185.0       # CIDA upper limit for plant temp (°C)

    # ── Engine 3 constants (compaction window) ──────────────────────────────
    BASE_WINDOW_MINUTES  = 45.0        # Baseline workable window

    def __init__(self):
        self.models_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
        self.rf_model = None
        self.mlp_model = None
        self.therm_scaler = None
        try:
            self.rf_model = joblib.load(os.path.join(self.models_dir, 'rf_resource_model.pkl'))
            self.mlp_model = joblib.load(os.path.join(self.models_dir, 'mlp_thermal_model.pkl'))
            self.therm_scaler = joblib.load(os.path.join(self.models_dir, 'therm_scaler.pkl'))
            print("Successfully loaded AI models in MaterialHeatEstimator")
        except Exception as e:
            print(f"Warning: Could not load AI models. Falling back to physics formulas. Error: {e}")

    # ────────────────────────────────────────────────────────────────────────
    # ENGINE 1 — Material Volume Estimation (CIDA SCA/5)
    # ────────────────────────────────────────────────────────────────────────

    def calculate_material_volumes(
        self,
        area_sqm: float,
        depth_m: float,
        ambient_temp_c: float = 30.0,
        transport_time_hours: float = 1.0,
        humidity_pct: float = 65.0,
    ) -> dict:
        """
        Calculates HMA, bitumen, and aggregate requirements.

        Formulas
        --------
        repair_volume  = area × depth × (1 + COMPACTION_FACTOR)
        hma_mass       = repair_volume × ASPHALT_DENSITY × (1 + WASTAGE_FACTOR)
        bitumen_kg     = hma_mass × BITUMEN_RATIO × 1000   (→ litres via density)
        aggregate_mass = (hma_mass - bitumen_t) / AGGREGATE_DENSITY
        """
        # Compaction-adjusted repair volume
        repair_volume_m3 = area_sqm * depth_m * (1.0 + self.COMPACTION_FACTOR)

        if self.rf_model:
            # Predict using Random Forest
            # Features: ['area_sqm', 'depth_m', 'ambient_temp_c', 'transport_time_hr', 'humidity_pct']
            features = pd.DataFrame([[area_sqm, depth_m, ambient_temp_c, transport_time_hours, humidity_pct]], 
                                    columns=['area_sqm', 'depth_m', 'ambient_temp_c', 'transport_time_hr', 'humidity_pct'])
            preds = self.rf_model.predict(features)[0]
            # Targets: ['hma_tonnes', 'bitumen_liters', 'labor_hours', 'machine_hours', 'total_cost_lkr']
            hma_tonnes = preds[0]
            bitumen_liters = preds[1]
            bitumen_tonnes = bitumen_liters * self.BITUMEN_DENSITY_KG_L / 1000.0
        else:
            # HMA tonnes (with wastage)
            hma_tonnes = repair_volume_m3 * self.ASPHALT_DENSITY_T_M3 * (1.0 + self.WASTAGE_FACTOR)
            # Bitumen
            bitumen_tonnes = hma_tonnes * self.BITUMEN_RATIO
            bitumen_liters = (bitumen_tonnes * 1000.0) / self.BITUMEN_DENSITY_KG_L

        # Aggregate
        aggregate_tonnes = hma_tonnes - bitumen_tonnes
        aggregate_m3 = aggregate_tonnes / self.AGGREGATE_DENSITY

        return {
            "repair_volume_m3":  round(repair_volume_m3, 4),
            "hma_tonnes":        round(hma_tonnes, 4),
            "bitumen_liters":    round(bitumen_liters, 4),
            "aggregate_m3":      round(aggregate_m3, 4),
        }

    # ────────────────────────────────────────────────────────────────────────
    # ENGINE 2 — Dispatch Temperature (Fourier's Law)
    # ────────────────────────────────────────────────────────────────────────

    def predict_dispatch_temperature(
        self,
        ambient_temp_c: float,
        target_arrival_temp: float,
        transport_time_hours: float,
        depth_m: float,
    ) -> dict:
        """
        Solves the 1-D transient heat equation to find the plant dispatch
        temperature such that the asphalt arrives ≥ target_arrival_temp.

        Fourier Number : Fo = (α × t) / L²
        Decay Factor   : decay = exp(−π² × Fo / 4)
        Dispatch Temp  : T_d = T_ambient + (T_target − T_ambient) / decay
        """
        t_seconds = transport_time_hours * 3600.0
        L = depth_m  # characteristic length = layer depth

        # Guard against zero-depth edge case
        if L <= 0:
            L = 0.01

        fourier_number = (self.THERMAL_DIFFUSIVITY * t_seconds) / (L ** 2)

        if self.mlp_model and self.therm_scaler:
            # Predict using Neural Network
            # Features: ['ambient_temp_c', 'transport_time_hr', 'humidity_pct', 'depth_m']
            # Assume average humidity if not passed, but we don't have humidity_pct in this signature yet
            # For accurate predictions, we will assume 65% humidity if not available.
            features = pd.DataFrame([[ambient_temp_c, transport_time_hours, 65.0, depth_m]], 
                                    columns=['ambient_temp_c', 'transport_time_hr', 'humidity_pct', 'depth_m'])
            scaled_features = self.therm_scaler.transform(features)
            preds = self.mlp_model.predict(scaled_features)[0]
            # Targets: ['dispatch_temp_c', 'compaction_window_min']
            dispatch_temp = preds[0]
        else:
            decay_factor   = math.exp(-((math.pi ** 2) * fourier_number) / 4.0)

            # Prevent division by near-zero decay (extreme transport times)
            if decay_factor < 1e-6:
                decay_factor = 1e-6

            dispatch_temp = ambient_temp_c + (target_arrival_temp - ambient_temp_c) / decay_factor

        if dispatch_temp > self.MAX_SAFE_DISPATCH:
            status = "CRITICAL_WARNING: Dispatch temp exceeds safe limit (185 °C). Reduce transport time."
        else:
            status = "Optimal (AI Predicted)" if self.mlp_model else "Optimal"

        return {
            "fourier_number":         round(fourier_number, 6),
            "dispatch_temp_celsius":  round(dispatch_temp, 2),
            "target_arrival_temp":    target_arrival_temp,
            "thermal_status":         status,
        }

    # ────────────────────────────────────────────────────────────────────────
    # ENGINE 3 — Compaction Window (XGBoost Scaffold)
    # ────────────────────────────────────────────────────────────────────────

    def predict_compaction_window(
        self,
        ambient_temp_c: float,
        humidity_pct: float,
        depth_m: float,
    ) -> dict:
        """
        Predicts how many minutes the crew has before the mix cools below the
        workable threshold.

        NOTE: XGBoost model is scaffolded but not yet trained.
        Current implementation uses a physics-informed linear approximation
        until rda_material_norms.csv is populated and the model trained.

        Placeholder formula
        -------------------
        window = BASE + (T_ambient − 25) × 0.5 + (depth_cm) × 1.2 − (humidity × 0.1)
        """
        depth_cm = depth_m * 100.0
        
        if self.mlp_model and self.therm_scaler:
            # Neural network prediction (using a default transport time of 1 hr for window context if needed)
            features = pd.DataFrame([[ambient_temp_c, 1.0, humidity_pct, depth_m]], 
                                    columns=['ambient_temp_c', 'transport_time_hr', 'humidity_pct', 'depth_m'])
            scaled_features = self.therm_scaler.transform(features)
            preds = self.mlp_model.predict(scaled_features)[0]
            window = preds[1]
            model_type = "mlp_neural_network"
        else:
            window = (
                self.BASE_WINDOW_MINUTES
                + (ambient_temp_c - 25.0) * 0.5
                + depth_cm * 1.2
                - humidity_pct * 0.1
            )
            model_type = "physics_placeholder"

        # Floor at 10 minutes (safety minimum)
        window = max(window, 10.0)

        return {
            "compaction_window_minutes": round(window, 1),
            "model_type": model_type,
        }
