import requests
import os

def download_datasets():
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)

    # 1. Chicago Potholes (Completed)
    print("Downloading Chicago potholes...")
    chicago_url = "https://data.cityofchicago.org/resource/wqdh-9gek.csv"
    chicago_params = {
        "$limit": 1000
    }
    try:
        res = requests.get(chicago_url, params=chicago_params)
        if res.status_code == 200:
            with open(os.path.join(data_dir, 'chicago_potholes.csv'), 'w', encoding='utf-8') as f:
                f.write(res.text)
            print("Successfully downloaded chicago_potholes.csv")
        else:
            print(f"Chicago failed: {res.status_code}")
    except Exception as e:
        print(f"Chicago error: {e}")

    # 2. Weather Data (Already have it, but refresh it)
    print("Downloading Weather data...")
    weather_url = "https://archive-api.open-meteo.com/v1/archive"
    weather_params = {
        "latitude": 6.9271,
        "longitude": 79.8612,
        "start_date": "2024-01-01",
        "end_date": "2024-01-31",
        "hourly": "temperature_2m,precipitation",
        "format": "csv"
    }
    try:
        res = requests.get(weather_url, params=weather_params)
        if res.status_code == 200:
            with open(os.path.join(data_dir, 'weather_history.csv'), 'w', encoding='utf-8') as f:
                f.write(res.text)
            print("Successfully downloaded weather_history.csv")
    except Exception as e:
        print(f"Weather error: {e}")

if __name__ == "__main__":
    download_datasets()
