import datetime
from typing import List, Dict, Any

class ResourceService:
    @staticmethod
    def get_available_resources() -> dict:
        """
        Returns the list of available Crews and Equipment in the system.
        """
        return {
            "crews": [
                {"id": "crew_a", "name": "Crew Alpha (Asphalt Specialists)", "max_hours_per_day": 10},
                {"id": "crew_b", "name": "Crew Beta (Expressway Team)", "max_hours_per_day": 10},
                {"id": "crew_c", "name": "Crew Gamma (Emergency Support)", "max_hours_per_day": 12}
            ],
            "equipment": [
                {"id": "compactor_1", "name": "Asphalt Compactor A", "type": "Compactor"},
                {"id": "compactor_2", "name": "Asphalt Compactor B", "type": "Compactor"},
                {"id": "excavator_1", "name": "Heavy Excavator", "type": "Excavator"},
                {"id": "paver_1", "name": "Asphalt Paver", "type": "Paver"}
            ]
        }

    @staticmethod
    def detect_conflicts(scheduled_jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Scans scheduled jobs and detects conflicts where:
        - The same Crew is assigned to overlapping time slots.
        - The same Equipment is assigned to overlapping time slots.
        - A crew exceeds their maximum daily working hours.
        """
        conflicts = []
        
        # Helper to check overlap
        def is_overlap(start1, end1, start2, end2):
            s1 = datetime.datetime.fromisoformat(start1.replace('Z', ''))
            e1 = datetime.datetime.fromisoformat(end1.replace('Z', ''))
            s2 = datetime.datetime.fromisoformat(start2.replace('Z', ''))
            e2 = datetime.datetime.fromisoformat(end2.replace('Z', ''))
            return max(s1, s2) < min(e1, e2)

        # 1. Check overlaps
        n = len(scheduled_jobs)
        for i in range(n):
            job1 = scheduled_jobs[i]
            for j in range(i + 1, n):
                job2 = scheduled_jobs[j]
                
                if is_overlap(job1["start_time"], job1["end_time"], job2["start_time"], job2["end_time"]):
                    # Crew conflict
                    if job1.get("crew_id") == job2.get("crew_id") and job1.get("crew_id"):
                        conflicts.append({
                            "type": "Crew Overlap Conflict",
                            "resource_id": job1["crew_id"],
                            "job_ids": [job1.get("id"), job2.get("id")],
                            "message": f"Crew '{job1['crew_id']}' is assigned to overlapping repairs starting at {job1['start_time']} and {job2['start_time']}."
                        })
                    
                    # Equipment conflicts
                    eqs1 = set(job1.get("equipment_ids", []))
                    eqs2 = set(job2.get("equipment_ids", []))
                    common_eq = eqs1.intersection(eqs2)
                    for eq in common_eq:
                        conflicts.append({
                            "type": "Equipment Overlap Conflict",
                            "resource_id": eq,
                            "job_ids": [job1.get("id"), job2.get("id")],
                            "message": f"Equipment '{eq}' is assigned to overlapping repairs starting at {job1['start_time']} and {job2['start_time']}."
                        })
                        
        # 2. Check max daily hours
        crew_daily_hours = {}
        for job in scheduled_jobs:
            crew = job.get("crew_id")
            if not crew:
                continue
            date_str = job["start_time"][:10]
            dur = job.get("duration", 4.0)
            
            key = (crew, date_str)
            crew_daily_hours[key] = crew_daily_hours.get(key, 0.0) + dur
            
        crew_limits = {c["id"]: c["max_hours_per_day"] for c in ResourceService.get_available_resources()["crews"]}
        for (crew, date_str), hours in crew_daily_hours.items():
            limit = crew_limits.get(crew, 10)
            if hours > limit:
                conflicts.append({
                    "type": "Crew Work-Hours Overload",
                    "resource_id": crew,
                    "date": date_str,
                    "hours": hours,
                    "limit": limit,
                    "message": f"Crew '{crew}' is scheduled for {hours} hours on {date_str}, exceeding their daily limit of {limit} hours."
                })
                
        return conflicts
