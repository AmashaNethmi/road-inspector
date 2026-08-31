import datetime
import math
from typing import List, Dict, Any
from backend.traffic.traffic_service import TrafficService

class ForecastService:
    @staticmethod
    def generate_72h_forecast(
        base_volume: int = 1200,
        capacity: int = 2500,
        model_name: str = "LSTM"
    ) -> Dict[str, Any]:
        """
        Generates 72-hour traffic forecasting predictions using the selected model.
        Outputs hourly forecast, peak/low predictions, and repair-friendly periods.
        """
        now = datetime.datetime.now()
        hourly_predictions = []
        
        # Simulating forecast weights based on model characteristics
        # Seasonal Naive = periodic pattern
        # Prophet = trend + smooth seasonal
        # LightGBM = sharper peaks
        # LSTM = smooth neural curve
        model_factor = 1.05 if model_name == "LightGBM" else (0.95 if model_name == "Seasonal Naive" else 1.0)
        
        peak_volume = 0
        low_volume = 999999
        peak_hour_lbl = ""
        low_hour_lbl = ""
        
        for h in range(72):
            forecast_time = now + datetime.timedelta(hours=h)
            hour_val = forecast_time.hour + forecast_time.minute / 60.0
            
            # Rush hour multiplier (7-9 AM, 4:30-7 PM)
            is_rush = (7 <= hour_val <= 9) or (16.5 <= hour_val <= 19)
            
            # Periodic wave: higher during the day, lowest at night (1-4 AM)
            wave = math.sin((hour_val - 6) / 24.0 * 2.0 * math.pi)  # ranges -1 to 1
            
            # Base logic
            base = base_volume * (0.6 + 0.4 * wave)
            if is_rush:
                base *= 1.8
                
            # Random variations based on model style
            random.seed(h + 99)
            variation = base * random.uniform(-0.08, 0.08)
            predicted_count = max(50, int((base + variation) * model_factor))
            
            # Congestion and status mapping
            status = TrafficService.calculate_current_status(predicted_count, capacity)
            
            hourly_predictions.append({
                "time": forecast_time.strftime("%Y-%m-%dT%H:00"),
                "predicted_count": predicted_count,
                "congestion_level": status["congestion_level"],
                "utilization_pct": status["utilization_pct"],
                "risk_score": status["risk_score"],
                "average_speed_kmh": status["average_speed_kmh"]
            })
            
            if predicted_count > peak_volume:
                peak_volume = predicted_count
                peak_hour_lbl = forecast_time.strftime("%Y-%m-%dT%H:00")
            if predicted_count < low_volume:
                low_volume = predicted_count
                low_hour_lbl = forecast_time.strftime("%Y-%m-%dT%H:00")
                
        # Find 3 best repair periods (low traffic and low congestion)
        # Search for windows of 4 hours
        repair_windows = []
        for i in range(len(hourly_predictions) - 4):
            slice_4h = hourly_predictions[i:i+4]
            avg_count = sum(s["predicted_count"] for s in slice_4h) / 4.0
            avg_utilization = sum(s["utilization_pct"] for s in slice_4h) / 4.0
            avg_risk = sum(s["risk_score"] for s in slice_4h) / 4.0
            
            # Score: higher is better. Scale inversely to utilization and risk
            traffic_score = round(max(0, 100 - avg_utilization))
            congestion_score = round(max(0, 100 - avg_risk))
            confidence_score = round(max(50, 98 - (i * 0.15)))  # higher confidence for near term
            
            repair_windows.append({
                "start_time": slice_4h[0]["time"],
                "end_time": slice_4h[-1]["time"],
                "avg_count": round(avg_count),
                "traffic_score": traffic_score,
                "congestion_score": congestion_score,
                "confidence_score": confidence_score,
                "reason": f"Low forecasted volume ({round(avg_count)} v/h) and minimal congestion delay risk."
            })
            
        # Sort and take top 3
        best_windows = sorted(repair_windows, key=lambda x: (x["traffic_score"] + x["congestion_score"]), reverse=True)
        unique_windows = []
        for w in best_windows:
            if len(unique_windows) >= 3:
                break
            # ensure start hours are at least 4 hours apart
            too_close = False
            for uw in unique_windows:
                t1 = datetime.datetime.fromisoformat(w["start_time"])
                t2 = datetime.datetime.fromisoformat(uw["start_time"])
                if abs((t1 - t2).total_seconds()) < 14400:
                    too_close = True
                    break
            if not too_close:
                unique_windows.append(w)
                
        return {
            "model_name": model_name,
            "hourly_forecast": hourly_predictions,
            "peak_traffic": {
                "time": peak_hour_lbl,
                "count": peak_volume
            },
            "low_traffic": {
                "time": low_hour_lbl,
                "count": low_volume
            },
            "recommended_repair_periods": unique_windows
        }

# Include random locally to avoid import issues
import random
