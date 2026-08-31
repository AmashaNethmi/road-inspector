import joblib
import pandas as pd

model = joblib.load('models/duration_model_lgb.pkl')

examples = [
    # Small Crack
    {
        'defect_type': 1, 'road_type': 0, 'defect_actual_size': 1.0, 'defect_repair_size': 1.2,
        'severity_level': 0, 'weather_condition': 0, 'temperature': 22.0, 'humidity': 50.0,
        'crew_size': 3, 'traffic_level': 1
    },
    # Medium Crack
    {
        'defect_type': 1, 'road_type': 0, 'defect_actual_size': 3.0, 'defect_repair_size': 5.0,
        'severity_level': 2, 'weather_condition': 0, 'temperature': 25.0, 'humidity': 50.0,
        'crew_size': 5, 'traffic_level': 1
    },
    # Large Pothole
    {
        'defect_type': 0, 'road_type': 0, 'defect_actual_size': 8.0, 'defect_repair_size': 12.0,
        'severity_level': 3, 'weather_condition': 0, 'temperature': 28.0, 'humidity': 50.0,
        'crew_size': 6, 'traffic_level': 2
    }
]

df = pd.DataFrame(examples)
preds = model.predict(df)

names = ["Small Crack", "Medium Crack", "Large Pothole"]
for name, pred in zip(names, preds):
    hours = int(pred)
    mins = int(round((pred - hours) * 60))
    print(f"{name}: predicted {pred:.2f} hours -> {hours} hr {mins} min")
