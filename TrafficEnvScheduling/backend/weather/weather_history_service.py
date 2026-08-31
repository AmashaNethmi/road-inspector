import os
import pandas as pd
import numpy as np
import datetime
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=2000)
db = client.road_inspector
history_collection = db.weather_history

class WeatherHistoryService:
    @staticmethod
    def get_mongodb_connection():
        return history_collection

    @staticmethod
    async def import_historical_data() -> dict:
        """
        Reads backend/data/historical_weather_sample.csv,
        parses the rows, and loads them into MongoDB weather_history collection.
        """
        data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
        csv_path = os.path.join(data_dir, 'historical_weather_sample.csv')
        
        if not os.path.exists(csv_path):
            csv_path = os.path.join(data_dir, 'weather_history.csv')
            
        if not os.path.exists(csv_path):
            return {"status": "error", "message": f"Historical CSV file not found at {csv_path}"}
            
        # Parse CSV
        rows = []
        try:
            started = False
            with open(csv_path, 'r', encoding='utf-8') as f:
                for line in f:
                    if not started:
                        if line.startswith("time"):
                            started = True
                        continue
                    parts = line.strip().split(',')
                    if len(parts) >= 3 and parts[0]:
                        hour = int(parts[0][11:13]) if len(parts[0]) >= 13 else 12
                        rows.append({
                            "time": parts[0],
                            "temperature": float(parts[1]) if parts[1] else 25.0,
                            "precipitation": float(parts[2]) if parts[2] else 0.0,
                            # Synthesize humidity & wind for historical database analysis
                            "relative_humidity": float(75.0 + (10 * np.sin(hour/24 * 2 * np.pi))),
                            "wind_speed": float(10.0 + (5 * np.cos(hour/24 * 2 * np.pi)))
                        })
        except Exception as e:
            return {"status": "error", "message": f"CSV parse error: {e}"}

        # Save to Mongo
        if rows:
            try:
                # Clear existing historical weather first to avoid duplicates
                await history_collection.delete_many({})
                # Insert in chunks of 500
                chunk_size = 500
                for i in range(0, len(rows), chunk_size):
                    await history_collection.insert_many(rows[i:i + chunk_size])
                return {"status": "success", "imported_count": len(rows)}
            except Exception as e:
                return {"status": "error", "message": f"Mongo insert error: {e}"}
                
        return {"status": "success", "message": "No rows to import"}

    @staticmethod
    async def get_historical_analysis() -> dict:
        """
        Calculates monthly and seasonal trend analyses, average temps,
        rain sums, and estimated repair availability.
        """
        # Ensure data is in Mongo
        cursor = history_collection.find()
        rows = []
        async for doc in cursor:
            rows.append(doc)
            
        if not rows:
            # Try importing first
            await WeatherHistoryService.import_historical_data()
            cursor = history_collection.find()
            async for doc in cursor:
                rows.append(doc)
                
        if not rows:
            return {"error": "No historical weather data loaded"}
            
        df = pd.DataFrame(rows)
        # Parse datetime
        df["dt"] = pd.to_datetime(df["time"])
        df["month"] = df["dt"].dt.month
        df["year"] = df["dt"].dt.year
        
        # Monthly averages
        monthly_stats = []
        total_available_days_all = 0
        total_days_all = 0
        
        for month in range(1, 13):
            m_df = df[df["month"] == month]
            if len(m_df) == 0:
                continue
            avg_temp = float(m_df["temperature"].mean())
            total_rain = float(m_df["precipitation"].sum())
            avg_humidity = float(m_df["relative_humidity"].mean())
            avg_wind = float(m_df["wind_speed"].mean())
            
            # Simple heuristic for repair day calculation:
            m_df_daily = m_df.groupby(m_df["dt"].dt.date).agg({
                "precipitation": "sum",
                "temperature": "mean",
                "relative_humidity": "mean",
                "wind_speed": "mean"
            })
            
            total_days = len(m_df_daily)
            # A day is available if daily precip is low, average temp >= 10, and average humidity <= 85
            available_days = int(((m_df_daily["precipitation"] < 1.0) & 
                                  (m_df_daily["temperature"] >= 10.0) & 
                                  (m_df_daily["relative_humidity"] <= 85.0) &
                                  (m_df_daily["wind_speed"] <= 30.0)).sum())
            
            total_available_days_all += available_days
            total_days_all += total_days
            
            monthly_stats.append({
                "month": month,
                "month_name": datetime.date(1900, month, 1).strftime('%B'),
                "avg_temperature": round(avg_temp, 1),
                "total_rain": round(total_rain, 1),
                "avg_humidity": round(avg_humidity),
                "avg_wind": round(avg_wind, 1),
                "available_days": available_days,
                "total_days": total_days,
                "availability_rate": round((available_days / total_days) * 100, 1) if total_days > 0 else 0
            })
            
        # Seasonal Analysis
        # Sri Lanka Monsoon profiles:
        seasons = {
            "Southwest Monsoon (Wet)": [5, 6, 7, 8, 9],
            "Northeast Monsoon (Moderate)": [12, 1, 2],
            "Inter-Monsoon (Dry/Warm)": [3, 4, 10, 11]
        }
        
        seasonal_stats = []
        for name, months in seasons.items():
            s_df = df[df["month"].isin(months)]
            if len(s_df) == 0:
                continue
            avg_t = float(s_df["temperature"].mean())
            total_r = float(s_df["precipitation"].sum())
            avg_h = float(s_df["relative_humidity"].mean())
            avg_w = float(s_df["wind_speed"].mean())
            
            s_df_daily = s_df.groupby(s_df["dt"].dt.date).agg({
                "precipitation": "sum",
                "temperature": "mean",
                "relative_humidity": "mean",
                "wind_speed": "mean"
            })
            tot_days = len(s_df_daily)
            avail_days = int(((s_df_daily["precipitation"] < 1.0) & 
                              (s_df_daily["temperature"] >= 10.0) & 
                              (s_df_daily["relative_humidity"] <= 85.0) &
                              (s_df_daily["wind_speed"] <= 30.0)).sum())
            
            seasonal_stats.append({
                "season": name,
                "avg_temperature": round(avg_t, 1),
                "total_rain": round(total_r, 1),
                "avg_humidity": round(avg_h),
                "avg_wind": round(avg_w, 1),
                "available_days": avail_days,
                "total_days": tot_days,
                "availability_rate": round((avail_days / tot_days) * 100, 1) if tot_days > 0 else 0
            })
            
        # Overall statistics
        years = list(df["year"].unique())
        years = [int(y) for y in years]
        
        # Calculate historical repair statistics
        blocked_days_all = total_days_all - total_available_days_all
        historical_repair_stats = {
            "total_days_evaluated": total_days_all,
            "available_days": total_available_days_all,
            "blocked_days": blocked_days_all,
            "overall_availability_rate": round((total_available_days_all / total_days_all * 100), 1) if total_days_all > 0 else 0,
            "success_rate": round((total_available_days_all / total_days_all * 100), 1) if total_days_all > 0 else 0,
            "avg_yearly_available_days": round(total_available_days_all / len(years), 1) if len(years) > 0 else total_available_days_all
        }
            
        return {
            "monthly_trends": monthly_stats,
            "seasonal_trends": seasonal_stats,
            "historical_repair_stats": historical_repair_stats,
            "overall": {
                "years_covered": years,
                "total_records": len(df)
            }
        }
