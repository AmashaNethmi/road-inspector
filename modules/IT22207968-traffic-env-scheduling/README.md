# Module 2: Predictive Analytics for Optimized Pavement Maintenance Scheduling

**Lead Researcher:** Manathunga M.A.D.V.G (IT22207968)  
**Proposed Academic Title:** Predictive Analytics for Optimized Pavement Maintenance Scheduling using Real-Time Environmental and Traffic Data Fusion  
**Branch:** `feature/IT22207968-traffic-env-scheduling`

---

## Research Overview

This module develops an **AI-driven Analysis & Prediction Engine** that fuses real-time weather conditions (OpenWeather API) and live traffic density (Google Maps / TomTom APIs) with physical defect parameters to dynamically compute the optimal **"paving window"** — the time slot with minimal traffic and ideal weather for road repair.

### Research Gap
Current maintenance scheduling systems treat weather forecasting and traffic modeling as isolated domains. No integrated framework dynamically calculates the optimal repair window by combining spatial defect data, temporal traffic patterns, and environmental forecasts simultaneously.

### Novel Contribution
- **Analysis & Prediction Engine**: Random Forest model predicting repair duration and optimal window.
- **Alternate Route Suggester**: Dynamic routing to minimize congestion during repairs.

---

## Module Structure

```
IT22207968-traffic-env-scheduling/
├── README.md
├── requirements.txt
├── config/
│   ├── api_config.yaml                # API keys and endpoint config
│   └── model_config.yaml              # Random Forest hyperparameters
├── src/
│   ├── __init__.py
│   ├── data_harvesting/
│   │   ├── __init__.py
│   │   ├── weather_client.py          # OpenWeather API client
│   │   ├── traffic_client.py          # Google Maps / TomTom API client
│   │   └── sensor_fusion_hub.py       # Central data aggregation hub
│   ├── preprocessing/
│   │   ├── __init__.py
│   │   └── feature_engineer.py        # Feature normalization & integration
│   ├── prediction/
│   │   ├── __init__.py
│   │   ├── random_forest_predictor.py # Core RF prediction engine
│   │   ├── paving_window_optimizer.py # Optimal window computation
│   │   └── model_artifacts/           # Trained model pickle directory
│   ├── routing/
│   │   ├── __init__.py
│   │   └── alternate_route_suggester.py # Congestion-aware routing
│   └── output/
│       ├── __init__.py
│       └── schedule_generator.py       # Repair schedule report generator
├── tests/
│   ├── test_weather_client.py
│   ├── test_predictor.py
│   └── test_paving_window.py
├── notebooks/
│   └── exploratory_analysis.ipynb     # EDA on training data
└── scripts/
    ├── train_predictor.py              # RF model training
    └── run_scheduler.py               # Main scheduling engine entry point
```

---

## Setup & Installation

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Configure API keys
cp config/api_config.yaml.example config/api_config.yaml
# Edit api_config.yaml with your API keys
```

---

## Running the Scheduling Engine

```bash
python scripts/run_scheduler.py \
    --defect_data data/defects.json \
    --config config/api_config.yaml
```

---

## Evaluation Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| MAE | Repair duration prediction error | < 15 min |
| RMSE | Root mean square error (duration) | < 20 min |
| Schedule Efficiency | % repairs during optimal windows | > 80% |
| Traffic Delay Reduction | % congestion reduction vs baseline | > 25% |

---

## Research References

1. Breiman, L. (2001). "Random Forests." *Machine Learning*, 45, 5-32.
2. Google. (2023). *Google Maps Platform Traffic API Documentation*.
3. OpenWeather. (2023). *OpenWeather API Documentation*.
4. Arya, D., et al. (2021). "Global Road Damage Detection." *IEEE Trans. ITS*.
