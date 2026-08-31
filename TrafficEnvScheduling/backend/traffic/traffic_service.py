import datetime
import random

class TrafficService:
    @staticmethod
    def get_live_yolo_counts() -> dict:
        """
        Simulates real-time YOLO vehicle detection counts for various classes:
        Car, Bus, Truck, Motorcycle, Van, Bicycle.
        """
        now = datetime.datetime.now()
        # Heuristic count based on time of day (rush hours have more counts)
        hour = now.hour + now.minute / 60.0
        is_rush = (7 <= hour <= 9) or (16.5 <= hour <= 19)
        base_count = 180 if is_rush else 60
        
        car_count = int(base_count * random.uniform(0.5, 0.7))
        bus_count = int(base_count * random.uniform(0.05, 0.15))
        truck_count = int(base_count * random.uniform(0.05, 0.10))
        moto_count = int(base_count * random.uniform(0.15, 0.25))
        van_count = int(base_count * random.uniform(0.08, 0.15))
        bike_count = int(base_count * random.uniform(0.02, 0.05))
        
        total = car_count + bus_count + truck_count + moto_count + van_count + bike_count
        
        return {
            "timestamp": now.isoformat(),
            "classes": {
                "car": car_count,
                "bus": bus_count,
                "truck": truck_count,
                "motorcycle": moto_count,
                "van": van_count,
                "bicycle": bike_count
            },
            "total_count": total
        }

    @staticmethod
    def calculate_current_status(vehicle_count: int, capacity: int = 2500) -> dict:
        """
        Calculates live traffic density, utilization, average speed, and congestion levels.
        """
        utilization = min(100.0, round((vehicle_count / capacity) * 100, 1))
        
        # Speed estimate drops as utilization increases
        base_speed = 60.0  # km/h limit
        avg_speed = max(10.0, base_speed - (utilization * 0.5))
        
        # Congestion classification
        if utilization < 30:
            congestion_level = "Low"
        elif utilization < 60:
            congestion_level = "Medium"
        elif utilization < 85:
            congestion_level = "High"
        else:
            congestion_level = "Very High"
            
        # Traffic risk calculation (0-100)
        risk_score = round(utilization * 0.8 + (100 - avg_speed) * 0.2)
        
        return {
            "vehicle_count": vehicle_count,
            "road_capacity": capacity,
            "utilization_pct": utilization,
            "average_speed_kmh": round(avg_speed, 1),
            "congestion_level": congestion_level,
            "risk_score": risk_score
        }
