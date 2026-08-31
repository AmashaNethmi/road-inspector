from typing import Dict, List, Any
from backend.routing.graph_service import GraphService
from backend.routing.algorithm_service import AlgorithmService
from backend.routing.road_closure_service import RoadClosureService
from backend.routing.detour_service import DetourService

class RoutingService:
    @staticmethod
    def get_intelligent_route(
        start: str = "Fort",
        target: str = "Bambalapitiya",
        blocked_road: str = None,
        traffic_congestion_pct: float = 40.0,
        weather_risk_pct: float = 30.0
    ) -> dict:
        """
        Calculates and compares optimal routes (Dijkstra vs A*), applies closures,
        integrates traffic and weather constraints, and recommends detours.
        """
        # Load Colombo Network Graph
        graph = GraphService.get_colombo_network()
        
        # Apply closures registered in RoadClosureService
        graph = RoadClosureService.apply_closures_to_graph(graph)
        
        # Convert percentages to multipliers
        traffic_mult = 1.0 + (traffic_congestion_pct / 100.0)
        weather_mult = 1.0 + (weather_risk_pct / 100.0)
        
        # 1. Run Dijkstra Algorithm
        dijkstra_res = AlgorithmService.run_dijkstra(graph, start, target, traffic_mult, weather_mult)
        
        # 2. Run A* Algorithm
        astar_res = AlgorithmService.run_astar(graph, start, target, traffic_mult, weather_mult)
        
        # 3. Calculate Detour path if there is a blocked road
        detour_res = DetourService.calculate_route_detour(
            graph, start, target, blocked_road, traffic_mult, weather_mult
        )
        
        # Format algorithm comparisons
        comparisons = [
            {
                "algorithm": "Dijkstra",
                "runtime_sec": dijkstra_res.get("runtime_sec", 0.0),
                "expanded_nodes": dijkstra_res.get("expanded_nodes", 0),
                "travel_time_sec": dijkstra_res.get("travel_time_sec", 0.0),
                "path_length_m": dijkstra_res.get("path_length_m", 0),
                "memory_bytes": dijkstra_res.get("memory_usage_bytes", 0),
                "is_best": dijkstra_res.get("runtime_sec", 0.0) < astar_res.get("runtime_sec", 0.0)
            },
            {
                "algorithm": "A* shortest-path",
                "runtime_sec": astar_res.get("runtime_sec", 0.0),
                "expanded_nodes": astar_res.get("expanded_nodes", 0),
                "travel_time_sec": astar_res.get("travel_time_sec", 0.0),
                "path_length_m": astar_res.get("path_length_m", 0),
                "memory_bytes": astar_res.get("memory_usage_bytes", 0),
                "is_best": astar_res.get("runtime_sec", 0.0) <= dijkstra_res.get("runtime_sec", 0.0)
            }
        ]
        
        # Determine best algorithm
        best_algo = min(comparisons, key=lambda x: x["runtime_sec"])["algorithm"]
        
        # Calculate Route Risk
        route_risk = detour_res["route_risk_score"]
        
        return {
            "graph": graph,
            "dijkstra": dijkstra_res,
            "astar": astar_res,
            "detour_analysis": detour_res,
            "algorithm_comparison": comparisons,
            "best_algorithm": best_algo,
            "route_risk_score": route_risk,
            "explainability": detour_res["explainability"]
        }
