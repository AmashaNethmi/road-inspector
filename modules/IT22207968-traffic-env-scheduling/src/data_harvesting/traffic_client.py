"""
traffic_client.py
Traffic density client using Google Maps and TomTom APIs.

Retrieves real-time congestion levels and flow speed data for
road repair scheduling optimization.

Researcher: Manathunga M.A.D.V.G (IT22207968)
"""

import os
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import List, Optional, Tuple

import requests
from loguru import logger


@dataclass
class TrafficReading:
    """
    Represents traffic conditions at a specific road segment and time.
    """
    timestamp: datetime
    lat: float
    lon: float
    current_speed_kmh: float
    free_flow_speed_kmh: float
    congestion_ratio: float         # current / free_flow (1.0 = no congestion)
    jam_factor: float               # 0-10 scale (TomTom)
    confidence: float               # 0-1 API confidence
    is_peak_hour: bool

    @property
    def congestion_level(self) -> str:
        """Categorize congestion into human-readable levels."""
        if self.jam_factor <= 2:
            return "free"
        elif self.jam_factor <= 4:
            return "light"
        elif self.jam_factor <= 7:
            return "moderate"
        else:
            return "heavy"

    @property
    def is_suitable_for_repair(self) -> bool:
        """Traffic is acceptable for repair if congestion is free or light."""
        return self.jam_factor <= 3.0 and not self.is_peak_hour

    def to_features(self) -> dict:
        return {
            "current_speed_kmh": self.current_speed_kmh,
            "free_flow_speed_kmh": self.free_flow_speed_kmh,
            "congestion_ratio": self.congestion_ratio,
            "jam_factor": self.jam_factor,
            "is_peak_hour": int(self.is_peak_hour),
            "congestion_level_encoded": ["free", "light", "moderate", "heavy"].index(
                self.congestion_level
            )
        }


class TrafficClient:
    """
    Multi-source traffic client combining TomTom Flow API and Google Maps.

    Primary source: TomTom Traffic Flow API (real-time vehicle speed and
    jam factor for a given geographic coordinate).

    Secondary source: Google Maps Distance Matrix (travel time to estimate
    route-level congestion).

    Design Note:
        TomTom is used as primary due to higher geographic coverage in
        South/Southeast Asia compared to HERE Maps.
    """

    TOMTOM_FLOW_URL = "https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/14/json"

    def __init__(
        self,
        tomtom_api_key: Optional[str] = None,
        google_api_key: Optional[str] = None,
        peak_hours: Optional[List[Tuple[int, int]]] = None
    ):
        self.tomtom_key = tomtom_api_key or os.environ.get("TOMTOM_API_KEY")
        self.google_key = google_api_key or os.environ.get("GOOGLE_MAPS_API_KEY")
        # Default Sri Lanka peak hours: 7-9 AM, 4-7 PM
        self.peak_hours = peak_hours or [(7, 9), (16, 19)]

        if not self.tomtom_key:
            logger.warning("TomTom API key not set. Traffic readings will be unavailable.")

        logger.info("TrafficClient initialized.")

    def get_traffic_at_location(self, lat: float, lon: float) -> Optional[TrafficReading]:
        """
        Fetch real-time traffic conditions at a GPS coordinate.

        Args:
            lat, lon: GPS coordinates of the repair site.

        Returns:
            TrafficReading or None if API is unavailable.
        """
        if not self.tomtom_key:
            logger.error("Cannot fetch traffic: TomTom API key not configured.")
            return None

        params = {
            "key": self.tomtom_key,
            "point": f"{lat},{lon}",
            "unit": "KMPH",
            "openLr": "false"
        }

        try:
            response = requests.get(self.TOMTOM_FLOW_URL, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            return self._parse_tomtom_response(data, lat, lon)
        except requests.RequestException as e:
            logger.error("TomTom API error: {}", e)
            return None

    def is_peak_hour(self, dt: Optional[datetime] = None) -> bool:
        """
        Check if a given datetime falls within defined peak traffic hours.

        Args:
            dt: Datetime to check. Defaults to current time.

        Returns:
            True if within peak hours.
        """
        if dt is None:
            dt = datetime.now()
        hour = dt.hour
        for start, end in self.peak_hours:
            if start <= hour < end:
                return True
        return False

    def get_congestion_forecast(
        self, lat: float, lon: float, hours_ahead: int = 24
    ) -> List[dict]:
        """
        Generate a simplified congestion forecast using historical patterns.

        Note: TomTom's historic traffic patterns API requires an Enterprise
        subscription. This implementation generates a heuristic forecast
        based on typical Sri Lankan urban traffic patterns.

        Args:
            lat, lon: Location.
            hours_ahead: Forecast horizon.

        Returns:
            List of hourly congestion estimates.
        """
        now = datetime.now()
        forecast = []

        for hour_offset in range(hours_ahead):
            from datetime import timedelta
            future_dt = now + timedelta(hours=hour_offset)
            peak = self.is_peak_hour(future_dt)
            weekday = future_dt.weekday()  # 0=Mon, 6=Sun

            # Heuristic jam factor based on time of day and day of week
            if weekday >= 5:  # Weekend — lower traffic
                base_jam = 1.5
            elif peak:
                base_jam = 7.0 if future_dt.hour in [7, 8, 17, 18] else 5.0
            elif 9 <= future_dt.hour <= 16:
                base_jam = 3.0
            elif future_dt.hour < 6 or future_dt.hour >= 22:
                base_jam = 0.5
            else:
                base_jam = 2.0

            forecast.append({
                "hour": future_dt.strftime("%Y-%m-%dT%H:00"),
                "jam_factor": base_jam,
                "congestion_level": self._jam_to_level(base_jam),
                "is_peak": peak,
                "is_suitable_for_repair": base_jam <= 3.0 and not peak
            })

        return forecast

    def _parse_tomtom_response(self, data: dict, lat: float, lon: float) -> TrafficReading:
        """Parse TomTom Flow API response into a TrafficReading."""
        flow = data.get("flowSegmentData", {})
        current_speed = float(flow.get("currentSpeed", 0))
        free_flow = float(flow.get("freeFlowSpeed", max(current_speed, 1)))
        confidence = float(flow.get("confidence", 0))
        jam_factor = float(flow.get("currentTravelTime", 0)) / max(
            float(flow.get("freeFlowTravelTime", 1)), 1
        ) * 5  # Normalize to 0-10 scale

        return TrafficReading(
            timestamp=datetime.now(tz=timezone.utc),
            lat=lat,
            lon=lon,
            current_speed_kmh=current_speed,
            free_flow_speed_kmh=free_flow,
            congestion_ratio=current_speed / max(free_flow, 1),
            jam_factor=min(jam_factor, 10.0),
            confidence=confidence,
            is_peak_hour=self.is_peak_hour()
        )

    @staticmethod
    def _jam_to_level(jam_factor: float) -> str:
        if jam_factor <= 2:
            return "free"
        elif jam_factor <= 4:
            return "light"
        elif jam_factor <= 7:
            return "moderate"
        return "heavy"
