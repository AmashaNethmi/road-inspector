"""
Module 3 — Integration Test Runner
────────────────────────────────────────────────────────────────────────────
Manually exercises all 5 engines and validates the full Module3EstimationResult
schema without requiring a running HTTP server.

Usage
-----
    python test_run_materials.py
"""

import os
import sys
import json

# Ensure repo root is on the path so imports resolve
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from module_3_estimation.material_heat import MaterialHeatEstimator
from module_3_estimation.resource_allocation import ResourceAllocator
from schemas import Module3EstimationResult


def main():
    print("=" * 60)
    print("  Road Inspector -- Module 3 Integration Test")
    print("=" * 60)

    # -- Mock inputs (simulate data from Module 2 + field sensors) ------
    AREA_SQM             = 12.5   # m2
    DEPTH_M              = 0.05   # 5 cm
    AMBIENT_TEMP_C       = 28.0   # deg C -- typical Colombo day
    TRANSPORT_TIME_HOURS = 1.5    # hours
    HUMIDITY_PCT         = 65.0   # %

    print(f"\n  Inputs")
    print(f"  +- Area             : {AREA_SQM} m2")
    print(f"  +- Depth            : {DEPTH_M} m  ({DEPTH_M*100:.0f} cm)")
    print(f"  +- Ambient Temp     : {AMBIENT_TEMP_C} deg C")
    print(f"  +- Transport Time   : {TRANSPORT_TIME_HOURS} hrs")
    print(f"  +- Humidity         : {HUMIDITY_PCT} %")


    estimator  = MaterialHeatEstimator()
    allocator  = ResourceAllocator()

    # Engine 1
    print("\n  [Engine 1] Material Volume Estimation (CIDA SCA/5)...")
    mat = estimator.calculate_material_volumes(AREA_SQM, DEPTH_M)
    print(f"  [OK] Repair volume : {mat['repair_volume_m3']} m3")
    print(f"  [OK] HMA           : {mat['hma_tonnes']} t")
    print(f"  [OK] Bitumen       : {mat['bitumen_liters']} L")
    print(f"  [OK] Aggregate     : {mat['aggregate_m3']} m3")

    # Engine 2
    print("\n  [Engine 2] Dispatch Temperature (Fourier's Law)...")
    therm = estimator.predict_dispatch_temperature(
        AMBIENT_TEMP_C, 145.0, TRANSPORT_TIME_HOURS, DEPTH_M
    )
    print(f"  [OK] Fourier number    : {therm['fourier_number']}")
    print(f"  [OK] Dispatch temp     : {therm['dispatch_temp_celsius']} deg C")
    print(f"  [OK] Target arrival    : {therm['target_arrival_temp']} deg C")
    print(f"  [OK] Status            : {therm['thermal_status']}")

    # Engine 3
    print("\n  [Engine 3] Compaction Window (XGBoost scaffold)...")
    comp = estimator.predict_compaction_window(AMBIENT_TEMP_C, HUMIDITY_PCT, DEPTH_M)
    print(f"  [OK] Compaction window : {comp['compaction_window_minutes']} min")
    print(f"  [OK] Model type        : {comp['model_type']}")

    # Engine 4
    print("\n  [Engine 4] Labor Requirements (RDA HSR)...")
    labor = allocator.calculate_labor_requirements(AREA_SQM, DEPTH_M)
    print(f"  [OK] Labor hours  : {labor['labor_hours']} hrs")
    print(f"  [OK] Crew size    : {labor['crew_size']} workers")
    print(f"  [OK] Shift        : {labor['shift_hours']} hrs")

    # Engine 5
    print("\n  [Engine 5] MILP Resource Optimisation (SciPy HiGHS)...")
    resources = allocator.optimize_resource_allocation(
        AREA_SQM, mat["hma_tonnes"], labor["labor_hours"]
    )
    print(f"  [OK] Method       : {resources['repair_method']}")
    print(f"  [OK] Machinery    : {resources['machinery_list']}")
    print(f"  [OK] Trucks       : {resources['num_trucks']}")
    print(f"  [OK] Cost         : LKR {resources['optimized_cost_lkr']:,.2f}")
    print(f"  [OK] Carbon       : {resources['carbon_kg_co2e']} kg CO2e")

    # Schema validation
    print("\n  [Schema] Validating Module3EstimationResult...")
    result = Module3EstimationResult(
        repair_volume_m3          = mat["repair_volume_m3"],
        hma_tonnes                = mat["hma_tonnes"],
        bitumen_liters            = mat["bitumen_liters"],
        aggregate_m3              = mat["aggregate_m3"],
        fourier_number            = therm["fourier_number"],
        dispatch_temp_celsius     = therm["dispatch_temp_celsius"],
        target_arrival_temp       = therm["target_arrival_temp"],
        thermal_status            = therm["thermal_status"],
        compaction_window_minutes = comp["compaction_window_minutes"],
        labor_hours               = labor["labor_hours"],
        crew_size                 = labor["crew_size"],
        shift_hours               = labor["shift_hours"],
        repair_method             = resources["repair_method"],
        machinery_list            = resources["machinery_list"],
        num_trucks                = resources["num_trucks"],
        optimized_cost_lkr        = resources["optimized_cost_lkr"],
        carbon_kg_co2e            = resources["carbon_kg_co2e"],
    )

    print("\n  Full JSON Output:")
    print(result.model_dump_json(indent=4))
    print("\n  [PASS] All engines passed schema validation.\n")


if __name__ == "__main__":
    main()
