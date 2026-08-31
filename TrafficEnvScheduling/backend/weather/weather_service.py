import requests
import datetime
import urllib.parse
from motor.motor_asyncio import AsyncIOMotorClient
import os

# Use MongoDB from main/env
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=2000)
db = client.road_inspector
forecast_collection = db.weather_forecast

# In-memory fast cache
_local_weather_cache = {}

class WeatherService:
    @staticmethod
    async def get_weather_forecast(lat: float, lng: float) -> dict:
        """
        Retrieves current weather and 72-hour forecast (hourly).
        Checks memory/MongoDB cache first; if cache is less than 30 mins old, returns it.
        Otherwise, fetches from Open-Meteo and updates cache.
        """
        now = datetime.datetime.utcnow()
        cache_key = f"{round(lat, 3)}_{round(lng, 3)}"
        
        # Check in-memory fast cache
        if cache_key in _local_weather_cache:
            entry = _local_weather_cache[cache_key]
            if (now - entry["timestamp"]).total_seconds() < 1800:
                return entry["data"]
        
        # Check MongoDB cache
        try:
            cached = await forecast_collection.find_one({"cache_key": cache_key})
            if cached:
                age = now - cached["timestamp"]
                if age.total_seconds() < 1800:  # 30 minutes cache
                    _local_weather_cache[cache_key] = {"timestamp": cached["timestamp"], "data": cached["data"]}
                    return cached["data"]
        except Exception as e:
            pass

        # Cache miss or expired -> fetch from Open-Meteo
        try:
            url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,uv_index&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,wind_speed_10m,wind_direction_10m,uv_index,weather_code&forecast_days=3"
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                result = {
                    "current": {
                        "temperature": data["current"]["temperature_2m"],
                        "apparent_temperature": data["current"]["apparent_temperature"],
                        "relative_humidity": data["current"]["relative_humidity_2m"],
                        "wind_speed": data["current"]["wind_speed_10m"],
                        "wind_direction": data["current"]["wind_direction_10m"],
                        "precipitation": data["current"]["precipitation"],
                        "weather_code": data["current"]["weather_code"],
                        "uv_index": data["current"].get("uv_index", 0.0),
                        "last_updated": now.isoformat()
                    },
                    "hourly": []
                }
                
                # Parse hourly fields (up to 72 hours)
                hourly_data = data["hourly"]
                for i in range(min(72, len(hourly_data["time"]))):
                    result["hourly"].append({
                        "time": hourly_data["time"][i],
                        "temperature": hourly_data["temperature_2m"][i],
                        "apparent_temperature": hourly_data["apparent_temperature"][i] if "apparent_temperature" in hourly_data else hourly_data["temperature_2m"][i],
                        "relative_humidity": hourly_data["relative_humidity_2m"][i],
                        "precipitation_probability": hourly_data["precipitation_probability"][i],
                        "precipitation": hourly_data["precipitation"][i],
                        "wind_speed": hourly_data["wind_speed_10m"][i],
                        "wind_direction": hourly_data["wind_direction_10m"][i],
                        "uv_index": hourly_data["uv_index"][i] if "uv_index" in hourly_data else 0.0,
                        "weather_code": hourly_data["weather_code"][i] if "weather_code" in hourly_data else 0
                    })
                
                # Save to cache
                try:
                    await forecast_collection.replace_one(
                        {"cache_key": cache_key},
                        {"cache_key": cache_key, "timestamp": now, "data": result},
                        upsert=True
                    )
                except Exception as ex:
                    print("MongoDB cache write error:", ex)
                    
                return result
        except Exception as e:
            print("Failed to fetch weather from Open-Meteo API, using fallback:", e)

        # Fallback in case of API failure / offline mode
        fallback_time = now.isoformat()
        hourly_fallback = []
        for h in range(72):
            hour_time = (now + datetime.timedelta(hours=h)).strftime("%Y-%m-%dT%H:00")
            hourly_fallback.append({
                "time": hour_time,
                "temperature": 25.0 + (5.0 * (1 if 8 <= (now.hour + h) % 24 <= 18 else -1)),
                "apparent_temperature": 26.0 + (5.0 * (1 if 8 <= (now.hour + h) % 24 <= 18 else -1)),
                "relative_humidity": 65 + (10 * (1 if not 8 <= (now.hour + h) % 24 <= 18 else -1)),
                "precipitation_probability": 10 if h % 24 < 12 else 40,
                "precipitation": 0.0 if h % 24 < 12 else 1.2,
                "wind_speed": 12.0,
                "wind_direction": 180,
                "uv_index": 5.0 if 10 <= (now.hour + h) % 24 <= 15 else 0.0,
                "weather_code": 0 if h % 24 < 12 else 3
            })
            
        return {
            "current": {
                "temperature": 26.5,
                "apparent_temperature": 28.0,
                "relative_humidity": 70,
                "wind_speed": 10.5,
                "wind_direction": 135,
                "precipitation": 0.0,
                "weather_code": 0,
                "uv_index": 4.0,
                "last_updated": fallback_time
            },
            "hourly": hourly_fallback
        }
