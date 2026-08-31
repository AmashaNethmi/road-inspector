import os
import pandas as pd
import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from backend.weather.weather_analysis_service import WeatherAnalysisService
from backend.weather.weather_history_service import WeatherHistoryService

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=2000)
db = client.road_inspector
backtest_collection = db.weather_backtest

class WeatherBacktestService:
    @staticmethod
    async def run_backtest(
        duration_hours: float = 4.0,
        curing_hours: float = 4.0,
        temp_min_c: float = 10.0,
        humidity_max_pct: float = 85.0,
        wind_max_kmh: float = 30.0,
        rain_max_prob: float = 20.0
    ) -> dict:
        """
        Runs the Weather Viability Engine backtest algorithm sequentially over all
        available historical rows in the MongoDB weather_history collection.
        Saves results to the weather_backtest collection.
        """
        # Fetch historical logs
        cursor = db.weather_history.find()
        history_rows = []
        async for doc in cursor:
            history_rows.append(doc)
            
        if not history_rows:
            # Import if empty
            await WeatherHistoryService.import_historical_data()
            cursor = db.weather_history.find()
            async for doc in cursor:
                history_rows.append(doc)
                
        if not history_rows:
            return {"error": "No history available to backtest"}
            
        # Re-sort chronologically
        history_rows = sorted(history_rows, key=lambda x: x["time"])
        
        total_slots = len(history_rows)
        required_slots = int(duration_hours + curing_hours)
        
        backtest_results = []
        total_days = 0
        allowed_days = 0
        blocked_days = 0
        
        reasons_summary = {
            "Temperature below threshold": 0,
            "Humidity too high": 0,
            "Wind speed unsafe": 0,
            "Rain probability too high": 0,
            "Precipitation detected in work/cure window": 0,
            "Surface not dry": 0,
            "Insufficient dry window": 0
        }
        
        # Analyze daily starting at 09:00 AM
        for idx in range(total_slots - required_slots):
            slot_time = history_rows[idx]["time"]
            if "T09:00" not in slot_time:
                continue
                
            total_days += 1
            # Create a mock forecast slice to run against the viability engine
            sub_window = []
            for k in range(required_slots):
                row = history_rows[idx + k]
                sub_window.append({
                    "time": row["time"],
                    "temperature": row["temperature"],
                    "relative_humidity": row.get("relative_humidity", 70.0),
                    "precipitation_probability": 80 if row["precipitation"] > 0 else 10,
                    "precipitation": row["precipitation"],
                    "wind_speed": row.get("wind_speed", 12.0),
                    "wind_direction": row.get("wind_direction", 180)
                })
                
            res = WeatherAnalysisService.calculate_viability(
                hourly_forecast=sub_window,
                start_idx=0,
                duration_hours=duration_hours,
                curing_hours=curing_hours,
                temp_min_c=temp_min_c,
                humidity_max_pct=humidity_max_pct,
                wind_max_kmh=wind_max_kmh,
                rain_max_prob=rain_max_prob
            )
            
            is_allowed = res["allowed"]
            if is_allowed:
                allowed_days += 1
            else:
                blocked_days += 1
                for reason in res["blocked_reasons"]:
                    matched = False
                    for key in reasons_summary.keys():
                        if key.lower() in reason.lower():
                            reasons_summary[key] += 1
                            matched = True
                    if not matched and "precipitation" in reason.lower():
                        reasons_summary["Insufficient dry window"] += 1
                            
            dt = datetime.datetime.fromisoformat(slot_time)
            backtest_results.append({
                "date": slot_time[:10],
                "year": dt.year,
                "month": dt.month,
                "score": res["viability_score"],
                "allowed": is_allowed,
                "risk": res["weather_risk_score"]
            })
            
        # Group monthly and yearly comparisons via pandas
        df_results = pd.DataFrame(backtest_results)
        
        # Monthly availability
        monthly_groups = df_results.groupby("month").agg(
            total=("allowed", "count"),
            allowed=("allowed", lambda x: int(x.sum())),
            avg_score=("score", "mean")
        )
        monthly_availability = []
        for m, r in monthly_groups.iterrows():
            monthly_availability.append({
                "month": int(m),
                "month_name": datetime.date(1900, int(m), 1).strftime('%B'),
                "total_days": int(r["total"]),
                "allowed_days": int(r["allowed"]),
                "blocked_days": int(r["total"] - r["allowed"]),
                "availability_rate": round((r["allowed"] / r["total"] * 100), 1) if r["total"] > 0 else 0,
                "average_score": round(float(r["avg_score"]), 1)
            })
            
        # Seasonal availability
        seasons = {
            "Southwest Monsoon (Wet)": [5, 6, 7, 8, 9],
            "Northeast Monsoon (Moderate)": [12, 1, 2],
            "Inter-Monsoon (Dry/Warm)": [3, 4, 10, 11]
        }
        seasonal_availability = []
        for name, months in seasons.items():
            s_df = df_results[df_results["month"].isin(months)]
            tot = len(s_df)
            allowed = int(s_df["allowed"].sum()) if tot > 0 else 0
            seasonal_availability.append({
                "season": name,
                "total_days": tot,
                "allowed_days": allowed,
                "blocked_days": tot - allowed,
                "availability_rate": round((allowed / tot * 100), 1) if tot > 0 else 0,
                "average_score": round(float(s_df["score"].mean()), 1) if tot > 0 else 0
            })
            
        # Yearly Comparison
        yearly_groups = df_results.groupby("year").agg(
            total=("allowed", "count"),
            allowed=("allowed", lambda x: int(x.sum()))
        )
        yearly_comparison = []
        for y, r in yearly_groups.iterrows():
            yearly_comparison.append({
                "year": int(y),
                "total_days": int(r["total"]),
                "allowed_days": int(r["allowed"]),
                "blocked_days": int(r["total"] - r["allowed"]),
                "availability_rate": round((r["allowed"] / r["total"] * 100), 1) if r["total"] > 0 else 0
            })
            
        summary = {
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "total_days_evaluated": total_days,
            "allowed_days": allowed_days,
            "blocked_days": blocked_days,
            "availability_percentage": round((allowed_days / total_days * 100), 1) if total_days > 0 else 0,
            "reasons_summary": reasons_summary,
            "monthly_availability": monthly_availability,
            "seasonal_availability": seasonal_availability,
            "yearly_comparison": yearly_comparison
        }
        
        # Save summary to Mongo backtest collection
        try:
            await backtest_collection.delete_many({})
            await backtest_collection.insert_one({
                "summary": summary,
                "details": backtest_results
            })
        except Exception as e:
            print("MongoDB save backtest error:", e)
            
        return {
            "summary": summary,
            "sample_details": backtest_results[:30]
        }
        
    @staticmethod
    async def get_latest_backtest() -> dict:
        """
        Retrieves the latest backtesting run results from MongoDB.
        """
        try:
            res = await backtest_collection.find_one()
            if res:
                res["_id"] = str(res["_id"])
                return res
        except Exception as e:
            print("MongoDB read backtest error:", e)
        return await WeatherBacktestService.run_backtest()
