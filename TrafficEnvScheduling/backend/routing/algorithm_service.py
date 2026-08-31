import math
import heapq
import time
import sys
from typing import List, Dict, Any, Tuple
from backend.routing.graph_service import GraphService

class AlgorithmService:
    @staticmethod
    def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """
        Admissible heuristic calculating straight line distance in km between two coordinate pairs.
        """
        R = 6371.0  # Earth's radius in km
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
        c = 2 * math.asin(math.sqrt(a))
        return R * c

    @staticmethod
    def get_heuristic(u: str, target: str, nodes: dict) -> float:
        """
        Travel time heuristic: straight line distance divided by maximum design speed limit (50 km/h) in seconds.
        """
        d = AlgorithmService.haversine_distance(
            nodes[u]["lat"], nodes[u]["lng"],
            nodes[target]["lat"], nodes[target]["lng"]
        )
        return (d / 50.0) * 3600.0  # travel time in seconds

    @staticmethod
    def run_dijkstra(
        graph: dict,
        start: str,
        target: str,
        traffic_multiplier: float = 1.0,
        weather_multiplier: float = 1.0
    ) -> dict:
        """
        Manually implemented Dijkstra algorithm.
        Tracks expanded nodes, runtime, path length, and memory.
        """
        t0 = time.time()
        nodes = graph["nodes"]
        edges = graph["edges"]
        
        # Build adjacency
        adj = {n: [] for n in nodes}
        for edge in edges:
            cost = GraphService.calculate_edge_cost(edge, traffic_multiplier, weather_multiplier)
            adj[edge["u"]].append((edge["v"], cost, edge["road_name"], edge["length_m"]))
            adj[edge["v"]].append((edge["u"], cost, edge["road_name"], edge["length_m"])) # undirected
            
        # Priority Queue: (cost, node, path, path_names, distance)
        queue = [(0.0, start, [start], [], 0)]
        visited = set()
        expanded_nodes = 0
        
        while queue:
            cost, u, path, path_names, distance = heapq.heappop(queue)
            
            if u in visited:
                continue
            visited.add(u)
            expanded_nodes += 1
            
            if u == target:
                runtime = time.time() - t0
                return {
                    "algorithm": "Dijkstra",
                    "path": path,
                    "roads": path_names,
                    "travel_time_sec": round(cost, 1),
                    "path_length_m": distance,
                    "expanded_nodes": expanded_nodes,
                    "runtime_sec": round(runtime, 5),
                    "memory_usage_bytes": sys.getsizeof(visited) + sys.getsizeof(queue)
                }
                
            for v, weight, road_name, length in adj[u]:
                if v not in visited:
                    heapq.heappush(queue, (cost + weight, v, path + [v], path_names + [road_name], distance + length))
                    
        return {"error": "Path not found"}

    @staticmethod
    def run_astar(
        graph: dict,
        start: str,
        target: str,
        traffic_multiplier: float = 1.0,
        weather_multiplier: float = 1.0
    ) -> dict:
        """
        Manually implemented A* shortest-path algorithm using the Haversine heuristic.
        Tracks expanded nodes, runtime, path length, and memory.
        """
        t0 = time.time()
        nodes = graph["nodes"]
        edges = graph["edges"]
        
        # Build adjacency
        adj = {n: [] for n in nodes}
        for edge in edges:
            cost = GraphService.calculate_edge_cost(edge, traffic_multiplier, weather_multiplier)
            adj[edge["u"]].append((edge["v"], cost, edge["road_name"], edge["length_m"]))
            adj[edge["v"]].append((edge["u"], cost, edge["road_name"], edge["length_m"]))
            
        # Priority Queue stores: (f_score, g_score, node, path, path_names, distance)
        # f_score = g_score + heuristic
        h_start = AlgorithmService.get_heuristic(start, target, nodes)
        queue = [(h_start, 0.0, start, [start], [], 0)]
        visited = set()
        expanded_nodes = 0
        
        while queue:
            f, g, u, path, path_names, distance = heapq.heappop(queue)
            
            if u in visited:
                continue
            visited.add(u)
            expanded_nodes += 1
            
            if u == target:
                runtime = time.time() - t0
                return {
                    "algorithm": "A*",
                    "path": path,
                    "roads": path_names,
                    "travel_time_sec": round(g, 1),
                    "path_length_m": distance,
                    "expanded_nodes": expanded_nodes,
                    "runtime_sec": round(runtime, 5),
                    "memory_usage_bytes": sys.getsizeof(visited) + sys.getsizeof(queue)
                }
                
            for v, weight, road_name, length in adj[u]:
                if v not in visited:
                    g_new = g + weight
                    h_new = AlgorithmService.get_heuristic(v, target, nodes)
                    f_new = g_new + h_new
                    heapq.heappush(queue, (f_new, g_new, v, path + [v], path_names + [road_name], distance + length))
                    
        return {"error": "Path not found"}
