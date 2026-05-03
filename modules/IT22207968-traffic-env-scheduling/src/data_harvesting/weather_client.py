"""
weather_client.py
OpenWeather API client for real-time and forecast weather data.

Fetches current conditions and 48-hour forecast for Sri Lankan road
repair scheduling. Returns structured WeatherReading objects.

Researcher: Manathunga M.A.D.V.G (IT22207968)
"""

import os
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import List, Optional

import requests
from loguru import logger


@dataclass
class WeatherReading:
    """Structured representation of a weather observation or forecast point."""
    timestamp: datetime
    temperature_c: float
    feels_like_c: float
    humidity_pct: float
    rainfall_mm_1h: float           # mm in past/next hour (0 if no rain)
    wind_speed_ms: float
    cloud_cover_pct: int
    condition_code: int             # OpenWeather condition code
    condition_desc: str
    is_suitable_for_repair: bool    # Derived suitability flag

    @property
    def is_raining(self) -> bool:
        return self.rainfall_mm_1h > 0.5

    def to_features(self) -> dict:
        """Convert to ML feature dictionary for the Random Forest predictor."""
        return {
            "temperature_c": self.temperature_c,
            "humidity_pct": self.humidity_pct,
            "rainfall_mm_1h": self.rainfall_mm_1h,
            "wind_speed_ms": self.wind_speed_ms,
            "cloud_cover_pct": self.cloud_cover_pct,
            "is_raining": int(self.is_raining),
            "is_suitable": int(self.is_suitable_for_repair)
        }


class OpenWeatherClient:
    """
    Client for the OpenWeather API.

    Fetches:
    1. Current weather conditions at GPS coordinates.
    2. 48-hour hourly forecast (via One Call API v3.0).

    Suitability Determination:
        A weather window is marked suitable for asphalt repair if:
        - Rainfall < 2.0 mm/hr (prevents bitumen dilution)
        - Temperature 10°C < T < 35°C (asphalt compaction range)
        - No thunderstorm (code 2xx)

    Reference:
        Smart Construction Management: Impact of weather on asphalt curing.
    """

    BASE_URL = "https://api.openweathermap.org/data/2.5"
    ONE_CALL_URL = "https://api.openweathermap.org/data/3.0/onecall"

    def __init__(
        self,
        api_key: Optional[str] = None,
        max_rainfall_mm: float = 2.0,
        min_temp_c: float = 10.0,
        max_temp_c: float = 35.0
    ):
        self.api_key = api_key or os.environ.get("OPENWEATHER_API_KEY")
        if not self.api_key:
            raise ValueError(
                "OpenWeather API key required. Set OPENWEATHER_API_KEY env variable."
            )
        self.max_rainfall_mm = max_rainfall_mm
        self.min_temp_c = min_temp_c
        self.max_temp_c = max_temp_c
        logger.info("OpenWeatherClient initialized.")

    def get_current_weather(self, lat: float, lon: float) -> WeatherReading:
        """
        Fetch current weather conditions at the given coordinates.

        Args:
            lat: Latitude (decimal degrees)
            lon: Longitude (decimal degrees)

        Returns:
            WeatherReading with current conditions.
        """
        url = f"{self.BASE_URL}/weather"
        params = {
            "lat": lat,
            "lon": lon,
            "appid": self.api_key,
            "units": "metric"
        }

        response = self._get(url, params)
        return self._parse_current(response)

    def get_hourly_forecast(self, lat: float, lon: float, hours: int = 48) -> List[WeatherReading]:
        """
        Fetch hourly weather forecast for the next `hours` hours.

        Args:
            lat, lon: Coordinates.
            hours: Number of forecast hours (max 48).

        Returns:
            List of WeatherReading objects, one per hour.
        """
        url = self.ONE_CALL_URL
        params = {
            "lat": lat,
            "lon": lon,
            "appid": self.api_key,
            "units": "metric",
            "exclude": "current,minutely,daily,alerts"
        }

        response = self._get(url, params)
        hourly_data = response.get("hourly", [])[:hours]
        return [self._parse_hourly(h) for h in hourly_data]

    def find_suitable_windows(
        self, lat: float, lon: float, min_consecutive_hours: int = 6
    ) -> List[dict]:
        """
        Find consecutive weather windows suitable for road repair.

        Args:
            lat, lon: Repair site coordinates.
            min_consecutive_hours: Minimum dry, suitable window duration.

        Returns:
            List of dicts with 'start', 'end', 'duration_hours' for each window.
        """
        forecast = self.get_hourly_forecast(lat, lon, hours=48)
        windows = []
        window_start = None
        window_length = 0

        for reading in forecast:
            if reading.is_suitable_for_repair:
                if window_start is None:
                    window_start = reading.timestamp
                window_length += 1
            else:
                if window_start and window_length >= min_consecutive_hours:
                    windows.append({
                        "start": window_start,
                        "end": reading.timestamp,
                        "duration_hours": window_length,
                        "type": "weather"
                    })
                window_start = None
                window_length = 0

        logger.info(
            "Found {} suitable weather windows (min {}h) at ({:.4f}, {:.4f})",
            len(windows), min_consecutive_hours, lat, lon
        )
        return windows

    def _parse_current(self, data: dict) -> WeatherReading:
        """Parse current weather API response."""
        rain = data.get("rain", {}).get("1h", 0.0)
        temp = data["main"]["temp"]
        condition_code = data["weather"][0]["id"]

        return WeatherReading(
            timestamp=datetime.fromtimestamp(data["dt"], tz=timezone.utc),
            temperature_c=temp,
            feels_like_c=data["main"]["feels_like"],
            humidity_pct=data["main"]["humidity"],
            rainfall_mm_1h=rain,
            wind_speed_ms=data["wind"]["speed"],
            cloud_cover_pct=data["clouds"]["all"],
            condition_code=condition_code,
            condition_desc=data["weather"][0]["description"],
            is_suitable_for_repair=self._is_suitable(temp, rain, condition_code)
        )

    def _parse_hourly(self, data: dict) -> WeatherReading:
        """Parse a single hourly forecast entry."""
        rain = data.get("rain", {}).get("1h", 0.0)
        temp = data["temp"]
        condition_code = data["weather"][0]["id"]

        return WeatherReading(
            timestamp=datetime.fromtimestamp(data["dt"], tz=timezone.utc),
            temperature_c=temp,
            feels_like_c=data["feels_like"],
            humidity_pct=data["humidity"],
            rainfall_mm_1h=rain,
            wind_speed_ms=data["wind_speed"],
            cloud_cover_pct=data["clouds"],
            condition_code=condition_code,
            condition_desc=data["weather"][0]["description"],
            is_suitable_for_repair=self._is_suitable(temp, rain, condition_code)
        )

    def _is_suitable(self, temp_c: float, rain_mm: float, condition_code: int) -> bool:
        """
        Determine if weather conditions are suitable for asphalt road repair.

        Rules:
        - Temperature within [min_temp_c, max_temp_c]
        - Rainfall below threshold
        - No thunderstorm (OpenWeather codes 200-232)
        """
        is_thunderstorm = 200 <= condition_code <= 232
        return (
            self.min_temp_c <= temp_c <= self.max_temp_c
            and rain_mm < self.max_rainfall_mm
            and not is_thunderstorm
        )

    def _get(self, url: str, params: dict) -> dict:
        """Make a GET request with error handling."""
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.HTTPError as e:
            logger.error("HTTP error from OpenWeather API: {}", e)
            raise
        except requests.RequestException as e:
            logger.error("Network error: {}", e)
            raise
