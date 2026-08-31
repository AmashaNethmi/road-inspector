import urllib.request
import json

url = "http://localhost:8002/predict_external"
payload = {
    "location": "6.936681, 79.975579",
    "DefectType": "crack",
    "RoadType": "asphalt",
    "DefectActualSize": "3m^3",
    "DefectRepairSize": "5m^3",
    "ServerityLevel": "High"
}

headers = {"Content-Type": "application/json"}
req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)

try:
    with urllib.request.urlopen(req) as response:
        res = json.loads(response.read().decode('utf-8'))
        print("Success! Response from API:")
        print(json.dumps(res, indent=2))
except Exception as e:
    print(f"Error calling API (is the backend server running?): {e}")
