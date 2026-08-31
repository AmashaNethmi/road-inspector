import os
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error

def train_all_models():
    print("Starting Training Sequence for Module 3 Models...")
    
    # Path to the dataset
    models_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
    csv_path = os.path.join(models_dir, 'road_repair_dataset.csv')
    
    if not os.path.exists(csv_path):
        print(f"Error: Dataset missing at {csv_path}")
        return
        
    try:
        df = pd.read_csv(csv_path)
        print(f"Loaded dataset with {len(df)} records.")
        
        # ── 1. Train Random Forest (Resource & Material Model) ──
        print("\n--- Training Random Forest (Resources & Materials) ---")
        rf_features = ['area_sqm', 'depth_m', 'ambient_temp_c', 'transport_time_hr', 'humidity_pct']
        rf_targets = ['hma_tonnes', 'bitumen_liters', 'labor_hours', 'machine_hours', 'total_cost_lkr']
        
        X_rf = df[rf_features]
        y_rf = df[rf_targets]
        
        X_train_rf, X_test_rf, y_train_rf, y_test_rf = train_test_split(X_rf, y_rf, test_size=0.2, random_state=42)
        
        rf = RandomForestRegressor(n_estimators=50, random_state=42, n_jobs=-1)
        rf.fit(X_train_rf, y_train_rf)
        
        rf_preds = rf.predict(X_test_rf)
        rf_mse = mean_squared_error(y_test_rf, rf_preds)
        print(f"RF Model trained successfully. Overall MSE: {rf_mse:.4f}")
        
        rf_model_path = os.path.join(models_dir, 'rf_resource_model.pkl')
        joblib.dump(rf, rf_model_path)
        print(f"Saved -> {rf_model_path}")
        
        # ── 2. Train MLP Neural Network (Thermal Model) ──
        print("\n--- Training MLP Neural Network (Thermal Model) ---")
        mlp_features = ['ambient_temp_c', 'transport_time_hr', 'humidity_pct', 'depth_m']
        mlp_targets = ['dispatch_temp_c', 'compaction_window_min']
        
        X_mlp = df[mlp_features]
        y_mlp = df[mlp_targets]
        
        X_train_mlp, X_test_mlp, y_train_mlp, y_test_mlp = train_test_split(X_mlp, y_mlp, test_size=0.2, random_state=42)
        
        scaler = StandardScaler()
        X_train_mlp_scaled = scaler.fit_transform(X_train_mlp)
        X_test_mlp_scaled = scaler.transform(X_test_mlp)
        
        mlp = MLPRegressor(hidden_layer_sizes=(64, 32), max_iter=200, random_state=42)
        mlp.fit(X_train_mlp_scaled, y_train_mlp)
        
        mlp_preds = mlp.predict(X_test_mlp_scaled)
        mlp_mse = mean_squared_error(y_test_mlp, mlp_preds)
        print(f"MLP Model trained successfully. Overall MSE: {mlp_mse:.4f}")
        
        mlp_model_path = os.path.join(models_dir, 'mlp_thermal_model.pkl')
        scaler_path = os.path.join(models_dir, 'therm_scaler.pkl')
        
        joblib.dump(mlp, mlp_model_path)
        joblib.dump(scaler, scaler_path)
        print(f"Saved -> {mlp_model_path}")
        print(f"Saved -> {scaler_path}")
        
        print("\nAll models trained and datasets synchronized successfully!")
        
    except Exception as e:
        print(f"An error occurred during training: {e}")

if __name__ == "__main__":
    train_all_models()
