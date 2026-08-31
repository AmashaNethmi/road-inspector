"""
Module 3 — Engines 4 & 5
─────────────────────────────────────────────────────────────────────────────
Engine 4 : Labor Requirements      (RDA HSR — Human & Shift Rate standard)
Engine 5 : MILP Resource Optimiser (scipy.optimize.linprog / HiGHS solver)
           + Carbon Footprint Estimator
─────────────────────────────────────────────────────────────────────────────
"""

import math
from typing import Tuple
from scipy.optimize import linprog
import os
import joblib
import pandas as pd

class ResourceAllocator:
    """
    Encapsulates Engines 4 & 5 for Module 3.
    """

    def __init__(self):
        self.models_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
        self.rf_model = None
        try:
            self.rf_model = joblib.load(os.path.join(self.models_dir, 'rf_resource_model.pkl'))
            print("Successfully loaded AI models in ResourceAllocator")
        except Exception as e:
            print(f"Warning: Could not load AI models. Falling back to physics formulas. Error: {e}")

    # ── Engine 4 constants (RDA HSR) ────────────────────────────────────────
    LABOR_NORM_CONSTANT = 2.5    # labor-hours per m³ of repair (RDA HSR norm)
    SHIFT_HOURS         = 8      # standard shift duration
    CREW_EFFICIENCY     = 0.85   # 85 % productive efficiency per shift

    # ── Engine 5 constants (MILP cost coefficients, LKR) ───────────────────
    COST_LABOR_PER_HOUR  = 2_500.0   # LKR per labor-hour
    COST_TRUCK_PER_UNIT  = 15_000.0  # LKR per truck
    COST_MACHINE_PER_UNIT = 25_000.0 # LKR per machine
    TRUCK_CAPACITY_TONNES = 5.0      # tonnes per truck

    # ── Engine 5 constants (carbon, kg CO₂e) ────────────────────────────────
    CARBON_PER_TRUCK_KG  = 50.0
    CARBON_PER_MACHINE_KG = 30.0

    # ────────────────────────────────────────────────────────────────────────
    # ENGINE 4 — Labor Requirements (RDA HSR)
    # ────────────────────────────────────────────────────────────────────────

    def calculate_labor_requirements(
        self,
        area_sqm: float,
        depth_m: float,
        ambient_temp_c: float = 30.0,
        transport_time_hours: float = 1.0,
        humidity_pct: float = 65.0,
    ) -> dict:
        """
        Determines labor-hours and crew size using RDA HSR norms.

        Formulas
        --------
        volume      = area × depth
        labor_hours = volume × LABOR_NORM_CONSTANT
        crew_size   = ⌈ labor_hours / (SHIFT_HOURS × CREW_EFFICIENCY) ⌉
        """
        volume_m3   = area_sqm * depth_m
        
        if self.rf_model:
            features = pd.DataFrame([[area_sqm, depth_m, ambient_temp_c, transport_time_hours, humidity_pct]], 
                                    columns=['area_sqm', 'depth_m', 'ambient_temp_c', 'transport_time_hr', 'humidity_pct'])
            preds = self.rf_model.predict(features)[0]
            labor_hours = preds[2]
        else:
            labor_hours = volume_m3 * self.LABOR_NORM_CONSTANT
        crew_size   = math.ceil(labor_hours / (self.SHIFT_HOURS * self.CREW_EFFICIENCY))

        # Enforce a minimum of 2 workers for any job
        crew_size = max(crew_size, 2)

        return {
            "labor_hours": round(labor_hours, 3),
            "crew_size":   crew_size,
            "shift_hours": self.SHIFT_HOURS,
        }

    # ────────────────────────────────────────────────────────────────────────
    # ENGINE 5 — MILP Resource Optimisation (scipy linprog)
    # ────────────────────────────────────────────────────────────────────────

    def optimize_resource_allocation(
        self,
        area_sqm: float,
        hma_tonnes: float,
        labor_hours: float,
        ambient_temp_c: float = 30.0,
        transport_time_hours: float = 1.0,
        humidity_pct: float = 65.0,
        depth_m: float = 0.05,
        execution_mode: str = "in-house",
    ) -> dict:
        """
        Mixed-Integer Linear Programme that minimises total repair cost (LKR).

        Decision variables: x = [labor_hrs, trucks, machines]

        Objective
        ---------
        Minimise Z = 2500·x₀ + 15000·x₁ + 25000·x₂

        Constraints (all ≥, reformulated as ≤ for linprog)
        ----------
        x₀   ≥ required_labor_hours   →  −x₀ ≤ −labor_hours
        5·x₁ ≥ hma_tonnes             →  −5·x₁ ≤ −hma_tonnes
        x₂   ≥ 1                      →  −x₂ ≤ −1

        Bounds: all variables ≥ 0 (continuous relaxation; rounded up post-solve)

        NOTE: linprog solves the LP relaxation; trucks and machines are
        ceil-rounded after solve to enforce integrality.
        """
        # Objective coefficients
        c = [self.COST_LABOR_PER_HOUR, self.COST_TRUCK_PER_UNIT, self.COST_MACHINE_PER_UNIT]

        # Inequality matrix  A_ub · x ≤ b_ub
        A_ub = [
            [-1,                         0,  0],   # −x₀ ≤ −labor_hours
            [ 0, -self.TRUCK_CAPACITY_TONNES,  0],  # −5·x₁ ≤ −hma_tonnes
            [ 0,                         0, -1],   # −x₂ ≤ −1
        ]
        b_ub = [-labor_hours, -hma_tonnes, -1]

        bounds = [(0, None), (0, None), (0, None)]

        result = linprog(c, A_ub=A_ub, b_ub=b_ub, bounds=bounds, method="highs")

        if result.success:
            opt_labor = result.x[0]
            opt_trucks  = math.ceil(result.x[1])
            opt_machines = math.ceil(result.x[2])
        else:
            # Fallback to simple heuristics if solver fails
            opt_labor    = labor_hours
            opt_trucks   = math.ceil(hma_tonnes / self.TRUCK_CAPACITY_TONNES)
            opt_machines = 1

        # Machinery assignment (rule-based by area bracket)
        machinery_list, repair_method = self._assign_machinery(area_sqm)

        if self.rf_model:
            features = pd.DataFrame([[area_sqm, depth_m, ambient_temp_c, transport_time_hours, humidity_pct]], 
                                    columns=['area_sqm', 'depth_m', 'ambient_temp_c', 'transport_time_hr', 'humidity_pct'])
            preds = self.rf_model.predict(features)[0]
            # Targets: ['hma_tonnes', 'bitumen_liters', 'labor_hours', 'machine_hours', 'total_cost_lkr']
            opt_machines = math.ceil(preds[3])
            optimized_cost_lkr = preds[4]
            # Ensure machine count covers the assigned list
            opt_machines = max(opt_machines, len(machinery_list))
        else:
            # Ensure machine count covers the assigned list
            opt_machines = max(opt_machines, len(machinery_list))

            # Optimised cost
            optimized_cost_lkr = (
                opt_labor    * self.COST_LABOR_PER_HOUR
                + opt_trucks  * self.COST_TRUCK_PER_UNIT
                + opt_machines * self.COST_MACHINE_PER_UNIT
            )

        # Contractor Markup (25%)
        contractor_markup_lkr = 0.0
        if execution_mode == "outsourced":
            contractor_markup_lkr = optimized_cost_lkr * 0.25
            optimized_cost_lkr += contractor_markup_lkr

        # Carbon footprint
        carbon_kg_co2e = (
            opt_trucks   * self.CARBON_PER_TRUCK_KG
            + opt_machines * self.CARBON_PER_MACHINE_KG
        )

        return {
            "repair_method":       repair_method,
            "machinery_list":      machinery_list,
            "num_trucks":          opt_trucks,
            "optimized_cost_lkr":  round(optimized_cost_lkr, 2),
            "contractor_markup_lkr": round(contractor_markup_lkr, 2),
            "carbon_kg_co2e":      round(carbon_kg_co2e, 2),
        }

    # ── Private helpers ──────────────────────────────────────────────────────

    def _assign_machinery(self, area_sqm: float) -> Tuple[list, str]:
        """
        Rule-based machinery assignment per the architecture specification.

        < 5 m²      → Walk-behind roller
        5–50 m²     → Static smooth roller (3-5t) + Portable Bitumen Sprayer
        > 50 m²     → Pneumatic tire roller + Bitumen Distributor Truck + Asphalt Paver
        """
        if area_sqm < 5.0:
            return (
                ["Walk-behind Roller"],
                "Manual Patching",
            )
        elif area_sqm <= 50.0:
            return (
                ["Static Smooth Roller (3-5t)", "Portable Bitumen Sprayer"],
                "Semi-mechanized Patching",
            )
        else:
            return (
                ["Pneumatic Tire Roller", "Bitumen Distributor Truck", "Asphalt Paver"],
                "Fully Mechanized Rehabilitation",
            )
