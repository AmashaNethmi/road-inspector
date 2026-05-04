"""
paving_window_optimizer.py
Optimal repair window computation engine.

Fuses weather suitability windows with traffic low-congestion periods
to identify the best time slots for road repairs, minimizing disruption.

Researcher: Manathunga M.A.D.V.G (IT22207968)
Research Novelty: "Analysis & Prediction Engine" paving window optimization
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List, Optional

from loguru import logger


@dataclass
class RepairWindow:
    """
    A recommended repair time window combining weather and traffic suitability.
    """
    start_time: datetime
    end_time: datetime
    predicted_duration_minutes: float
    weather_score: float            # 0-1 (1 = perfectly suitable)
    traffic_score: float            # 0-1 (1 = no congestion)
    combined_score: float           # Weighted combination
    weather_summary: str
    traffic_summary: str
    alternate_routes: List[str] = field(default_factory=list)

    @property
    def duration_hours(self) -> float:
        return (self.end_time - self.start_time).total_seconds() / 3600

    @property
    def rank_label(self) -> str:
        if self.combined_score >= 0.8:
            return "⭐ Optimal"
        elif self.combined_score >= 0.6:
            return "✅ Recommended"
        elif self.combined_score >= 0.4:
            return "⚠️ Acceptable"
        return "❌ Avoid"

    def to_dict(self) -> dict:
        return {
            "start": self.start_time.isoformat(),
            "end": self.end_time.isoformat(),
            "duration_hours": round(self.duration_hours, 2),
            "predicted_repair_minutes": round(self.predicted_duration_minutes, 1),
            "weather_score": round(self.weather_score, 3),
            "traffic_score": round(self.traffic_score, 3),
            "combined_score": round(self.combined_score, 3),
            "rank": self.rank_label,
            "weather_summary": self.weather_summary,
            "traffic_summary": self.traffic_summary,
            "alternate_routes": self.alternate_routes
        }


class PavingWindowOptimizer:
    """
    Computes optimal paving windows by intersecting weather and traffic forecasts.

    Algorithm:
    1. Get hourly weather suitability for next 48h.
    2. Get hourly traffic congestion forecast for next 48h.
    3. For each hour, compute a combined suitability score:
           score = α * weather_score + β * traffic_score
    4. Find consecutive blocks where score > threshold.
    5. Rank windows by score and filter by minimum block duration.
    6. Attach alternate route suggestions to top recommendations.

    Parameters:
        weather_weight (α): Weight for weather in combined score (default 0.6).
        traffic_weight (β): Weight for traffic in combined score (default 0.4).
        min_window_hours: Minimum viable repair window.
        score_threshold: Minimum combined score to consider.
    """

    def __init__(
        self,
        weather_weight: float = 0.6,
        traffic_weight: float = 0.4,
        min_window_hours: float = 2.0,
        score_threshold: float = 0.55
    ):
        assert abs(weather_weight + traffic_weight - 1.0) < 1e-6, \
            "Weather and traffic weights must sum to 1.0"
        self.weather_weight = weather_weight
        self.traffic_weight = traffic_weight
        self.min_window_hours = min_window_hours
        self.score_threshold = score_threshold

        logger.info(
            "PavingWindowOptimizer: α(weather)={}, β(traffic)={}, threshold={}",
            weather_weight, traffic_weight, score_threshold
        )

    def compute_optimal_windows(
        self,
        hourly_weather: List[dict],
        hourly_traffic: List[dict],
        predicted_duration_minutes: float,
        top_n: int = 3
    ) -> List[RepairWindow]:
        """
        Compute and rank the top N optimal repair windows.

        Args:
            hourly_weather: List of hourly dicts with 'timestamp', 'is_suitable',
                            'temperature_c', 'rainfall_mm_1h', 'condition_desc'.
            hourly_traffic: List of hourly dicts with 'hour', 'jam_factor',
                            'is_suitable_for_repair', 'congestion_level'.
            predicted_duration_minutes: Required repair duration from RF predictor.
            top_n: Number of top windows to return.

        Returns:
            List of RepairWindow objects ranked by combined_score.
        """
        min_hours_needed = max(
            self.min_window_hours,
            predicted_duration_minutes / 60.0 + 0.5   # Buffer
        )

        # Build hourly score series
        scored_hours = self._score_hourly_slots(hourly_weather, hourly_traffic)

        # Find contiguous suitable windows
        windows = self._extract_windows(
            scored_hours,
            min_hours_needed=min_hours_needed,
            predicted_duration_minutes=predicted_duration_minutes
        )

        # Sort by combined score descending
        windows.sort(key=lambda w: w.combined_score, reverse=True)

        top_windows = windows[:top_n]
        logger.info(
            "Found {} suitable windows. Top score: {:.3f}",
            len(windows),
            top_windows[0].combined_score if top_windows else 0
        )
        return top_windows

    def _score_hourly_slots(
        self, weather: List[dict], traffic: List[dict]
    ) -> List[dict]:
        """
        Compute a combined score for each hourly slot.
        Aligns weather and traffic by hour index.
        """
        scored = []
        n = min(len(weather), len(traffic))

        for i in range(n):
            w = weather[i]
            t = traffic[i]

            # Weather score: binary suitability + smoothing
            weather_score = 1.0 if w.get("is_suitable_for_repair", False) else 0.0
            # Penalize high rainfall even if "suitable"
            rain = w.get("rainfall_mm_1h", 0.0)
            weather_score *= max(0.0, 1.0 - rain / 5.0)

            # Traffic score: inverse of jam factor (0=free, 10=gridlock)
            jam = min(t.get("jam_factor", 0.0), 10.0)
            traffic_score = 1.0 - (jam / 10.0)
            # Halve score during peak hours
            if t.get("is_peak", False):
                traffic_score *= 0.5

            combined = (
                self.weather_weight * weather_score
                + self.traffic_weight * traffic_score
            )

            # Parse timestamp
            ts = w.get("timestamp") or datetime.fromisoformat(t.get("hour", ""))

            scored.append({
                "timestamp": ts,
                "weather_score": weather_score,
                "traffic_score": traffic_score,
                "combined_score": combined,
                "weather_desc": w.get("condition_desc", ""),
                "traffic_level": t.get("congestion_level", ""),
                "temperature_c": w.get("temperature_c", 0),
                "rainfall_mm": w.get("rainfall_mm_1h", 0)
            })

        return scored

    def _extract_windows(
        self,
        scored_hours: List[dict],
        min_hours_needed: float,
        predicted_duration_minutes: float
    ) -> List[RepairWindow]:
        """Find contiguous blocks above score_threshold."""
        windows = []
        in_window = False
        window_start_idx = 0

        for i, slot in enumerate(scored_hours):
            above = slot["combined_score"] >= self.score_threshold

            if above and not in_window:
                in_window = True
                window_start_idx = i
            elif (not above or i == len(scored_hours) - 1) and in_window:
                in_window = False
                end_idx = i if not above else i + 1
                block = scored_hours[window_start_idx:end_idx]
                duration_h = len(block)

                if duration_h >= min_hours_needed:
                    avg_weather = sum(s["weather_score"] for s in block) / len(block)
                    avg_traffic = sum(s["traffic_score"] for s in block) / len(block)
                    avg_combined = sum(s["combined_score"] for s in block) / len(block)

                    start_ts = block[0]["timestamp"]
                    end_ts = block[-1]["timestamp"]
                    if isinstance(start_ts, str):
                        start_ts = datetime.fromisoformat(start_ts)
                    if isinstance(end_ts, str):
                        end_ts = datetime.fromisoformat(end_ts)
                    if not isinstance(end_ts, datetime):
                        end_ts = start_ts + timedelta(hours=duration_h)

                    window = RepairWindow(
                        start_time=start_ts,
                        end_time=end_ts,
                        predicted_duration_minutes=predicted_duration_minutes,
                        weather_score=avg_weather,
                        traffic_score=avg_traffic,
                        combined_score=avg_combined,
                        weather_summary=(
                            f"Avg temp: {sum(s['temperature_c'] for s in block)/len(block):.1f}°C, "
                            f"Rain: {sum(s['rainfall_mm'] for s in block)/len(block):.1f}mm/h"
                        ),
                        traffic_summary=f"Avg congestion: {block[0].get('traffic_level', 'unknown')}"
                    )
                    windows.append(window)

        return windows
