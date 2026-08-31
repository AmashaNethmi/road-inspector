import joblib
import pandas as pd
import numpy as np
from datetime import datetime

# Load models
try:
    w_m = joblib.load('models/weather_model.pkl')
    t_m = joblib.load('models/traffic_model.pkl')
    d_m = joblib.load('models/duration_model.pkl')
    print("Models loaded successfully!")
except Exception as e:
    print(f"Error loading models: {e}")
    exit(1)

# Input data
lat, lng = 6.936681, 79.975579
defect_type = 'crack' # mapped to 1
defect_type_num = 1 # pothole=0, crack=1, rutting=2, erosion=3
road_type = 'asphalt'
defect_actual_size = 3.0 # m^3
defect_repair_size = 5.0 # m^3
severity_level = 'High'
severity_num = 5

# Predict over 24 hours to find the most accurate/optimal time to start the repair
# We want: 
# - lowest traffic (traffic flow level 0 or 1)
# - clear weather (precipitation close to 0)
# - reasonable temperature

results = []
day_of_week = datetime.now().weekday()
month = datetime.now().month

# The duration model depends on weather (temp) and traffic
# Let's compute for each hour of the day
for hour in range(24):
    # Predict weather: temp, precip, wind, humidity
    w_res = w_m.predict(pd.DataFrame([{'location': 0, 'hour': hour, 'day_of_week': day_of_week, 'month': month}]))[0]
    temp, precip, wind, humidity = w_res
    
    # Predict traffic flow
    t_res = int(t_m.predict(pd.DataFrame([{'location': 0, 'hour': hour, 'day_of_week': day_of_week, 'weather': temp}]))[0])
    
    # Calculate duration
    # Since defect_repair_size is 5.0 m^3, if we assume 10cm depth, defect_size_scalar = 5.0 * 100 = 500
    # Let's run prediction for size = 500.0 (and also test 5.0 just in case)
    defect_size_scalar = defect_repair_size * 100.0
    
    d_df = pd.DataFrame([{
        'location': 0, 
        'defect_type': defect_type_num, 
        'defect_size': defect_size_scalar, 
        'materials': 0, 
        'equipment': 0, 
        'workers': 2 + severity_num, 
        'weather': temp, 
        'traffic': t_res
    }])
    d_res = float(d_m.predict(d_df)[0])
    predicted_hours = max(1.0, round(d_res, 2))
    
    results.append({
        'hour': hour,
        'temp': temp,
        'precip': precip,
        'traffic': t_res,
        'duration': predicted_hours
    })

# Output the results sorted by a score:
# Score = traffic * 2.0 + precip * 5.0 (we want to minimize this score)
# Also temperature should preferably be optimal for asphalt (> 20C or so)
for r in results:
    # Traffic flow level: 0 = low, 1 = moderate, 2 = high, 3 = heavy
    traffic_score = r['traffic']
    precip_score = r['precip']
    
    # If precipitation is high, add a heavy penalty (asphalt cannot be laid in rain)
    rain_penalty = 100 if r['precip'] > 0.2 else 0
    # Prefer late night/early morning hours for high-severity highway/asphalt cracks to minimize disruption
    # or daylight hours if night work is restricted.
    # Let's compute a simple feasibility/optimal score:
    r['score'] = traffic_score * 3.0 + precip_score * 10.0 + rain_penalty

# Sort by score ascending
best_hours = sorted(results, key=lambda x: x['score'])

print("\n--- Top 3 Most Accurate/Optimal Start Times ---")
for i in range(3):
    bh = best_hours[i]
    hour_formatted = f"{bh['hour']:02d}:00"
    traffic_desc = {0: 'Low', 1: 'Moderate', 2: 'High', 3: 'Heavy'}.get(bh['traffic'], 'Moderate')
    print(f"{i+1}. Hour: {hour_formatted}")
    print(f"   Weather: {bh['temp']:.1f}°C, Precipitation Chance: {bh['precip']*100:.1f}%")
    print(f"   Traffic: {traffic_desc}")
    print(f"   Estimated Time Consumed (Repair Duration): {bh['duration']:.2f} hours")
    print(f"   Optimization Score: {bh['score']:.2f}")

# Also check with size = 5.0 (if the scalar is volume in m^3 directly)
d_df_raw = pd.DataFrame([{
    'location': 0, 
    'defect_type': defect_type_num, 
    'defect_size': defect_repair_size, # 5.0
    'materials': 0, 
    'equipment': 0, 
    'workers': 2 + severity_num, 
    'weather': best_hours[0]['temp'], 
    'traffic': best_hours[0]['traffic']
}])
d_res_raw = float(d_m.predict(d_df_raw)[0])
print(f"\nNote: If model treats defect_size directly as m^3 volume (5.0), predicted duration is: {d_res_raw:.2f} hours")
