class PriorityService:
    @staticmethod
    def calculate_priority_score(
        severity: str,
        road_priority: str,  # "local", "arterial", "highway"
        traffic_impact: float,  # 0 to 100
        weather_risk: float,  # 0 to 100
        repair_urgency: str = "medium"  # "low", "medium", "high"
    ) -> dict:
        """
        Calculates a numerical urgency score (0-100) and priority level
        based on defect characteristics, road status, and weather risks.
        """
        severity_weight = {"low": 10, "medium": 25, "high": 40, "critical": 50}
        road_weight = {"local": 10, "arterial": 20, "highway": 30}
        urgency_weight = {"low": 5, "medium": 10, "high": 20}
        
        base_sev = severity_weight.get(severity.lower(), 25)
        base_road = road_weight.get(road_priority.lower(), 20)
        base_urg = urgency_weight.get(repair_urgency.lower(), 10)
        
        # Risk factors contribution (max 10 points total)
        risk_contrib = (traffic_impact * 0.05) + (weather_risk * 0.05)
        
        raw_score = base_sev + base_road + base_urg + risk_contrib
        urgency_score = min(100.0, max(0.0, raw_score))
        
        # Priority level classification
        if urgency_score < 40:
            priority_level = "Low"
        elif urgency_score < 70:
            priority_level = "Medium"
        elif urgency_score < 88:
            priority_level = "High"
        else:
            priority_level = "Critical"
            
        return {
            "urgency_score": round(urgency_score),
            "priority_level": priority_level,
            "components": {
                "base_severity": base_sev,
                "base_road": base_road,
                "base_urgency": base_urg,
                "environmental_contribution": round(risk_contrib, 1)
            }
        }
