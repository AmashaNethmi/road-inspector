import os
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error

def train_material_model():
    print("Starting Module 3 Random Forest Training Sequence...")
    
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'datasets', 'tabular_data'))
    csv_path = os.path.join(base_dir, 'rda_material_norms.csv')
    
    models_dir = os.path.join(os.path.dirname(__file__), 'models')
    os.makedirs(models_dir, exist_ok=True)
    
    # Check if data exists and is populated
    if not os.path.exists(csv_path) or os.path.getsize(csv_path) == 0:
        print(f"Warning: Tabular dataset is empty or missing: {csv_path}")
        print("Please populate the CSV file with historical RDA norms before running training.")
        return
        
    try:
        # Load dataset
        df = pd.read_csv(csv_path)
        
        # Assuming the CSV has columns like: ['Area_sqm', 'Depth_m', 'Ambient_Temp_C', 'Actual_Asphalt_Tonnage']
        X = df[['Area_sqm', 'Depth_m', 'Ambient_Temp_C']]
        y = df['Actual_Asphalt_Tonnage']
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Initialize and Train Random Forest Regressor
        print("Training Random Forest Regressor...")
        rf = RandomForestRegressor(n_estimators=100, random_state=42)
        rf.fit(X_train, y_train)
        
        # Evaluate
        predictions = rf.predict(X_test)
        mse = mean_squared_error(y_test, predictions)
        print(f"Model trained successfully. Mean Squared Error: {mse:.4f}")
        
        # Save model isolated to Module 3
        model_path = os.path.join(models_dir, 'rf_material_model.pkl')
        joblib.dump(rf, model_path)
        print(f"Random Forest weights saved to {model_path}")
        
    except Exception as e:
        print(f"An error occurred during training: {e}")

if __name__ == "__main__":
    train_material_model()
