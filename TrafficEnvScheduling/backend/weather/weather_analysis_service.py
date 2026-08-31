import datetime
import math
from typing import List, Dict, Any

class WeatherAnalysisService:
    @staticmethod
    def calculate_viability(
        hourly_forecast: List[Dict[str, Any]],
        start_idx: int,
        duration_hours: float,
        curing_hours: float = 4.0,
        temp_min_c: float = 10.0,
        humidity_max_pct: float = 85.0,
        wind_max_kmh: float = 30.0,
        rain_max_prob: float = 60.0
    ) -> Dict[str, Any]:
        """
        Calculates detailed weather viability for a specific window in the forecast.
        """
        # Duration + curing window
        required_hours = int(math.ceil(duration_hours + curing_hours))
        end_idx = start_idx + required_hours
        
        if end_idx > len(hourly_forecast):
            # Window exceeds forecast length
            return {
                "start_time": hourly_forecast[start_idx]["time"] if start_idx < len(hourly_forecast) else "",
                "end_time": hourly_forecast[-1]["time"] if hourly_forecast else "",
                "duration": duration_hours,
                "curing_hours": curing_hours,
                "viability_score": 0,
                "allowed": False,
                "blocked_reasons": ["Insufficient dry window (exceeds forecast timeframe)"],
                "weather_risk_score": 100,
                "confidence_score": 50,
                "uncertainty": 50,
                "risk_analysis": {
                    "temp_risk": 100,
                    "humidity_risk": 100,
                    "wind_risk": 100,
                    "rain_risk": 100,
                    "overall_risk": 100
                },
                "confidence_interval": {
                    "temp_min": 0.0,
                    "temp_max": 0.0
                },
                "parameters": {
                    "avg_temp": 0.0,
                    "max_humidity": 0,
                    "max_wind": 0.0,
                    "max_rain_prob": 0,
                    "dry_surface": False
                }
            }
            
        target_hours = hourly_forecast[start_idx:end_idx]
        
        # Extract values over the window
        temps = [h["temperature"] for h in target_hours]
        humidities = [h["relative_humidity"] for h in target_hours]
        winds = [h["wind_speed"] for h in target_hours]
        rain_probs = [h["precipitation_probability"] for h in target_hours]
        precips = [h["precipitation"] for h in target_hours]
        
        min_temp = min(temps)
        max_humidity = max(humidities)
        max_wind = max(winds)
        max_rain_prob = max(rain_probs)
        total_precip = sum(precips)
        
        # Check previous rainfall to see if surface is dry
        # (Look back up to 6 hours if available in forecast before start_idx)
        prev_rainfall = 0.0
        lookback = max(0, start_idx - 6)
        if start_idx > 0:
            prev_rainfall = sum(h["precipitation"] for h in hourly_forecast[lookback:start_idx])
            
        is_surface_dry = prev_rainfall < 0.1
        
        # Determine blocked reasons
        reasons = []
        if min_temp < temp_min_c:
            reasons.append(f"Temperature below threshold ({min_temp:.1f}°C < {temp_min_c:.1f}°C)")
        if max_humidity > humidity_max_pct:
            reasons.append(f"Humidity too high ({max_humidity:.1f}% > {humidity_max_pct:.1f}%)")
        if max_wind > wind_max_kmh:
            reasons.append(f"Wind speed unsafe ({max_wind:.1f} km/h > {wind_max_kmh:.1f} km/h)")
        if max_rain_prob > rain_max_prob:
            reasons.append(f"Rain probability too high ({max_rain_prob:.1f}% > {rain_max_prob:.1f}%)")
        if total_precip > 0.1:
            reasons.append(f"Insufficient dry window (precipitation detected: {total_precip:.2f} mm)")
        if not is_surface_dry:
            reasons.append(f"Surface not dry (previous rainfall of {prev_rainfall:.2f} mm in last 6 hours)")

        # Risk calculation
        temp_risk = min(100.0, max(0.0, (temp_min_c + 5 - min_temp) * 20)) if min_temp < (temp_min_c + 5) else 0.0
        humidity_risk = min(100.0, max(0.0, (max_humidity - (humidity_max_pct - 15)) * 6.7)) if max_humidity > (humidity_max_pct - 15) else 0.0
        wind_risk = min(100.0, max(0.0, (max_wind - (wind_max_kmh - 10)) * 10)) if max_wind > (wind_max_kmh - 10) else 0.0
        rain_risk = max_rain_prob
        
        overall_risk = round((temp_risk + humidity_risk + wind_risk + rain_risk) / 4)
        
        # Calculate Viability Score
        # Start at 100, apply penalty per rule violation
        score = 100.0
        score -= len(reasons) * 20.0
        score -= overall_risk * 0.3
        score = max(0.0, min(100.0, score))
        
        # Allowed/Blocked
        allowed = len(reasons) == 0 and score >= 60.0
        
        # Forecast Confidence / Uncertainty / Confidence Interval
        # Higher confidence for closer times, decays slightly over 72h window
        time_decay = 1.0 - (start_idx / 240)  # decay max 30% at 72h
        uncertainty = round((overall_risk * 0.3) + (start_idx * 0.15))
        confidence = round(max(50.0, min(98.0, (score * 0.5 + 50.0) * time_decay)))
        
        # Confidence Interval for Temperature
        avg_temp = sum(temps) / len(temps) if temps else 0.0
        temp_std = math.sqrt(sum((t - avg_temp) ** 2 for t in temps) / len(temps)) if len(temps) > 1 else 0.5
        margin = 1.96 * (temp_std + (start_idx * 0.05))
        temp_min_ci = round(avg_temp - margin, 1)
        temp_max_ci = round(avg_temp + margin, 1)
        
        return {
            "start_time": hourly_forecast[start_idx]["time"],
            "end_time": hourly_forecast[end_idx - 1]["time"] if end_idx - 1 < len(hourly_forecast) else hourly_forecast[-1]["time"],
            "duration": duration_hours,
            "curing_hours": curing_hours,
            "viability_score": round(score),
            "allowed": allowed,
            "blocked_reasons": reasons,
            "weather_risk_score": overall_risk,
            "confidence_score": confidence,
            "uncertainty": uncertainty,
            "risk_analysis": {
                "temp_risk": round(temp_risk),
                "humidity_risk": round(humidity_risk),
                "wind_risk": round(wind_risk),
                "rain_risk": round(rain_risk),
                "overall_risk": overall_risk
            },
            "confidence_interval": {
                "temp_min": temp_min_ci,
                "temp_max": temp_max_ci
            },
            "parameters": {
                "avg_temp": round(avg_temp, 1),
                "max_humidity": round(max_humidity),
                "max_wind": round(max_wind, 1),
                "max_rain_prob": round(max_rain_prob),
                "dry_surface": is_surface_dry
            }
        }

    @staticmethod
    def get_repair_windows(
        hourly_forecast: List[Dict[str, Any]],
        duration_hours: float,
        curing_hours: float = 4.0
    ) -> List[Dict[str, Any]]:
        """
        Scans all hourly slots in the 72-hour window and ranks best repair windows.
        """
        all_windows = []
        required_hours = int(math.ceil(duration_hours + curing_hours))
        for i in range(len(hourly_forecast) - required_hours):
            window = WeatherAnalysisService.calculate_viability(
                hourly_forecast, i, duration_hours, curing_hours
            )
            all_windows.append(window)
            
        # Sort by: allowed first, then higher viability score, then lower risk
        sorted_windows = sorted(
            all_windows, 
            key=lambda x: (1 if x["allowed"] else 0, x["viability_score"], -x["weather_risk_score"]),
            reverse=True
        )
        
        # Filter duplicates (keep windows that are at least 4 hours apart)
        unique_windows = []
        for w in sorted_windows:
            if len(unique_windows) >= 3:
                break
            
            too_close = False
            for uw in unique_windows:
                t1 = datetime.datetime.fromisoformat(w["start_time"].replace('Z', ''))
                t2 = datetime.datetime.fromisoformat(uw["start_time"].replace('Z', ''))
                if abs((t1 - t2).total_seconds()) < 14400:  # 4 hours
                    too_close = True
                    break
            
            if not too_close:
                unique_windows.append(w)
                
        # If we got less than 3, just add next best
        if len(unique_windows) < 3:
            for w in sorted_windows:
                if len(unique_windows) >= 3:
                    break
                if w not in unique_windows:
                    unique_windows.append(w)
                    
        return unique_windows
