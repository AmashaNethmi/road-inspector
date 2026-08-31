import random
import datetime

class AnalyticsService:
    @staticmethod
    def get_traffic_analytics(capacity: int = 2500) -> dict:
        """
        Calculates aggregates for Hourly, Daily, and Weekly traffic trends,
        identifies peak/off-peak slots, and generates congestion indexes.
        """
        # Synthesize realistic hourly count data for a 24h day
        hourly_counts = []
        peak_hours = []
        off_peak_hours = []
        total_daily_volume = 0
        
        for h in range(24):
            # Rush hours: 8 AM (hour 8) and 5 PM (hour 17)
            is_rush = h in [7, 8, 9, 16, 17, 18]
            base = 1500 if is_rush else 600
            # night hours (0-5) are very low
            if h < 6 or h > 22:
                base = 150
            random.seed(h + 42)
            count = max(40, int(base + random.uniform(-100, 100)))
            total_daily_volume += count
            
            utilization = min(100.0, round((count / capacity) * 100, 1))
            
            hourly_counts.append({
                "hour": f"{h:02d}:00",
                "vehicle_count": count,
                "utilization_pct": utilization
            })
            
            if is_rush:
                peak_hours.append(f"{h:02d}:00")
            elif h >= 20 or h < 6:
                off_peak_hours.append(f"{h:02d}:00")

        # Risk Analysis factors
        # 1. Congestion Risk
        congestion_risk = round(max(0.0, min(100.0, (total_daily_volume / 24) / capacity * 100 * 1.2)))
        # 2. Repair Delay Risk
        repair_delay_risk = round(congestion_risk * 0.9 + random.uniform(-5, 5))
        # 3. Travel Delay Risk
        travel_delay_risk = round(congestion_risk * 1.1 + random.uniform(-5, 5))
        # 4. Overall Traffic Risk
        overall_risk = round((congestion_risk + repair_delay_risk + travel_delay_risk) / 3)
        
        return {
            "daily_traffic_volume": total_daily_volume,
            "weekly_traffic_volume": total_daily_volume * 7,
            "average_hourly_count": round(total_daily_volume / 24),
            "peak_hours": peak_hours,
            "off_peak_hours": off_peak_hours,
            "hourly_counts": hourly_counts,
            "risk_analysis": {
                "congestion_risk": min(100, max(0, congestion_risk)),
                "repair_delay_risk": min(100, max(0, repair_delay_risk)),
                "travel_delay_risk": min(100, max(0, travel_delay_risk)),
                "overall_traffic_risk": min(100, max(0, overall_risk))
            }
        }
