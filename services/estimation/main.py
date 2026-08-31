"""
Road Inspector AI — FastAPI Entry Point
Module 3: Intelligent Material & Heat Estimation System
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from schemas import EstimationRequest, Module3EstimationResult
from module_3_estimation.material_heat import MaterialHeatEstimator
from module_3_estimation.resource_allocation import ResourceAllocator

# ── App ─────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Road Inspector AI API",
    version="1.0.0",
    description="Module 3 — Intelligent Material & Heat Estimation System",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Singletons (instantiated once at startup) ────────────────────────────────

material_estimator = MaterialHeatEstimator()
resource_allocator = ResourceAllocator()

# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Road Inspector AI backend is running!"}


@app.post("/api/v1/estimate", response_model=Module3EstimationResult)
def estimate(payload: EstimationRequest) -> Module3EstimationResult:
    """
    Full Module 3 estimation pipeline.

    Runs all 5 computational engines in sequence and returns a complete
    Bill of Quantities (BoQ) for the road repair job.
    """
    try:
        # ── Engine 1 : Material Volumes ─────────────────────────────────
        mat = material_estimator.calculate_material_volumes(
            area_sqm=payload.area_sqm,
            depth_m=payload.depth_m,
            ambient_temp_c=payload.ambient_temp_c,
            transport_time_hours=payload.transport_time_hours,
            humidity_pct=payload.humidity_pct,
        )

        # ── Engine 2 : Dispatch Temperature ─────────────────────────────
        therm = material_estimator.predict_dispatch_temperature(
            ambient_temp_c=payload.ambient_temp_c,
            target_arrival_temp=145.0,
            transport_time_hours=payload.transport_time_hours,
            depth_m=payload.depth_m,
        )

        # ── Engine 3 : Compaction Window ─────────────────────────────────
        comp = material_estimator.predict_compaction_window(
            ambient_temp_c=payload.ambient_temp_c,
            humidity_pct=payload.humidity_pct,
            depth_m=payload.depth_m,
        )

        # ── Engine 4 : Labor Requirements ────────────────────────────────
        labor = resource_allocator.calculate_labor_requirements(
            area_sqm=payload.area_sqm,
            depth_m=payload.depth_m,
            ambient_temp_c=payload.ambient_temp_c,
            transport_time_hours=payload.transport_time_hours,
            humidity_pct=payload.humidity_pct,
        )

        # ── Engine 5 : MILP Resource Optimisation ────────────────────────
        resources = resource_allocator.optimize_resource_allocation(
            area_sqm=payload.area_sqm,
            hma_tonnes=mat["hma_tonnes"],
            labor_hours=labor["labor_hours"],
            ambient_temp_c=payload.ambient_temp_c,
            transport_time_hours=payload.transport_time_hours,
            humidity_pct=payload.humidity_pct,
            depth_m=payload.depth_m,
            execution_mode=payload.execution_mode,
        )

        # ── Assemble response ─────────────────────────────────────────────
        return Module3EstimationResult(
            # Engine 1
            repair_volume_m3=mat["repair_volume_m3"],
            hma_tonnes=mat["hma_tonnes"],
            bitumen_liters=mat["bitumen_liters"],
            aggregate_m3=mat["aggregate_m3"],
            # Engine 2
            fourier_number=therm["fourier_number"],
            dispatch_temp_celsius=therm["dispatch_temp_celsius"],
            target_arrival_temp=therm["target_arrival_temp"],
            thermal_status=therm["thermal_status"],
            # Engine 3
            compaction_window_minutes=comp["compaction_window_minutes"],
            # Engine 4
            labor_hours=labor["labor_hours"],
            crew_size=labor["crew_size"],
            shift_hours=labor["shift_hours"],
            # Engine 5
            repair_method=resources["repair_method"],
            machinery_list=resources["machinery_list"],
            num_trucks=resources["num_trucks"],
            optimized_cost_lkr=resources["optimized_cost_lkr"],
            contractor_markup_lkr=resources["contractor_markup_lkr"],
            carbon_kg_co2e=resources["carbon_kg_co2e"],
        )

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ── Dev server ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
