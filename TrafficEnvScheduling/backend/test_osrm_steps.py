import urllib.request
import json

lat, lng = 6.936681, 79.975579
startLat = lat - 0.005
startLng = lng - 0.005
endLat = lat + 0.005
endLng = lng + 0.005

osrm_url = f"http://router.project-osrm.org/route/v1/driving/{startLng},{startLat};{endLng},{endLat}?overview=full&geometries=geojson&steps=true"
headers = {'User-Agent': 'RoadInspector/1.0'}

try:
    request = urllib.request.Request(osrm_url, headers=headers)
    with urllib.request.urlopen(request, timeout=5) as req:
        data = json.loads(req.read().decode('utf-8'))
        if data.get("code") == "Ok":
            route_data = data["routes"][0]
            steps = route_data["legs"][0]["steps"]
            print("Successfully fetched steps:")
            unique_roads = []
            for step in steps:
                name = step.get("name")
                if name and name not in unique_roads:
                    unique_roads.append(name)
            print("Roads in route:", unique_roads)
        else:
            print("OSRM returned non-OK code:", data.get("code"))
except Exception as e:
    print("Error fetching from OSRM:", e)
