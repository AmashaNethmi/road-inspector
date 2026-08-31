import joblib, pandas as pd
w_m = joblib.load(open('models/weather_model.pkl', 'rb'))
t_m = joblib.load(open('models/traffic_model.pkl', 'rb'))
d_m = joblib.load(open('models/duration_model.pkl', 'rb'))
w_res = w_m.predict(pd.DataFrame([{'location':0, 'hour':12, 'day_of_week':0, 'month':5}]))[0]
print('weather:', w_res)
t_res = t_m.predict(pd.DataFrame([{'location':0, 'hour':12, 'day_of_week':0, 'weather':w_res[0]}]))[0]
print('traffic:', t_res)
d_res = d_m.predict(pd.DataFrame([{'location':0, 'defect_type':0, 'defect_size':2.5, 'materials':0, 'equipment':0, 'workers':3, 'weather':w_res[0], 'traffic':t_res}]))[0]
print('duration:', d_res)
