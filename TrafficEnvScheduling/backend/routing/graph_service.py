import math
from typing import List, Dict, Any

class GraphService:
    @staticmethod
    def get_colombo_network() -> dict:
        """
        Generates a realistic OSMnx-style road network graph for Colombo Central area.
        Includes nodes (coordinates) and edges (road details: length, limit, capacity).
        """
        # Node coordinates representing key intersections in Colombo:
        # 1. Fort (Kollupitiya-Fort junction)
        # 2. Kollupitiya (Galle Face / Galle Rd junction)
        # 3. Bambalapitiya (Galle Rd / Dickmans Rd junction)
        # 4. Borella (Maradana / Borella junction)
        # 5. Town Hall (Viharamahadevi Park intersection)
        # 6. Maradana (Maradana Station intersection)
        # 7. Slave Island (Justice Akbar Rd junction)
        nodes = {
            "Fort": {"lat": 6.9344, "lng": 79.8519},
            "Kollupitiya": {"lat": 6.9118, "lng": 79.8510},
            "Bambalapitiya": {"lat": 6.8968, "lng": 79.8550},
            "Borella": {"lat": 6.9168, "lng": 79.8785},
            "Town Hall": {"lat": 6.9142, "lng": 79.8655},
            "Maradana": {"lat": 6.9272, "lng": 79.8640},
            "Slave Island": {"lat": 6.9230, "lng": 79.8540}
        }
        
        # Edges representing road links
        edges = [
            {"u": "Fort", "v": "Slave Island", "road_name": "Galle Rd (North)", "length_m": 1200, "speed_limit": 50, "congestion": 0.2, "closure_state": "open"},
            {"u": "Slave Island", "v": "Kollupitiya", "road_name": "Galle Rd (Mid)", "length_m": 1300, "speed_limit": 50, "congestion": 0.3, "closure_state": "open"},
            {"u": "Kollupitiya", "v": "Bambalapitiya", "road_name": "Galle Rd (South)", "length_m": 1800, "speed_limit": 50, "congestion": 0.4, "closure_state": "open"},
            {"u": "Fort", "v": "Maradana", "road_name": "Maradana Rd", "length_m": 1600, "speed_limit": 40, "congestion": 0.5, "closure_state": "open"},
            {"u": "Maradana", "v": "Borella", "road_name": "Maradana Rd East", "length_m": 2200, "speed_limit": 40, "congestion": 0.6, "closure_state": "open"},
            {"u": "Slave Island", "v": "Town Hall", "road_name": "D.R. Wijewardena Mw", "length_m": 1500, "speed_limit": 45, "congestion": 0.3, "closure_state": "open"},
            {"u": "Town Hall", "v": "Borella", "road_name": "Ward Place", "length_m": 1700, "speed_limit": 45, "congestion": 0.4, "closure_state": "open"},
            {"u": "Town Hall", "v": "Kollupitiya", "road_name": "Dharmapala Mw", "length_m": 1400, "speed_limit": 45, "congestion": 0.3, "closure_state": "open"},
            {"u": "Borella", "v": "Bambalapitiya", "road_name": "Bullers Rd", "length_m": 3100, "speed_limit": 50, "congestion": 0.4, "closure_state": "open"}
        ]
        
        return {"nodes": nodes, "edges": edges}

    @staticmethod
    def calculate_edge_cost(
        edge: dict,
        traffic_multiplier: float = 1.0,
        weather_multiplier: float = 1.0,
        closure_penalty_multiplier: float = 1.0
    ) -> float:
        """
        Calculates edge travel cost (in seconds) considering road closures,
        congestion level, weather conditions, and speed limit.
        """
        length = edge["length_m"]
        speed_limit_kmh = edge["speed_limit"]
        
        # Adjust speed limit based on congestion (traffic module integration)
        congestion = edge["congestion"] * traffic_multiplier
        adjusted_speed = max(5.0, speed_limit_kmh * (1.0 - congestion * 0.7))
        
        # Base travel time in seconds
        travel_time_sec = (length / 1000.0) / adjusted_speed * 3600.0
        
        # Apply weather penalty (weather module integration - e.g. slippery, heavy rainfall slowing speed by 30%)
        weather_penalty = 1.3 if weather_multiplier > 1.2 else 1.0
        travel_time_sec *= weather_penalty
        
        # Apply Road Closure penalties
        closure = edge["closure_state"].lower()
        if closure == "fully closed":
            travel_time_sec += 100000.0 * closure_penalty_multiplier  # huge penalty represents closed
        elif closure == "partially closed":
            travel_time_sec += 300.0  # +5 minutes penalty
        elif closure == "under repair":
            travel_time_sec += 180.0  # +3 minutes penalty
            
        return round(travel_time_sec, 2)
