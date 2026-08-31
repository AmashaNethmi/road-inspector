from typing import Dict

class RoadClosureService:
    # Key: road_name, Value: closure_state ("open", "fully closed", "partially closed", "under repair")
    _closures = {}

    @classmethod
    def register_road_closure(cls, road_name: str, state: str) -> None:
        """
        Registers or updates the closure state of a road edge.
        """
        valid_states = ["open", "fully closed", "partially closed", "under repair"]
        if state.lower() in valid_states:
            cls._closures[road_name] = state.lower()

    @classmethod
    def get_closures(cls) -> Dict[str, str]:
        """
        Returns all registered road closures.
        """
        return cls._closures

    @classmethod
    def apply_closures_to_graph(cls, graph: dict) -> dict:
        """
        Updates the edges of the road network with registered closure states.
        """
        for edge in graph["edges"]:
            name = edge["road_name"]
            if name in cls._closures:
                edge["closure_state"] = cls._closures[name]
        return graph
