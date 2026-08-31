"""
Module 3 — Pydantic Schemas
EstimationRequest  : incoming POST body
Module3EstimationResult : full structured response
"""

from pydantic import BaseModel, Field
from typing import List


# ── Request ────────────────────────────────────────────────────────────────────

class EstimationRequest(BaseModel):
    """Input payload from the engineer / upstream Module 2."""

    area_sqm: float = Field(
        ..., gt=0, description="Repair area in square meters"
    )
    depth_m: float = Field(
        ..., gt=0, description="Repair depth in meters (e.g. 0.05 for 5 cm)"
    )
    ambient_temp_c: float = Field(
        ..., description="Ambient air temperature at the site (°C)"
    )
    transport_time_hours: float = Field(
        ..., gt=0, description="Asphalt plant → site travel time in hours"
    )
    humidity_pct: float = Field(
        default=65.0, ge=0, le=100,
        description="Relative humidity at the site (%). Defaults to 65."
    )
    execution_mode: str = Field(
        default="in-house", description="Execution mode: 'in-house' (RDA) or 'outsourced' (Contractor)"
    )


# ── Response sub-groups (kept flat for simplicity) ────────────────────────────

class Module3EstimationResult(BaseModel):
    """Full estimation result returned by POST /api/v1/estimate."""

    # ── Engine 1 : Material Volumes ─────────────────────────────────────
    repair_volume_m3: float = Field(description="Compaction-adjusted repair volume (m³)")
    hma_tonnes: float = Field(description="Hot-Mix Asphalt required (metric tonnes)")
    bitumen_liters: float = Field(description="Bitumen / tar required (litres)")
    aggregate_m3: float = Field(description="Aggregate required (m³)")

    # ── Engine 2 : Thermodynamics ────────────────────────────────────────
    fourier_number: float = Field(description="Fourier number (Fo) for heat conduction")
    dispatch_temp_celsius: float = Field(description="Required plant dispatch temperature (°C)")
    target_arrival_temp: float = Field(description="Target arrival temperature at site (°C)")
    thermal_status: str = Field(description="'Optimal' or 'CRITICAL_WARNING'")

    # ── Engine 3 : Compaction Window ─────────────────────────────────────
    compaction_window_minutes: float = Field(description="Workable compaction window (minutes)")

    # ── Engine 4 : Labor ─────────────────────────────────────────────────
    labor_hours: float = Field(description="Total labor-hours required")
    crew_size: int = Field(description="Recommended crew size")
    shift_hours: int = Field(description="Standard shift duration (hours)")

    # ── Engine 5 : MILP Resource Optimisation ────────────────────────────
    repair_method: str = Field(description="Repair classification (Manual / Semi-mechanized / Mechanized)")
    machinery_list: List[str] = Field(description="Equipment assigned to the job")
    num_trucks: int = Field(description="Number of haulage trucks required")
    optimized_cost_lkr: float = Field(description="MILP-optimised total cost (LKR)")
    contractor_markup_lkr: float = Field(default=0.0, description="Contractor markup overhead and profit (LKR)")
    carbon_kg_co2e: float = Field(description="Estimated carbon emissions (kg CO₂e)")
